# UI Components Architecture

## Overview

Karpathypedia uses a Wikipedia-inspired design system built with Next.js App Router, TypeScript, and Tailwind CSS v4. Components follow a clean component architecture organized by feature area.

## Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--wiki-bg` | `#FFFFFF` | Page background |
| `--wiki-text` | `#202122` | Primary text |
| `--wiki-link` | `#0645AD` | Links |
| `--wiki-link-hover` | `#0B0080` | Link hover state |
| `--wiki-border` | `#A2A9B1` | Borders, dividers |
| `--wiki-light-bg` | `#F8F9FA` | Section backgrounds, sidebar |
| `--wiki-tag-bg` | `#EAECF0` | Tag/badge backgrounds |
| `--wiki-accent` | `#3366CC` | Accent color (infobox headers, focus rings) |

### Typography

- **Headings**: `'Linux Libertine', 'Georgia', 'Times', serif` (Wikipedia's font stack)
- **Body**: System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)
- **Code**: Geist Mono (via Next.js font optimization)

### Tailwind CSS v4

All color tokens are mapped in `globals.css` via `@theme inline` block, making them available as Tailwind utilities (e.g., `text-wiki-link`, `bg-wiki-light-bg`, `border-wiki-border`).

## Component Architecture

```
src/components/
  layout/         # Page structure components
    Header.tsx      Server — site header, branding, nav, search
    Sidebar.tsx     Client — collapsible sidebar with nav, stats, categories
    Footer.tsx      Server — attribution and links
    TableOfContents.tsx  Client — TOC box with show/hide toggle
    index.ts        Barrel exports

  wiki/           # Article-related components
    ArticleView.tsx   Server — full article display with TOC, markdown, metadata
    ArticleCard.tsx   Server — article listing card
    CategoryList.tsx  Server — category grid display
    BackLinks.tsx     Server — "What links here" section
    InfoBox.tsx       Server — Wikipedia-style infobox
    index.ts          Barrel exports

  common/         # Shared/reusable components
    MarkdownRenderer.tsx  Client — react-markdown with custom renderers
    TagBadge.tsx          Server — color-coded tag badges
    Breadcrumb.tsx        Server — breadcrumb navigation
    index.ts              Barrel exports

  search/         # Search-related components
    SearchBar.tsx       Client — search input form
    SearchResults.tsx   Server — search results with highlighting
    index.ts            Barrel exports

  ideablocks/     # IdeaBlock-related components
    IdeaBlockCard.tsx   Server — individual block display card
    IdeaBlockGrid.tsx   Client — filterable grid of block cards
    index.ts            Barrel exports
```

## Server vs Client Components

Components use `"use client"` only when they need browser APIs:

| Component | Type | Reason |
|-----------|------|--------|
| Header | Server | Static layout, delegates search to client SearchBar |
| Sidebar | Client | useState for mobile toggle |
| Footer | Server | Static content |
| TableOfContents | Client | useState for show/hide toggle |
| ArticleView | Server | Pure data rendering |
| ArticleCard | Server | Pure data rendering |
| CategoryList | Server | Pure data rendering |
| BackLinks | Server | Pure data rendering |
| InfoBox | Server | Pure data rendering |
| MarkdownRenderer | Client | react-markdown requires client-side rendering |
| TagBadge | Server | Pure rendering with Link |
| Breadcrumb | Server | Pure rendering with Link |
| SearchBar | Client | useState for input, useRouter for navigation |
| SearchResults | Server | Pure data rendering |
| IdeaBlockCard | Server | Pure data rendering |
| IdeaBlockGrid | Client | useState for filters, useMemo for computed data |

## Props and Types

All components import types from `@/lib/types`. Key interfaces:

- `WikiArticle` — full article data (slug, title, summary, content, category, tags, relatedSlugs, ideablockIds, lastUpdated, wordCount)
- `WikiArticleMeta` — lightweight article metadata for listings
- `CategoryMeta` — category with name, slug, articleCount, description
- `SearchResult` — search hit with type, title, snippet, score
- `IdeaBlock` — atomic knowledge unit with criticalQuestion, trustedAnswer, entities, tags
- `Entity` — named entity with type (PERSON, TECHNOLOGY, CONCEPT, etc.)

## Tag Color System

`TagBadge` maps tag names to colors:

| Tag | Color |
|-----|-------|
| TECHNOLOGY | Blue |
| CONCEPT | Purple |
| PERSON | Green |
| ORGANIZATION | Orange |
| PRODUCT | Rose |
| METRIC | Cyan |
| LOCATION | Emerald |
| DATE | Amber |
| AI | Violet |
| ML | Indigo |
| RESEARCH | Teal |
| (default) | Gray (#EAECF0) |

## Integration Points

- **SearchBar** navigates to `/search?q=...` on submit
- **ArticleView** composes `TableOfContents` and `MarkdownRenderer`
- **Header** embeds `SearchBar` as a child
- **TagBadge** links to `/search?q=tag` or `/category/slug`
- **ArticleCard** links to `/wiki/{slug}`
- **CategoryList** cards link to `/category/{slug}`
- **IdeaBlockCard** links to `/ideablocks/{id}`
