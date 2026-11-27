import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type LeaveCommunityDialogProps = {
  /** The community being left; the dialog is open while this is set. */
  communityName: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Asks before leaving a community. The "Joined" / "Following" buttons leave on
 * tap, which was easy to do by accident, especially on a phone.
 */
export const LeaveCommunityDialog = ({ communityName, onCancel, onConfirm }: LeaveCommunityDialogProps) => (
  <AlertDialog open={communityName !== null} onOpenChange={(open) => !open && onCancel()}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Leave {communityName}?</AlertDialogTitle>
        <AlertDialogDescription>
          You'll stop seeing its posts and announcements. You can join again at any time.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Stay</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Leave</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
