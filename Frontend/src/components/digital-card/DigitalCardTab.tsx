import { useState, useMemo } from 'react';
import { Surface } from '@/components/Surface';
import { Button } from '@/components/ui/button';
import {
  Share2,
  Download,
  Edit3,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Eye,
  QrCode,
  ContactRound,
  X,
  Maximize2,
} from 'lucide-react';
import { useMyProfile } from '@/hooks/useProfile';
import { useAppStore } from '@/store/appStore';
import {
  DigitalCardPreview,
  type DigitalCardData,
} from './DigitalCardPreview';
import { DigitalCardEditor } from './DigitalCardEditor';
import { WalletModal } from './WalletModal';
import { downloadVCard } from '@/lib/vcard';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export const DigitalCardTab = () => {
  const { data: profileData, isLoading } = useMyProfile();
  const user = useAppStore((s) => s.user);

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [walletType, setWalletType] = useState<'apple' | 'google' | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const profile = profileData?.profile;

  // Base profile data from hooks
  const defaultCardData: DigitalCardData = useMemo(() => {
    return {
      firstName: profile?.firstName || user?.name?.split(' ')[0] || '',
      lastName: profile?.lastName || user?.name?.split(' ').slice(1).join(' ') || '',
      position: profile?.position || user?.designation || 'Member',
      company: profile?.company || user?.company || 'TapByWiseIN',
      bio: profile?.bio || '',
      location: profile?.location || '',
      phone: profile?.phone || '',
      email: profileData?.email || user?.email || '',
      website: profile?.website || '',
      linkedin: profile?.linkedin || '',
      twitter: profile?.twitter || '',
      instagram: profile?.instagram || '',
      avatar: profile?.avatar || user?.avatar || '',
      username: profileData?.username || user?.username || '',
      userId: user?.id || '',
      skills: (profile?.skills && profile.skills.length > 0)
        ? profile.skills
        : ['Networking', 'Tech', 'Founder'],
    };
  }, [profile, profileData, user]);

  const [liveCardData, setLiveCardData] = useState<DigitalCardData>(defaultCardData);

  useMemo(() => {
    setLiveCardData(defaultCardData);
  }, [defaultCardData]);

  // Card slug: use username if present, otherwise user's UUID
  const cardSlug = liveCardData.username || liveCardData.userId || user?.username || user?.id || '';
  const displayUrl = cardSlug ? `tapbywisein.com/${cardSlug}` : 'tapbywisein.com';
  const publicCardUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/card/${cardSlug}`
    : `https://tapbywisein.com/card/${cardSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicCardUrl);
    setCopied(true);
    toast.success('Public card link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${liveCardData.firstName} ${liveCardData.lastName} - Digital Business Card`,
        text: `Connect with ${liveCardData.firstName} ${liveCardData.lastName} on TapByWiseIN`,
        url: publicCardUrl,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadVcard = () => {
    downloadVCard({
      firstName: liveCardData.firstName,
      lastName: liveCardData.lastName,
      email: liveCardData.email,
      phone: liveCardData.phone,
      position: liveCardData.position,
      company: liveCardData.company,
      bio: liveCardData.bio,
      website: liveCardData.website,
      linkedin: liveCardData.linkedin,
      twitter: liveCardData.twitter,
      avatarUrl: liveCardData.avatar,
      cardUrl: publicCardUrl,
    });
    toast.success('Contact file (.vcf) downloaded!');
  };

  const handleDownloadQr = () => {
    const svg = document.querySelector('svg');
    if (!svg) {
      toast.error('QR code not available');
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 400, 400);
        ctx.drawImage(img, 25, 25, 350, 350);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${liveCardData.firstName || 'wisein'}-card-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        toast.success('QR Code image downloaded!');
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (isLoading && !profile) {
    return (
      <div className="space-y-6 py-6 animate-pulse max-w-4xl mx-auto">
        <div className="h-8 w-64 bg-muted/60 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-muted/40 rounded-2xl" />
          <div className="h-72 bg-muted/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2 max-w-5xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Your Digital Business Card
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Live
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
            Tap. Connect. Grow — your identity, one tap away.
          </p>
        </div>

        {/* Top Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="rounded-xl h-9 text-xs font-semibold gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditing ? 'Close Editor' : 'Edit Card'}
          </Button>

          <Button
            size="sm"
            onClick={handleShare}
            className="rounded-xl h-9 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share Card
          </Button>
        </div>
      </div>

      {/* ── Public Link Banner ── */}
      <Surface className="p-3 sm:p-4 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <QrCode className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">Your Public Card URL</p>
            <p className="text-xs text-muted-foreground truncate font-mono">
              {displayUrl}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            className="h-8 px-3 text-xs rounded-lg gap-1.5 bg-card"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            asChild
            className="h-8 px-3 text-xs rounded-lg gap-1.5 bg-card"
          >
            <a href={publicCardUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5" />
              View Public Page
            </a>
          </Button>
        </div>
      </Surface>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Card Preview & Quick Action Bar */}
        <div className={`space-y-5 ${isEditing ? 'lg:col-span-6' : 'lg:col-span-7 lg:mx-auto w-full'}`}>
          <Surface className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-border shadow-sm bg-card/60 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-border/60">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Live Card Preview
              </span>
              <span className="text-[11px] text-muted-foreground">
                Premium NFC Card
              </span>
            </div>

            {/* Live Card */}
            <DigitalCardPreview
              data={liveCardData}
            />

            {/* Actions Panel below Card */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6 pt-5 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="h-9 text-xs rounded-xl gap-1.5 border-border"
              >
                <Share2 className="w-3.5 h-3.5 text-primary" />
                Share
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadQr}
                className="h-9 text-xs rounded-xl gap-1.5 border-border"
              >
                <QrCode className="w-3.5 h-3.5 text-primary" />
                QR Code
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadVcard}
                className="h-9 text-xs rounded-xl gap-1.5 border-border"
              >
                <ContactRound className="w-3.5 h-3.5 text-primary" />
                Save .VCF
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewModalOpen(true)}
                className="h-9 text-xs rounded-xl gap-1.5 border-border"
              >
                <Maximize2 className="w-3.5 h-3.5 text-primary" />
                Preview
              </Button>
            </div>
          </Surface>

          {/* ── Wallet Passes Integration Section ── */}
          <Surface className="p-4 sm:p-5 rounded-2xl border border-border shadow-xs bg-card space-y-3">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                Mobile Wallet Passes
              </h4>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Carry your verified business card right in your phone's native digital wallet.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setWalletType('apple')}
                className="h-11 justify-start gap-2.5 rounded-xl border-border hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-800 transition-colors"
              >
                <div className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                  
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-semibold leading-tight">Add to Apple Wallet</p>
                  <p className="text-[10px] text-muted-foreground">iOS Pass</p>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setWalletType('google')}
                className="h-11 justify-start gap-2.5 rounded-xl border-border hover:bg-blue-600 hover:text-white transition-colors"
              >
                <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                  G
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-semibold leading-tight">Add to Google Wallet</p>
                  <p className="text-[10px] text-muted-foreground">Android Pass</p>
                </div>
              </Button>
            </div>
          </Surface>
        </div>

        {/* Right Column: Editor Form */}
        <div className={`space-y-4 ${isEditing ? 'lg:col-span-6' : 'hidden'}`}>
          <DigitalCardEditor
            initialData={defaultCardData}
            onDataChange={(d) => setLiveCardData(d)}
            onCancel={() => setIsEditing(false)}
            onSaved={() => setIsEditing(false)}
          />
        </div>
      </div>

      {/* Wallet Pass Sheet / Modal */}
      <WalletModal
        isOpen={walletType !== null}
        onClose={() => setWalletType(null)}
        type={walletType}
        cardData={liveCardData}
      />

      {/* ── Large Dimension Card Preview Lightbox with Background Blur ── */}
      <AnimatePresence>
        {previewModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xl"
            onClick={() => setPreviewModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-full max-w-4xl flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Large Digital Card Component with Aligned Close Button */}
              <div className="w-full flex justify-center py-2">
                <DigitalCardPreview
                  data={liveCardData}
                  size="large"
                  actionsRight={
                    <button
                      type="button"
                      onClick={() => setPreviewModalOpen(false)}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md"
                      aria-label="Close Preview"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  }
                />
              </div>

              {/* Action Toolbar on blurred backdrop */}
              <div className="flex items-center gap-2 mt-4 p-2 bg-black/50 border border-white/20 rounded-2xl backdrop-blur-md shadow-2xl">
                <Button
                  size="sm"
                  onClick={handleShare}
                  className="h-9 px-4 text-xs font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadVcard}
                  className="h-9 px-4 text-xs font-semibold rounded-xl bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  <ContactRound className="w-3.5 h-3.5 mr-1.5" /> Save Contact
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadQr}
                  className="h-9 px-4 text-xs font-semibold rounded-xl bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  <QrCode className="w-3.5 h-3.5 mr-1.5" /> Download QR
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
