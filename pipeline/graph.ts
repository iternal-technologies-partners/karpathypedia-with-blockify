/**
 * pipeline/graph.ts — Graph construction + Louvain community detection
 *
 * Builds an undirected weighted graph of IdeaBlocks and Entities,
 * runs Louvain community detection, then refines communities into
 * article-sized groups for wiki compilation.
 *
 * Pipeline stage: Distill → [Graph] → Compile
 */

import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';
import type {
  IdeaBlock,
  PipelineConfig,
  Community,
  GraphResult,
} from './types';

// ---------------------------------------------------------------------------
// Node / edge attribute interfaces (internal)
// ---------------------------------------------------------------------------

interface EntityNodeAttrs {
  type: 'entity';
  entityType: string;
  mentionCount: number;
}

interface BlockNodeAttrs {
  type: 'block';
  blockId: string;
  name: string;
}

type NodeAttrs = EntityNodeAttrs | BlockNodeAttrs;

interface EdgeAttrs {
  weight: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Canonical key for an entity node (lowercased, prefixed). */
function entityKey(name: string): string {
  return `entity:${name.toLowerCase()}`;
}

/** Canonical key for a block node (prefixed). */
function blockKey(id: string): string {
  return `block:${id}`;
}

/** Compute the intersection size of two Sets. */
function intersectionSize(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const item of a) {
    if (b.has(item)) count++;
  }
  return count;
}

/** Jaccard similarity: |A ∩ B| / |A ∪ B|. Returns 0 when both empty. */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  const inter = intersectionSize(a, b);
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Add weight to an edge, creating it if it doesn't exist.
 * graphology's mergeEdge doesn't accumulate weights — it overwrites attrs —
 * so we check existence first and update manually.
 */
