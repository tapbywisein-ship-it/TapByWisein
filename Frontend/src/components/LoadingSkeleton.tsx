/**
 * Placeholder blocks shown while a list loads, in the shape of the content to
 * come, instead of a "Loading…" line. Same pulsing style as the Notifications
 * and Connections lists. Screen readers hear "Loading".
 */

type LoadingSkeletonProps = {
  /** How many placeholder blocks to show. */
  count?: number;
  /** "rows" for a list (default), "cards" for a two/four-column grid of cards. */
  layout?: 'rows' | 'cards';
  /** Height of each block, as a Tailwind class. */
  itemClassName?: string;
};

export const LoadingSkeleton = ({ count = 4, layout = 'rows', itemClassName }: LoadingSkeletonProps) => {
  const isCards = layout === 'cards';
  const blockHeight = itemClassName ?? (isCards ? 'h-40' : 'h-16');

  return (
    <div
      role="status"
      aria-label="Loading"
      className={isCards ? 'grid grid-cols-2 md:grid-cols-4 gap-3' : 'space-y-3'}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${blockHeight} rounded-xl bg-muted/50 animate-pulse`} />
      ))}
    </div>
  );
};
