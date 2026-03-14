import type { ReactNode } from 'react';

interface MarkdownTextProps {
  text: string;
  className?: string;
}

/**
 * Sanitize raw AI output by removing or converting special characters that appear
 * as noise when the model emits raw Markdown that is not fully rendered.
 * - Converts ## headings to **bold** so they render via the inline renderer
 * - Removes triple-star/triple-dash separator lines
 * - Removes blockquote > markers
 * - Removes table-formatting pipes (only pipes used as column dividers, i.e. at
 *   line start/end or surrounded by whitespace, not mid-word)
 */
function sanitizeAiText(raw: string): string {
  return raw
    // Convert ATX heading lines (## Heading) to bold so the renderer picks them up
    .replace(/^#{1,6}\s+(.+)$/gm, '**$1**')
    // Remove triple-star or triple-dash horizontal rule / separator lines
    .replace(/^\s*\*{3,}\s*$/gm, '')
    .replace(/^\s*-{3,}\s*$/gm, '')
    // Remove leading blockquote > markers
    .replace(/^>{1,}\s?/gm, '')
    // Remove table pipe characters used as column dividers:
    // only pipes at start-of-line, end-of-line, or surrounded by spaces
    .replace(/(?:^\s*\||\|\s*$|\s\|\s)/gm, ' ')
    // Collapse multiple consecutive blank lines into one
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Converts **bold** spans within a line of text. */
function renderInline(line: string): ReactNode {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return line;
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-semibold text-slate-900 dark:text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

/**
 * A minimal Markdown-to-JSX renderer for AI-generated health content.
 * Handles: **headings**, - bullet lists, 1. numbered lists, paragraphs.
 */
export function MarkdownText({ text, className = '' }: MarkdownTextProps) {
  // Sanitize raw AI output before parsing
  const sanitized = sanitizeAiText(text);
  // Split on one or more blank lines to get logical blocks
  const blocks = sanitized.split(/\n{2,}/);
  const elements: ReactNode[] = [];

  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi].trim();
    if (!block) continue;

    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);

    // ── Standalone bold heading: **text** alone on one line ──────────────────
    if (lines.length === 1 && /^\*\*[^*]+\*\*$/.test(lines[0])) {
      elements.push(
        <p
          key={bi}
          className="font-bold text-slate-900 dark:text-white mt-4 first:mt-0"
        >
          {lines[0].slice(2, -2)}
        </p>,
      );
      continue;
    }

    // ── Bullet list: every line starts with "- " ─────────────────────────────
    if (lines.every((l) => l.startsWith('- '))) {
      elements.push(
        <ul key={bi} className="space-y-1 pl-1">
          {lines.map((l, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
              <span className="shrink-0 mt-1 text-slate-400">•</span>
              <span>{renderInline(l.slice(2))}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // ── Numbered list: every line starts with "N. " ───────────────────────────
    if (lines.every((l) => /^\d+\.\s/.test(l))) {
      elements.push(
        <ol key={bi} className="space-y-1 pl-1">
          {lines.map((l, i) => {
            const content = l.replace(/^\d+\.\s/, '');
            return (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                <span className="shrink-0 font-semibold text-brand-500 min-w-[1.2rem]">
                  {i + 1}.
                </span>
                <span>{renderInline(content)}</span>
              </li>
            );
          })}
        </ol>,
      );
      continue;
    }

    // ── Mixed block (e.g. heading on first line + content) ────────────────────
    if (lines.length > 1) {
      elements.push(
        <div key={bi} className="space-y-1">
          {lines.map((l, i) => {
            if (/^\*\*[^*]+\*\*$/.test(l)) {
              return (
                <p key={i} className="font-bold text-slate-900 dark:text-white">
                  {l.slice(2, -2)}
                </p>
              );
            }
            if (l.startsWith('- ')) {
              return (
                <p key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                  <span className="shrink-0 mt-1 text-slate-400">•</span>
                  <span>{renderInline(l.slice(2))}</span>
                </p>
              );
            }
            if (/^\d+\.\s/.test(l)) {
              const num = l.match(/^(\d+)\./)?.[1];
              const content = l.replace(/^\d+\.\s/, '');
              return (
                <p key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                  <span className="shrink-0 font-semibold text-brand-500 min-w-[1.2rem]">{num}.</span>
                  <span>{renderInline(content)}</span>
                </p>
              );
            }
            return (
              <p key={i} className="text-sm leading-relaxed">
                {renderInline(l)}
              </p>
            );
          })}
        </div>,
      );
      continue;
    }

    // ── Regular paragraph ─────────────────────────────────────────────────────
    elements.push(
      <p key={bi} className="text-sm leading-relaxed">
        {renderInline(lines[0])}
      </p>,
    );
  }

  return (
    <div
      className={`space-y-3 text-slate-700 dark:text-slate-300 ${className}`}
    >
      {elements}
    </div>
  );
}
