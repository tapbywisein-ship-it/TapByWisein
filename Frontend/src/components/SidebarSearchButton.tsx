import { Search } from 'lucide-react';

/**
 * The "Search" row in the collapsible desktop sidebar (attendee and organizer).
 * Both sidebars place it right under Dashboard.
 */
export const SidebarSearchButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    title="Search"
    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
  >
    <Search className="w-5 h-5 flex-shrink-0" />
    <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Search</span>
  </button>
);