function addOrAccumulateEdge(
  graph: Graph<NodeAttrs, EdgeAttrs>,
  source: string,
  target: string,
  additionalWeight: number,
): void {
  if (graph.hasEdge(source, target)) {
    const current = graph.getEdgeAttribute(source, target, 'weight') ?? 0;
    graph.setEdgeAttribute(source, target, 'weight', current + additionalWeight);
  } else {
    graph.addUndirectedEdge(source, target, { weight: additionalWeight });
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function buildGraphAndDetectCommunities(
  blocks: IdeaBlock[],
  config: PipelineConfig,
): Promise<GraphResult> {
  // Handle empty input gracefully
  if (blocks.length === 0) {
    console.log('[graph] No blocks provided — returning empty result');
    return { communities: [], totalNodes: 0, totalEdges: 0, modularity: 0 };
  }

  // ------------------------------------------------------------------
  // Step 1: Build block-only graph with semantic similarity edges
  // ------------------------------------------------------------------
  //
  // GraphRAG-inspired approach: nodes are blocks (documents), edges encode
  // multi-signal similarity. Entity information is used to weight edges
  // but entities are NOT separate nodes — this prevents the bipartite
  // graph problem where shared entities cause cascade merging.

  const graph = new Graph<NodeAttrs, EdgeAttrs>({ type: 'undirected' });

  // Collect unique entities for topic derivation (metadata only, not graph nodes)
  const entityTypeMap = new Map<string, string>(); // lowercased name → entityType
  for (const block of blocks) {
    for (const ent of block.entities) {
      entityTypeMap.set(ent.name.toLowerCase(), ent.type);
    }
  }

  console.log(
    `[graph] Building block-only graph from ${blocks.length} blocks (${entityTypeMap.size} unique entities as metadata)`,
  );

  // Pre-compute per-block feature sets (all lowercased for comparison)
  const blockEntitySets = new Map<string, Set<string>>();
  const blockKeywordSets = new Map<string, Set<string>>();
  const blockTagSets = new Map<string, Set<string>>();

  for (const block of blocks) {
    blockEntitySets.set(block.id, new Set(block.entities.map((e) => e.name.toLowerCase())));
    blockKeywordSets.set(block.id, new Set(block.keywords.map((k) => k.toLowerCase())));
    blockTagSets.set(block.id, new Set(block.tags.map((t) => t.toLowerCase())));
  }

  // Add block nodes
  for (const block of blocks) {
    graph.mergeNode(blockKey(block.id), {
      type: 'block' as const,
      blockId: block.id,
      name: block.name,
    });
  }

  // Add edges: combined Jaccard similarity across entities, keywords, and tags
  // Weight = 0.45 * entityJaccard + 0.35 * keywordJaccard + 0.20 * tagJaccard
  // Only add edges above a meaningful threshold to keep the graph sparse
  const EDGE_THRESHOLD = 0.15; // lower than distill threshold — we want connectivity

  let edgesAdded = 0;
  for (let i = 0; i < blocks.length; i++) {
    const aId = blocks[i].id;
    const aEntities = blockEntitySets.get(aId)!;
    const aKeywords = blockKeywordSets.get(aId)!;
    const aTags = blockTagSets.get(aId)!;

    for (let j = i + 1; j < blocks.length; j++) {
      const bId = blocks[j].id;
      const bEntities = blockEntitySets.get(bId)!;
      const bKeywords = blockKeywordSets.get(bId)!;
      const bTags = blockTagSets.get(bId)!;

      const entityJaccard = jaccard(aEntities, bEntities);
      const keywordJaccard = jaccard(aKeywords, bKeywords);
      const tagJaccard = jaccard(aTags, bTags);

      const weight = 0.45 * entityJaccard + 0.35 * keywordJaccard + 0.20 * tagJaccard;

      if (weight >= EDGE_THRESHOLD) {
        addOrAccumulateEdge(graph, blockKey(aId), blockKey(bId), weight);
        edgesAdded++;
      }
    }
  }

  if (config.verbose) {
    console.log(`[graph] Added ${edgesAdded} block↔block edges above threshold ${EDGE_THRESHOLD}`);
  }

  console.log(`[graph] Graph: ${graph.order} nodes, ${graph.size} edges`);

  // ------------------------------------------------------------------
  // Step 2: Run Louvain community detection
  // ------------------------------------------------------------------

  // Louvain requires at least one edge to work; degenerate graphs get single community
  if (graph.size === 0) {
    console.log('[graph] Graph has no edges — assigning all blocks to a single community');
    const singleCommunity: Community = {
      id: 0,
      level: blocks.length <= 5 ? 0 : blocks.length <= 25 ? 1 : 2,
      topic: deriveTopic(blocks, graph),
      blocks,
      entityNames: [...entityTypeMap.keys()],
      neighborCommunityIds: [],
    };
    return {
      communities: [singleCommunity],
      totalNodes: graph.order,
      totalEdges: graph.size,
      modularity: 0,
    };
  }

  const details = louvain.detailed(graph, {
    resolution: config.louvainResolution,
    getEdgeWeight: 'weight',
  });

  const communityMapping = details.communities; // node → communityId

  console.log(
    `[graph] Louvain found ${details.count} communities (modularity: ${details.modularity.toFixed(3)})`,
  );

  // ------------------------------------------------------------------
  // Step 3: Build hierarchical communities
  // ------------------------------------------------------------------

  // 3a. Group block nodes by community
  const rawCommunities = groupBlocksByCommunity(blocks, communityMapping);

  // 3b. Build Community objects with metadata
  let communities = rawCommunities.map(({ communityId, communityBlocks }) =>
    buildCommunityObject(communityId, communityBlocks, graph, communityMapping),
  );

  // 3c. Split level-2 (too large) communities recursively
  communities = splitLargeCommunities(communities, graph, config);

  // 3d. Merge level-0 (too small) communities
  communities = mergeSmallCommunities(communities, graph, communityMapping);

  // Re-number community IDs sequentially
  communities = communities.map((c, idx) => ({ ...c, id: idx }));

  // Rebuild neighbor lists after re-numbering
  communities = rebuildNeighborLists(communities, graph);

  // Sort by community ID
  communities.sort((a, b) => a.id - b.id);

  console.log(`[graph] After refinement: ${communities.length} article-level communities`);
  for (const c of communities) {
    console.log(
      `[graph] Community "${c.topic}": ${c.blocks.length} blocks, ${c.entityNames.length} entities`,
    );
  }

  return {
    communities,
    totalNodes: graph.order,
    totalEdges: graph.size,
    modularity: details.modularity,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Group blocks by their Louvain community assignment.
 */
function groupBlocksByCommunity(
  blocks: IdeaBlock[],
  communityMapping: { [node: string]: number },
): { communityId: number; communityBlocks: IdeaBlock[] }[] {
  const map = new Map<number, IdeaBlock[]>();

  for (const block of blocks) {
    const bKey = blockKey(block.id);
    const cid = communityMapping[bKey] ?? 0;
    if (!map.has(cid)) map.set(cid, []);
    map.get(cid)!.push(block);
  }

  return [...map.entries()].map(([communityId, communityBlocks]) => ({
    communityId,
    communityBlocks,
  }));
}

/**
 * Derive the community topic from the highest-degree entity node
 * within a set of blocks. Falls back to the first block's name.
 */
function deriveTopic(
  communityBlocks: IdeaBlock[],
  graph: Graph<NodeAttrs, EdgeAttrs>,
): string {
  // Count how many blocks in this community mention each entity
  const entityBlockCount = new Map<string, number>();
  for (const block of communityBlocks) {
    const seen = new Set<string>();
    for (const ent of block.entities) {
      const key = ent.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        entityBlockCount.set(key, (entityBlockCount.get(key) ?? 0) + 1);
      }
    }
  }

  // Find the entity mentioned by the most blocks (tie-break alphabetically for stability)
  let bestEntity = '';
  let bestCount = 0;
  for (const [name, count] of entityBlockCount) {
    if (count > bestCount || (count === bestCount && name < bestEntity)) {
      bestEntity = name;
      bestCount = count;
    }
  }

  if (bestEntity) {
    // Title-case the entity name
    return bestEntity
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // Fallback to first block name
  return communityBlocks[0]?.name ?? 'Unknown Topic';
}

/**
 * Build a Community object from a set of blocks assigned to the same community.
 */
function buildCommunityObject(
  communityId: number,
  communityBlocks: IdeaBlock[],
  graph: Graph<NodeAttrs, EdgeAttrs>,
  communityMapping: { [node: string]: number },
): Community {
  // Collect all entity names from these blocks
  const entityNamesSet = new Set<string>();
  for (const block of communityBlocks) {
    for (const ent of block.entities) {
      entityNamesSet.add(ent.name.toLowerCase());
    }
  }

  // Determine level by block count
  // Level thresholds scale with dataset size to avoid over-merging small corpora
  const n = communityBlocks.length;
  const level = n <= 2 ? 0 : n <= 25 ? 1 : 2;

  // Find neighbor communities via cross-community block↔block edges
  const neighborIds = new Set<number>();
  for (const block of communityBlocks) {
    const bKey = blockKey(block.id);
    if (!graph.hasNode(bKey)) continue;
    graph.forEachEdge(bKey, (_edge, _attrs, source, target) => {
      const other = source === bKey ? target : source;
      const otherCid = communityMapping[other];
      if (otherCid !== undefined && otherCid !== communityId) {
        neighborIds.add(otherCid);
      }
    });
  }

  return {
    id: communityId,
    level,
    topic: deriveTopic(communityBlocks, graph),
    blocks: communityBlocks,
    entityNames: [...entityNamesSet],
    neighborCommunityIds: [...neighborIds],
  };
}

/**
 * Split level-2 (26+ blocks) communities by re-running Louvain at
 * higher resolution on the subgraph. Recurse until all are level 0 or 1.
 */
function splitLargeCommunities(
  communities: Community[],
  graph: Graph<NodeAttrs, EdgeAttrs>,
  config: PipelineConfig,
): Community[] {
  const result: Community[] = [];

  for (const community of communities) {
    if (community.level < 2) {
      result.push(community);
      continue;
    }

    const subcommunities = splitCommunityRecursive(
      community,
      graph,
      config.louvainResolution * 1.5,
    );
    result.push(...subcommunities);
  }

  return result;
}

/**
 * Recursively split a too-large community until all sub-communities
 * are level 0 (<=5 blocks) or level 1 (6-25 blocks).
 */
function splitCommunityRecursive(
  community: Community,
  fullGraph: Graph<NodeAttrs, EdgeAttrs>,
  resolution: number,
): Community[] {
  if (community.blocks.length <= 25) {
    // Recalculate level after split
    const level = community.blocks.length <= 5 ? 0 : 1;
    return [{ ...community, level }];
  }

  // Build subgraph with only block nodes from this community
  const subgraph = new Graph<NodeAttrs, EdgeAttrs>({ type: 'undirected' });

  const blockKeys = new Set<string>();
  for (const block of community.blocks) {
    const bKey = blockKey(block.id);
    blockKeys.add(bKey);
    if (fullGraph.hasNode(bKey)) {
      subgraph.mergeNode(bKey, fullGraph.getNodeAttributes(bKey));
    }
  }

  // Add edges between block nodes within this community
  fullGraph.forEachEdge(
    (_edge, attrs, source, target) => {
      if (blockKeys.has(source) && blockKeys.has(target)) {
        if (!subgraph.hasEdge(source, target)) {
          subgraph.addUndirectedEdge(source, target, { ...attrs });
        }
      }
    },
  );

  // If no edges, can't split further — return as-is
  if (subgraph.size === 0) {
    const level = community.blocks.length <= 5 ? 0 : community.blocks.length <= 25 ? 1 : 2;
    return [{ ...community, level }];
  }

  // Run Louvain on the subgraph at higher resolution
  const subMapping = louvain(subgraph, {
    resolution,
    getEdgeWeight: 'weight',
  });

  // Group blocks by sub-community
  const subGroups = new Map<number, IdeaBlock[]>();
  for (const block of community.blocks) {
    const bKey = blockKey(block.id);
    const subCid = subMapping[bKey] ?? 0;
    if (!subGroups.has(subCid)) subGroups.set(subCid, []);
    subGroups.get(subCid)!.push(block);
  }

  // If Louvain only found one community, we can't split further
  if (subGroups.size <= 1) {
    const level = community.blocks.length <= 5 ? 0 : community.blocks.length <= 25 ? 1 : 2;
    return [{ ...community, level }];
  }

  // Recursively split any sub-community that's still too large
  const result: Community[] = [];
  for (const [subCid, subBlocks] of subGroups) {
    const entityNamesSet = new Set<string>();
    for (const block of subBlocks) {
      for (const ent of block.entities) {
        entityNamesSet.add(ent.name.toLowerCase());
      }
    }

    const subLevel = subBlocks.length <= 5 ? 0 : subBlocks.length <= 25 ? 1 : 2;
    const subCommunity: Community = {
      id: subCid,
      level: subLevel,
      topic: deriveTopic(subBlocks, fullGraph),
      blocks: subBlocks,
      entityNames: [...entityNamesSet],
      neighborCommunityIds: [], // rebuilt later
    };

    if (subLevel === 2) {
      result.push(
        ...splitCommunityRecursive(subCommunity, fullGraph, resolution * 1.5),
      );
    } else {
      result.push(subCommunity);
    }
  }

  return result;
}

/**
 * Merge level-0 (singleton) communities with their most-connected neighbor.
 * Only merges communities with a single block — communities with 2+ blocks
 * are promoted to level 1 to avoid cascade merging.
 */
function mergeSmallCommunities(
  communities: Community[],
  graph: Graph<NodeAttrs, EdgeAttrs>,
  communityMapping: { [node: string]: number },
): Community[] {
  // Build a mutable map of communityId → Community
  const communityMap = new Map<number, Community>();
  for (const c of communities) {
    communityMap.set(c.id, c);
  }

  // Build a map from block key → current community id (mutable as we merge)
  const blockToCommunity = new Map<string, number>();
  for (const c of communities) {
    for (const block of c.blocks) {
      blockToCommunity.set(blockKey(block.id), c.id);
    }
  }

  let changed = true;
  while (changed) {
    changed = false;

    // Only merge singleton communities (1 block) — this prevents cascade merging
    const smallCommunity = [...communityMap.values()].find(
      (c) => c.blocks.length === 1 && c.level === 0,
    );
    if (!smallCommunity) break;

    // Find the most-connected neighbor community by total edge weight
    const neighborWeights = new Map<number, number>();

    for (const block of smallCommunity.blocks) {
      const bKey = blockKey(block.id);
      if (!graph.hasNode(bKey)) continue;

      graph.forEachEdge(bKey, (_edge, attrs, source, target) => {
        const otherKey = source === bKey ? target : source;
        const otherCid = blockToCommunity.get(otherKey);
        if (otherCid !== undefined && otherCid !== smallCommunity.id) {
          neighborWeights.set(
            otherCid,
            (neighborWeights.get(otherCid) ?? 0) + (attrs.weight ?? 0),
          );
        }
      });
    }

    if (neighborWeights.size === 0) {
      // No neighbors to merge with — promote to level 1 to stop looping
      communityMap.set(smallCommunity.id, { ...smallCommunity, level: 1 });
      changed = true;
      continue;
    }

    // Pick the neighbor with highest total edge weight
    let bestNeighborId = -1;
    let bestWeight = -1;
    for (const [nid, w] of neighborWeights) {
      if (w > bestWeight && communityMap.has(nid)) {
        bestWeight = w;
        bestNeighborId = nid;
      }
    }

    if (bestNeighborId === -1) {
      communityMap.set(smallCommunity.id, { ...smallCommunity, level: 1 });
      changed = true;
      continue;
    }

    // Merge small community into the best neighbor
    const target = communityMap.get(bestNeighborId)!;
    const mergedBlocks = [...target.blocks, ...smallCommunity.blocks];
    const mergedEntities = new Set([
      ...target.entityNames,
      ...smallCommunity.entityNames,
    ]);

    const mergedLevel = mergedBlocks.length <= 5 ? 0 : mergedBlocks.length <= 25 ? 1 : 2;

    const mergedCommunity: Community = {
      id: target.id,
      level: mergedLevel,
      topic: deriveTopic(mergedBlocks, graph),
      blocks: mergedBlocks,
      entityNames: [...mergedEntities],
      neighborCommunityIds: [], // rebuilt later
    };

    // Update maps
    communityMap.set(target.id, mergedCommunity);
    communityMap.delete(smallCommunity.id);

    for (const block of smallCommunity.blocks) {
      blockToCommunity.set(blockKey(block.id), target.id);
    }

    changed = true;
  }

  return [...communityMap.values()];
}

/**
 * Rebuild neighbor community lists after IDs have been re-assigned.
 * Two communities are neighbors if any block in one has an edge to
 * any block in the other.
 */
function rebuildNeighborLists(
  communities: Community[],
  graph: Graph<NodeAttrs, EdgeAttrs>,
): Community[] {
  // Map block key → community id
  const blockToCid = new Map<string, number>();
  for (const c of communities) {
    for (const block of c.blocks) {
      blockToCid.set(blockKey(block.id), c.id);
    }
  }

  // For each community, collect neighbor community IDs
  const neighborMap = new Map<number, Set<number>>();
  for (const c of communities) {
    neighborMap.set(c.id, new Set());
  }

  for (const c of communities) {
    for (const block of c.blocks) {
      const bKey = blockKey(block.id);
      if (!graph.hasNode(bKey)) continue;

      graph.forEachEdge(bKey, (_edge, _attrs, source, target) => {
        const otherKey = source === bKey ? target : source;
        const otherCid = blockToCid.get(otherKey);
        if (otherCid !== undefined && otherCid !== c.id) {
          neighborMap.get(c.id)!.add(otherCid);
        }
      });
    }
  }

  return communities.map((c) => ({
    ...c,
    neighborCommunityIds: [...(neighborMap.get(c.id) ?? [])],
  }));
}
