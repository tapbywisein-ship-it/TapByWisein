import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PortalLayout } from '@/components/PortalLayout';
import { DigitalCardTab } from '@/components/digital-card/DigitalCardTab';
import { PhysicalCardTab } from '@/components/digital-card/PhysicalCardTab';
import { Sparkles, CreditCard, Smartphone } from 'lucide-react';
import { useMyCard } from '@/hooks/useFounderCard';
import { useAppStore } from '@/store/appStore';

/**
 * TapCard Page — Unified hub for both Digital Business Cards & Physical NFC Cards.
 * Maintains existing `/apply-card` route and sidebar entry with zero regressions.
 */
const ApplyCardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');

  const { data: card } = useMyCard();
  const storeUser = useAppStore((s) => s.user);

  // Default to digital card, unless url specifies physical or user has ongoing physical card order
  const [activeTab, setActiveTab] = useState<'digital' | 'physical'>(() => {
    if (urlTab === 'physical' || urlTab === 'digital') return urlTab;
    if (card?.physicalCardOrdered || card?.nfcTagId) return 'physical';
    return 'digital';
  });

  const handleTabChange = (tab: 'digital' | 'physical') => {
    setActiveTab(tab);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tab);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <PortalLayout>
      <div className="space-y-6 pb-24 md:pb-8">
        {/* ── Top Tabs Segment Control ── */}
        <div className="flex items-center justify-center sm:justify-start">
          <div className="inline-flex p-1 bg-muted/60 border border-border/80 rounded-2xl shadow-xs">
            <button
              type="button"
              onClick={() => handleTabChange('digital')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'digital'
                  ? 'bg-card text-foreground shadow-sm border border-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Smartphone className="w-4 h-4 text-primary" />
              <span>Digital Card</span>
              <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.2 rounded-full border border-primary/20">
                Instant
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('physical')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'physical'
                  ? 'bg-card text-foreground shadow-sm border border-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CreditCard className="w-4 h-4 text-primary" />
              <span>Physical Card</span>
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded-full">
                ₹499 NFC
              </span>
            </button>
          </div>
        </div>

        {/* ── Active Tab Content ── */}
        <div>
          {activeTab === 'digital' ? <DigitalCardTab /> : <PhysicalCardTab />}
        </div>
      </div>
    </PortalLayout>
  );
};

export default ApplyCardPage;
