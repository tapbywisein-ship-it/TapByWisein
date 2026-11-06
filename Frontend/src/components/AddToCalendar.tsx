import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { googleCalUrl, type CalEvent } from '@/lib/calendar';

/** Direct Google Calendar integration button with prefilled event details */
export const AddToCalendar = ({ event, className }: { event: CalEvent; className?: string }) => {
  const calUrl = googleCalUrl(event);

  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <p className="text-xs text-muted-foreground text-center font-medium">
        Add to calendar to get reminder
      </p>
      <Button
        asChild
        className="w-full rounded-xl gap-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-md transition-all"
      >
        <a href={calUrl} target="_blank" rel="noopener noreferrer">
          <Calendar className="w-4 h-4" />
          <span>Add to Google Calendar</span>
        </a>
      </Button>
    </div>
  );
};
