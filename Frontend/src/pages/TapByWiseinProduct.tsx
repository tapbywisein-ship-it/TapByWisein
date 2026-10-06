import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';

const HOME_BY_ROLE: Record<string, string> = {
  attendee: '/dashboard',
  organizer: '/organizer/dashboard',
  admin: '/admin/dashboard',
};
import { motion } from 'framer-motion';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { ExitIntentPopup } from '@/components/ExitIntentPopup';
import { Button } from '@/components/ui/button';
import { EASE_PREMIUM } from '@/lib/motion';
import { NfcTapHeroAnimation } from '@/components/NfcTapHeroAnimation';

/* Luma-style accent word — brand-blue gradient on the Instrument Serif display face.
 * Uses the --primary token so it stays on-brand and theme-aware. */
const ACCENT_GRADIENT = 'linear-gradient(100deg, hsl(var(--primary)) 0%, #9DCAFF 100%)';

const TapByWiseinProduct = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const role = useAppStore((s) => s.user?.role);

  // Signed-in users never see the public landing page — send them to their
  // in-app home.
  if (isAuthenticated) {
    return <Navigate to={HOME_BY_ROLE[role ?? 'attendee'] ?? '/dashboard'} replace />;
  }

  const goCreate = () => navigate('/organizer/events/create');

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#F0F2F5' }}>
      <style>{`
        /* ── "starts with a tap." — blue/silver polished chrome sweep ──── */
        @keyframes chrome-sweep {
          0%   { background-position: 200% center; }
          70%  { background-position: -200% center; }
          100% { background-position: -200% center; }
        }

        .text-chrome-signature {
          background: linear-gradient(
            110deg,
            #6C757D 0%,
            #ADB5BD 15%,
            #CED4DA 25%,
            #DEE2E6 35%,
            #3B82F6 45%,
            #60A5FA 48%,
            #FFFFFF 50%,
            #60A5FA 52%,
            #3B82F6 55%,
            #E9ECEF 65%,
            #CED4DA 80%,
            #6C757D 100%
          );
          background-size: 250% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          filter: drop-shadow(0 1px 2px rgba(37,99,235,0.15));
          animation: chrome-sweep 4s ease-in-out infinite;
        }

        /* ── "Your network" — dark graphite with subtle silver lift ─────── */
        /* ── "Your network" — dark graphite with subtle silver lift ─────── */
        .text-heading-metal {
          background: linear-gradient(
            170deg,
            #212529 0%,
            #343A40 40%,
            #495057 55%,
            #6C757D 65%,
            #343A40 80%,
            #212529 100%
          );
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
        }

        /* ── Buttons ─────────────────────────────────────────────────────── */
        .btn-premium {
          background: linear-gradient(180deg, #3B82F6 0%, #2563EB 40%, #1D4ED8 100%);
          box-shadow:
            inset 0 1px 1px rgba(255,255,255,0.40),
            inset 0 -1px 0 rgba(15,23,42,0.40),
            0 8px 16px -4px rgba(37,99,235,0.35);
          border: 1px solid #1E3A8A;
          position: relative; overflow: hidden;
        }
        .btn-premium::after {
          /* Soft hover highlight sweep */
          content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
          background: linear-gradient(60deg, transparent 40%, rgba(96,165,250,0.4) 50%, transparent 60%);
          transform: translateX(-100%); transition: transform 0.8s ease;
        }
        .btn-premium:hover::after { transform: translateX(100%); }

        .btn-glass {
          background: linear-gradient(180deg, #FFFFFF 0%, #F0F2F5 100%);
          border: 1px solid #C8CDD3;
          box-shadow: inset 0 1px 0 rgba(255,255,255,1), 0 4px 12px rgba(108,117,125,0.08);
          position: relative; overflow: hidden;
          transition: all 0.2s ease;
        }
        .btn-glass:hover { 
          background: #FFFFFF; 
          border-color: #60A5FA;
          color: #2563EB !important;
        }
        
        /* Kill default blue link color inside this page */
        .landing-links a { color: inherit; text-decoration: none; }
      `}</style>
      
      {/* --- Premium Silver Background & Studio Lighting --- */}
      {/* Base: warm silver-white */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'linear-gradient(135deg, #F0F2F5 0%, #FAFBFC 40%, #E8EBED 100%)' }} />
      {/* Studio spotlight behind product (right side) */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(ellipse 60% 80% at 75% 50%, rgba(255,255,255,0.95) 0%, rgba(240,242,245,0.6) 45%, transparent 75%)' }} />
      {/* Subtle ambient silver glow top-left (light source direction) */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(ellipse 50% 60% at 20% 20%, rgba(225,228,232,0.5) 0%, transparent 60%)' }} />
      {/* Very soft blue ambient technology glow behind phone */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(ellipse 40% 60% at 75% 50%, rgba(59,130,246,0.06) 0%, transparent 70%)' }} />
      {/* Fine engineering grid */}
      <div 
        className="absolute inset-0 pointer-events-none z-0" 
        style={{ 
          backgroundImage: 'linear-gradient(to right, rgba(108,117,125,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(108,117,125,0.07) 1px, transparent 1px)', 
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 80%)'
        }} 
      />

      <div className="relative z-10 flex-1 flex flex-col">
        <PublicNav />

        {/* ── Hero ────────────── */}
        <section className="relative flex-1 flex flex-col justify-center overflow-hidden">
          <div className="max-w-[1280px] w-full mx-auto px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4 items-center min-h-[85vh]">
            
            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_PREMIUM }}
              className="flex flex-col justify-center py-12 lg:py-0 pr-0 lg:pr-8"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#2563EB] mb-5 flex items-center gap-2">
                <span className="w-4 h-[1px] bg-[#3B82F6]"></span>
                NFC Tap Card
              </p>
              <h1
                className="font-extrabold tracking-tight"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
              >
                <span className="text-[#212529]">TAP</span>
                <span className="text-[#ADB5BD] font-medium mx-1 lg:mx-2" style={{ letterSpacing: '0' }}>BY</span>
                <span className="text-[#212529]">WISEIN</span>
              </h1>
              <p className="mt-6 max-w-[420px] text-[17px] text-[#343A40]" style={{ lineHeight: 1.6 }}>
                TapByWisein helps founders, professionals, and event attendees instantly exchange
                details, build meaningful connections, and grow their network with NFC-powered smart
                cards.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <button 
                  onClick={goCreate}
                  className="btn-premium group h-12 px-6 rounded-lg font-semibold text-sm text-white flex items-center gap-2 transition-transform active:scale-[0.98]"
                >
                  Create Event <ArrowRight className="w-4 h-4 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <Link 
                  to="/discover"
                  className="btn-glass group h-12 px-6 rounded-lg font-semibold text-sm text-[#343A40] transition-all active:scale-[0.98] flex items-center gap-2"
                >
                  Explore events <ArrowDown className="w-4 h-4 opacity-70 group-hover:translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Right — product animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1, ease: EASE_PREMIUM }}
              className="relative flex justify-center items-center min-h-[420px] lg:min-h-0"
            >
            <div className="relative w-full max-w-[1050px] flex justify-center lg:justify-end items-center lg:pr-12">
              <NfcTapHeroAnimation />
            </div>
          </motion.div>
          </div>
        </section>
      </div>

      {/* Footer sits at the bottom */}
      <div className="relative z-10">
        <PublicFooter />
      </div>

      <ExitIntentPopup />
    </div>
  );
};

export default TapByWiseinProduct;