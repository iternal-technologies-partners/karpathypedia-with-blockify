"use client";

import { useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
}

/**
 * Wikipedia-style Table of Contents box with numbered headings
 * and show/hide toggle.
 */
export function TableOfContents({ headings }: TableOfContentsProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (headings.length === 0) return null;

  // Build numbered indices for headings
  const numberedHeadings = buildNumberedList(headings);

  return (
    <nav
      className="inline-block border border-wiki-border bg-wiki-light-bg rounded p-4 my-4 min-w-[200px] max-w-md"
      aria-label="Table of contents"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm text-[#202122]">Contents</span>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="text-xs text-wiki-link hover:text-wiki-link-hover ml-4 bg-transparent border-none cursor-pointer"
          aria-expanded={isVisible}
        >
          [{isVisible ? "hide" : "show"}]
        </button>
      </div>

      {isVisible && (
        <ol className="list-none m-0 p-0 text-sm space-y-0.5">
          {numberedHeadings.map(({ heading, number }) => {
            const indent = heading.level === 2 ? 0 : heading.level === 3 ? 16 : 32;
            return (
              <li key={heading.id} style={{ paddingLeft: `${indent}px` }}>
                <a
                  href={`#${heading.id}`}
                  className="text-wiki-link hover:text-wiki-link-hover no-underline hover:underline"
                >
                  <span className="text-[#202122] mr-1.5">{number}</span>
                  {heading.text}
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}

/**
 * Build a numbered list from headings, mimicking Wikipedia's TOC numbering.
 * h2 = "1", "2", etc.  h3 = "1.1", "1.2", etc.
 */
function buildNumberedList(headings: Heading[]) {
  const result: { heading: Heading; number: string }[] = [];
  let h2Count = 0;
  let h3Count = 0;
  let h4Count = 0;

  for (const heading of headings) {
    if (heading.level === 2) {
      h2Count++;
      h3Count = 0;
      h4Count = 0;
      result.push({ heading, number: `${h2Count}` });
    } else if (heading.level === 3) {
      h3Count++;
      h4Count = 0;
      result.push({ heading, number: `${h2Count}.${h3Count}` });
    } else if (heading.level === 4) {
      h4Count++;
      result.push({
        heading,
        number: `${h2Count}.${h3Count}.${h4Count}`,
      });
    }
  }

  return result;
}

export default TableOfContents;
