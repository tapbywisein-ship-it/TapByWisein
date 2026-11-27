import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteCommunityDialogProps {
  communityName: string | null;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteCommunityDialog = ({
  communityName,
  isDeleting = false,
  onCancel,
  onConfirm,
}: DeleteCommunityDialogProps) => (
  <Dialog open={!!communityName} onOpenChange={(open) => { if (!open && !isDeleting) onCancel(); }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Delete {communityName}?</DialogTitle>
        <DialogDescription>
          This will permanently remove the community and its feed. This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? 'Deleting…' : 'Delete community'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
