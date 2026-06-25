/**
 * Dev-only badge that shows whether a content item is draft or live.
 * Only renders when NODE_ENV === 'development'.
 */
export function DraftBadge({ draft }: { draft?: boolean }) {
  if (process.env.NODE_ENV !== 'development') return null;

  const isDraft = draft === true;

  return (
    <span
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 50,
        padding: '2px 8px',
        fontSize: '11px',
        fontWeight: 700,
        fontFamily: 'monospace',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: '#000',
        backgroundColor: isDraft ? '#ff4444' : '#44ff44',
        borderRadius: '3px',
        pointerEvents: 'none',
      }}
    >
      {isDraft ? 'DRAFT' : 'LIVE'}
    </span>
  );
}
