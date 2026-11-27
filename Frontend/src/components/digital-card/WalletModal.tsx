import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/Surface';
import {
  Smartphone,
  CheckCircle2,
  Download,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { downloadVCard } from '@/lib/vcard';
import type { DigitalCardData } from './DigitalCardPreview';
import { toast } from 'sonner';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'apple' | 'google' | null;
  cardData: DigitalCardData;
}

export const WalletModal = ({ isOpen, onClose, type, cardData }: WalletModalProps) => {
  const [notified, setNotified] = useState(false);

  if (!type) return null;

  const isApple = type === 'apple';
  const walletName = isApple ? 'Apple Wallet' : 'Google Wallet';
  const passFormat = isApple ? '.pkpass' : 'Google Wallet Object';

  const handleDownloadVcard = () => {
    downloadVCard({
      firstName: cardData.firstName,
      lastName: cardData.lastName,
      email: cardData.email,
      phone: cardData.phone,
      position: cardData.position,
      company: cardData.company,
      bio: cardData.bio,
      website: cardData.website,
      linkedin: cardData.linkedin,
      twitter: cardData.twitter,
      avatarUrl: cardData.avatar,
      cardUrl: `${window.location.origin}/card/${cardData.username || cardData.userId || 'me'}`,
    });
    toast.success('Contact card (.vcf) downloaded to your device!');
  };

  const handleNotifyMe = () => {
    setNotified(true);
    toast.success(`You'll be notified as soon as ${walletName} passes go live!`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 bg-card border border-border shadow-2xl rounded-2xl sm:rounded-3xl">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
                isApple ? 'bg-black' : 'bg-blue-600'
              }`}
            >
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Add to {walletName}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">Digital NFC Pass Architecture</p>
            </div>
          </div>
        </DialogHeader>

        {/* Pass Preview Card Mockup */}
        <div className="my-3">
          <div
            className={`p-4 rounded-2xl border text-white relative overflow-hidden shadow-inner ${
              isApple
                ? 'bg-gradient-to-br from-neutral-900 via-neutral-800 to-black border-neutral-700'
                : 'bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 border-blue-500/30'
            }`}
          >
            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest opacity-80 mb-3">
              <span>TapByWiseIN Pass</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full">Coming Soon</span>
            </div>
            <p className="font-bold text-base tracking-tight truncate">
              {cardData.firstName} {cardData.lastName}
            </p>
            <p className="text-xs opacity-75 truncate">{cardData.position || 'Member'} • {cardData.company || 'TapByWiseIN'}</p>
            <div className="mt-4 pt-2 border-t border-white/10 flex justify-between items-center text-[10px] opacity-60">
              <span>Format: {passFormat}</span>
              <span>NFC + QR Enabled</span>
            </div>
          </div>
        </div>

        {/* Informative Status Badge */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-500 font-semibold text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>Pass Provisioning Service In Progress</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We are finalizing our certified {walletName} developer credentials to issue signed {passFormat} passes directly to your phone.
          </p>
        </div>

        {/* Instant Alternative: Download vCard */}
        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold text-foreground">Immediate alternative ready today:</p>
          <Button
            onClick={handleDownloadVcard}
            variant="outline"
            className="w-full justify-between h-11 border-border/80 hover:bg-muted font-medium text-xs sm:text-sm rounded-xl"
          >
            <span className="flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" />
              Download .vcf Contact Card
            </span>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              Instant
            </span>
          </Button>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 rounded-xl text-xs h-10"
          >
            Close
          </Button>
          <Button
            onClick={handleNotifyMe}
            disabled={notified}
            className="flex-1 rounded-xl text-xs h-10 font-medium"
          >
            {notified ? '✓ Notification Enabled' : 'Notify when live'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

