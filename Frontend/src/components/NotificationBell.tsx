import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useUnreadCount } from '@/hooks/useNotifications';

/**
 * Bell linking to /notifications, with the unread count on it (9+ above nine).
 * Used in the phone top bar and at the top of the attendee Dashboard.
 */
export const NotificationBell = ({ className = '' }: { className?: string }) => {
  const { data: unreadCount = 0 } = useUnreadCount();
  const label = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications';

  return (
    <Link
      to="/notifications"
      aria-label={label}
      title={label}
      className={`relative inline-flex w-9 h-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${className}`}
    >
      <Bell className="w-4 h-4" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center leading-none">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
};
