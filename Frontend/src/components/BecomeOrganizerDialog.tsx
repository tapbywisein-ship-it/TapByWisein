import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRequestOrganizer } from '@/hooks/useOrganizer';

/**
 * Upgrade an attendee account to organizer. Opened from the Profile page only.
 * The upgrade can't be undone, so it needs the warning to be acknowledged.
 */
export const BecomeOrganizerDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const navigate = useNavigate();
  const [organization, setOrganization] = useState('');
  // Gate the irreversible upgrade behind an explicit acknowledgement.
  const [acknowledged, setAcknowledged] = useState(false);
  const requestOrganizer = useRequestOrganizer();

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) setAcknowledged(false);
  };

  const submit = () => {
    requestOrganizer.mutate(organization, {
      onSuccess: () => {
        toast.success("You're an organizer now. Welcome to your dashboard!");
        setOrganization('');
        close(false);
        navigate('/organizer/dashboard');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Become an Organizer</DialogTitle>
          <DialogDescription>
            Unlock the host portal to create and manage your own events. Your account upgrades instantly.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="org-organization">
              Organization / Company <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="org-organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. Acme Corp, Indie Events Co."
            />
          </div>

          {/* Irreversible: there is no backend path from ORGANIZER back to
              ATTENDEE, and the attendee dashboard redirects organizers away. */}
          <div className="flex gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              This is <strong>permanent</strong>. Once you become an organizer, you <strong>can’t become an attendee again</strong> — your account
              will use the organizer portal from now on.
            </p>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-primary cursor-pointer"
            />
            <span className="text-sm text-foreground">
              I understand this can’t be undone and I want to become an organizer.
            </span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>Cancel</Button>
          <Button onClick={submit} disabled={requestOrganizer.isPending || !acknowledged}>
            {requestOrganizer.isPending ? 'Upgrading…' : 'Become an organizer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
