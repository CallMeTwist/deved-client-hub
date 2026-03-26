import { useState } from 'react';

interface CollapsibleNoteProps {
  html: string;
  charLimit?: number;
}

/**
 * Renders HTML note content. If the plain-text length exceeds charLimit,
 * shows a truncated version with a "Read more" toggle.
 */
export function CollapsibleNote({ html, charLimit = 300 }: CollapsibleNoteProps) {
  const [expanded, setExpanded] = useState(false);

  // Strip HTML tags to measure plain-text length
  const plainText = html.replace(/<[^>]+>/g, '');
  const isLong    = plainText.length > charLimit;

  // For the collapsed view, we truncate the plain text and append ellipsis.
  // We show the full HTML when expanded.
  const truncated = isLong && !expanded
    ? plainText.slice(0, charLimit).trimEnd() + '…'
    : null;

  return (
    <div>
      {truncated ? (
        // Collapsed — plain text only (safe, no HTML injection risk)
        <p className="text-sm text-foreground leading-relaxed">{truncated}</p>
      ) : (
        // Expanded — full rich HTML
        <div
          className="prose prose-sm max-w-none text-foreground
            prose-strong:text-foreground prose-em:text-muted-foreground
            prose-ul:mt-2 prose-li:mt-0.5 prose-p:my-1.5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}

      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {expanded ? 'Read less ↑' : 'Read more ↓'}
        </button>
      )}
    </div>
  );
}