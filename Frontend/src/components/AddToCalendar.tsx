import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { googleCalUrl, type CalEvent } from '@/lib/calendar';

/** Direct Google Calendar integration button with prefilled event details */
export const AddToCalendar = ({ event, className }: { event: CalEvent; className?: string }) => {
  const calUrl = googleCalUrl(event);

  return (
    <div className={`flex flex-col gap-1.5 min-w-0 ${className ?? ''}`}>
      <p className="text-xs text-muted-foreground text-left font-medium">
        Add to calendar to get reminder
      </p>
      <Button
        asChild
        size="sm"
        className="w-full min-w-0 rounded-xl gap-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-md transition-all"
      >
        <a href={calUrl} target="_blank" rel="noopener noreferrer">
          <Calendar className="w-4 h-4 shrink-0" />
          <span className="truncate">Add to Google Calendar</span>
        </a>
      </Button>
    </div>
  );
};
