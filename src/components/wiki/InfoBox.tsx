interface InfoBoxProps {
  title: string;
  fields: { label: string; value: string }[];
  entityType?: string;
}

/**
 * Wikipedia-style infobox — a right-aligned summary box with key-value pairs.
 */
export function InfoBox({ title, fields, entityType }: InfoBoxProps) {
  return (
    <aside className="float-right ml-4 mb-4 w-72 border border-wiki-border rounded bg-wiki-light-bg text-sm">
      {/* Title bar */}
      <div className="bg-wiki-accent px-3 py-2 rounded-t">
        <h3 className="font-serif font-bold text-white text-center text-base m-0">
          {title}
        </h3>
      </div>

      {/* Entity type badge */}
      {entityType && (
        <div className="px-3 py-1.5 border-b border-wiki-border text-center">
          <span className="inline-block bg-white border border-wiki-border rounded px-2 py-0.5 text-xs font-medium text-[#54595D] uppercase tracking-wide">
            {entityType}
          </span>
        </div>
      )}

      {/* Image placeholder */}
      <div className="px-3 py-3 border-b border-wiki-border flex items-center justify-center">
        <div className="w-full h-32 bg-white border border-[#C8CCD1] rounded flex items-center justify-center text-[#A2A9B1]">
          <svg
            className="w-10 h-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>

      {/* Key-value pairs */}
      <div className="divide-y divide-wiki-border">
        {fields.map((field, index) => (
          <div key={index} className="flex">
            <span className="w-24 shrink-0 px-3 py-1.5 bg-[#EAECF0] font-semibold text-[#202122] border-r border-wiki-border">
              {field.label}
            </span>
            <span className="flex-1 px-3 py-1.5 text-[#202122] bg-white">
              {field.value}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default InfoBox;
