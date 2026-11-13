import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  RotateCw,
  Wifi,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface DigitalCardData {
  firstName: string;
  lastName: string;
  position?: string | null;
  company?: string | null;
  bio?: string | null;
  location?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  instagram?: string | null;
  avatar?: string | null;
  username?: string | null;
  userId?: string | null;
  skills?: string[];
}

interface DigitalCardPreviewProps {
  data: DigitalCardData;
  size?: 'normal' | 'large';
  actionsRight?: React.ReactNode;
  className?: string;
}

export const DigitalCardPreview = ({
  data,
  size = 'normal',
  actionsRight,
  className = '',
}: DigitalCardPreviewProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Your Name';
  const designation = data.position || 'Member';
  const company = data.company || 'TapByWiseIN';

  const cardSlug = data.username || data.userId || '';
  const displayUrl = cardSlug ? `tapbywisein.com/${cardSlug}` : 'tapbywisein.com';
  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/card/${cardSlug}`
    : `https://tapbywisein.com/card/${cardSlug}`;

  const tags = (data.skills && data.skills.length > 0)
    ? data.skills.slice(0, 3)
    : ['Build', 'Connect', 'Grow'];

  const isLarge = size === 'large';
  const containerMaxWidth = isLarge
    ? 'max-w-[620px] sm:max-w-[700px]'
    : 'max-w-[480px] sm:max-w-[500px]';

  return (
    <div className={`flex flex-col items-center w-full ${className}`}>
      {/* Top bar (e.g. aligned close button when in modal preview) */}
      {actionsRight && (
        <div className={`w-full ${containerMaxWidth} flex items-center justify-end mb-3 px-1`}>
          {actionsRight}
        </div>
      )}

      {/* ── CARD DISPLAY CONTAINER (HORIZONTAL) ── */}
      <div
        className={`relative w-full ${containerMaxWidth} aspect-[1.586/1] [perspective:1000px] select-none transition-all duration-300`}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="w-full h-full relative cursor-pointer"
          style={{ transformStyle: 'preserve-3d' }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* ============================================================== */}
          {/* ── FRONT FACE: BRUSHED TITANIUM / SILVER WITH SAPPHIRE CURVES ── */}
          {/* ============================================================== */}
          <div
            className={`absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl ${
              isLarge ? 'p-8 sm:p-11' : 'p-6 sm:p-8'
            } flex flex-col justify-between border border-slate-300/80 shadow-[0_25px_60px_-15px_rgba(25,129,254,0.35),0_10px_25px_-5px_rgba(0,0,0,0.12)] overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-[#E2E8F0] to-[#CBD5E1]`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              backgroundImage: `
                radial-gradient(circle at 80% 20%, rgba(255,255,255,0.95) 0%, transparent 50%),
                linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 30%, #CBD5E1 65%, #94A3B8 100%)
              `,
            }}
          >
            {/* Fine brushed metal texture simulation */}
            <div
              className="absolute inset-0 opacity-[0.22] pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage: `repeating-linear-gradient(90deg, rgba(255,255,255,0.7) 0px, rgba(0,0,0,0.2) 1px, transparent 2px, transparent 4px)`,
              }}
            />

            {/* Specular metallic bevel edge highlight */}
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl ring-1 ring-inset ring-white/90 pointer-events-none" />

            {/* ── BLUE DECORATIVE ACCENTS (MATCHING REFERENCE DESIGN) ── */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
              viewBox="0 0 500 315"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Top-Left Corner Gradient */}
                <linearGradient id="frontTopLeftCorner" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.9" />
                  <stop offset="35%" stopColor="#3B82F6" stopOpacity="0.8" />
                  <stop offset="75%" stopColor="#60A5FA" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.3" />
                </linearGradient>

                {/* Bottom-Right Outer Wave Gradient (Flows softly below W logo) */}
                <linearGradient id="frontWaveOuter" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.4" />
                  <stop offset="40%" stopColor="#60A5FA" stopOpacity="0.55" />
                  <stop offset="85%" stopColor="#3B82F6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.5" />
                </linearGradient>

                {/* Bottom-Right Inner Vivid Corner Wave Gradient */}
                <linearGradient id="frontWaveInner" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.88" />
                  <stop offset="50%" stopColor="#2563EB" stopOpacity="0.92" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.85" />
                </linearGradient>
              </defs>

              {/* 1. TOP-LEFT CORNER ACCENT SWOOSH (Tucked higher into corner, completely above logo) */}
              <path
                d="M 0 0 L 80 0 C 62 14 30 30 14 46 C 6 54 1 61 0 68 Z"
                fill="url(#frontTopLeftCorner)"
              />

              {/* 2. BOTTOM-RIGHT OUTER SOFT WAVE */}
              <path
                d="M 275 315 C 335 315 378 296 425 256 C 466 222 488 196 500 185 L 500 315 Z"
                fill="url(#frontWaveOuter)"
              />

              {/* 3. BOTTOM-RIGHT INNER VIVID CORNER WAVE */}
              <path
                d="M 380 315 C 415 315 446 298 472 268 C 488 250 496 235 500 220 L 500 315 Z"
                fill="url(#frontWaveInner)"
              />
            </svg>

            {/* ── W LOGO ON THE RIGHT SIDE ── */}
            <div className={`absolute ${isLarge ? 'right-5 sm:right-8' : 'right-3 sm:right-6'} top-[56%] -translate-y-1/2 pointer-events-none select-none z-10`}>
              <img
                src="/w-logo.png"
                alt=""
                className={`${isLarge ? 'w-[130px] sm:w-[165px]' : 'w-[92px] sm:w-[118px]'} h-auto drop-shadow-[0_6px_20px_rgba(25,129,254,0.4)]`}
              />
            </div>

            {/* ── HORIZONTAL CARD FRONT CONTENT ── */}
            <div className="relative z-20 flex flex-col justify-between h-full">
              {/* Top Row: Brand Logo & NFC Contactless Symbol */}
              <div className="flex items-center justify-between">
                {/* TapByWiseIN Original Logo */}
                <div className="flex items-center">
                  <img
                    src="/logo-light.png"
                    alt="TapByWiseIN"
                    className={`${isLarge ? 'h-7 sm:h-10' : 'h-[22px] sm:h-7'} w-auto object-contain drop-shadow-sm`}
                  />
                </div>

                {/* NFC Contactless Wave Symbol */}
                <div className={`flex items-center ${isLarge ? 'gap-2 text-sm sm:text-base' : 'gap-1.5 text-xs sm:text-sm'} text-[#1265F5]`}>
                  <span className="font-bold tracking-widest uppercase">NFC</span>
                  <Wifi className={`${isLarge ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-4 h-4 sm:w-5 sm:h-5'} rotate-90`} />
                </div>
              </div>

              {/* Center / Body: Name, Designation & Professional Details */}
              <div className="my-auto py-2 max-w-[65%] sm:max-w-[70%]">
                {/* User's Name */}
                <h2 className={`${isLarge ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-2xl'} font-bold tracking-tight text-[#0B1528] leading-tight truncate`}>
                  {fullName}
                </h2>

                {/* Designation & Company */}
                <div className={`flex items-center gap-2 ${isLarge ? 'mt-2 sm:mt-2.5' : 'mt-1 sm:mt-1.5'} flex-wrap`}>
                  <span className={`${isLarge ? 'text-xs sm:text-base md:text-lg' : 'text-[11px] sm:text-xs md:text-sm'} font-semibold tracking-wide text-[#475569] truncate`}>
                    {designation}
                  </span>
                  <span className={`text-[#94A3B8] ${isLarge ? 'text-sm sm:text-base' : 'text-xs'} font-semibold`}>|</span>
                  <span className={`${isLarge ? 'text-xs sm:text-base md:text-lg' : 'text-[11px] sm:text-xs md:text-sm'} font-semibold tracking-wide text-[#1981FE] truncate`}>
                    {company}
                  </span>
                </div>

                {/* Tagline / Professional Pillars */}
                <div className={`flex items-center ${isLarge ? 'gap-3 text-sm sm:text-base mt-4 sm:mt-6' : 'gap-2 text-xs sm:text-sm mt-3 sm:mt-4'} text-[#475569] font-medium flex-wrap`}>
                  {tags.map((tag, idx) => (
                    <span key={tag} className="flex items-center gap-2">
                      {idx > 0 && <span className="text-[#94A3B8]">•</span>}
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Subtle Row */}
              <div className={`${isLarge ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-[11px]'} text-[#64748B] flex items-center justify-between pt-1`}>
                <span className={`text-slate-600 font-semibold tracking-[0.16em] uppercase ${isLarge ? 'text-xs sm:text-[14px]' : 'text-[10px] sm:text-[11.5px]'} opacity-95`}>
                  Sanshi Network Tech Private Limited
                </span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* ── BACK FACE: EXECUTIVE QR & NFC TAP TARGET (BRUSHED METALLIC) ── */}
          {/* ============================================================== */}
          <div
            className={`absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl ${
              isLarge ? 'p-8 sm:p-10' : 'p-6 sm:p-7'
            } flex flex-col items-center justify-between border border-slate-300/80 shadow-[0_25px_60px_-15px_rgba(25,129,254,0.35),0_10px_25px_-5px_rgba(0,0,0,0.12)] overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-[#E2E8F0] to-[#CBD5E1]`}
            style={{
              transform: 'rotateY(180deg)',
              WebkitTransform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              backgroundImage: `
                radial-gradient(circle at 80% 20%, rgba(255,255,255,0.95) 0%, transparent 50%),
                linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 30%, #CBD5E1 65%, #94A3B8 100%)
              `,
            }}
          >
            {/* Fine brushed metal texture simulation */}
            <div
              className="absolute inset-0 opacity-[0.22] pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage: `repeating-linear-gradient(90deg, rgba(255,255,255,0.7) 0px, rgba(0,0,0,0.2) 1px, transparent 2px, transparent 4px)`,
              }}
            />

            {/* Specular metallic bevel edge highlight */}
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl ring-1 ring-inset ring-white/90 pointer-events-none" />

            {/* ── BLUE DECORATIVE ACCENTS (MATCHING FRONT DESIGN) ── */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
              viewBox="0 0 500 315"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Top-Left Corner Gradient */}
                <linearGradient id="backTopLeftCorner" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.9" />
                  <stop offset="35%" stopColor="#3B82F6" stopOpacity="0.8" />
                  <stop offset="75%" stopColor="#60A5FA" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.3" />
                </linearGradient>

                {/* Bottom-Right Outer Wave Gradient */}
                <linearGradient id="backWaveOuter" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.4" />
                  <stop offset="40%" stopColor="#60A5FA" stopOpacity="0.55" />
                  <stop offset="85%" stopColor="#3B82F6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.5" />
                </linearGradient>

                {/* Bottom-Right Inner Vivid Corner Wave Gradient */}
                <linearGradient id="backWaveInner" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1E40AF" stopOpacity="0.88" />
                  <stop offset="50%" stopColor="#2563EB" stopOpacity="0.92" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.85" />
                </linearGradient>
              </defs>

              {/* 1. TOP-LEFT CORNER ACCENT SWOOSH (Tucked higher into corner, completely above logo) */}
              <path
                d="M 0 0 L 80 0 C 62 14 30 30 14 46 C 6 54 1 61 0 68 Z"
                fill="url(#backTopLeftCorner)"
              />

              {/* 2. BOTTOM-RIGHT OUTER SOFT WAVE */}
              <path
                d="M 275 315 C 335 315 378 296 425 256 C 466 222 488 196 500 185 L 500 315 Z"
                fill="url(#backWaveOuter)"
              />

              {/* 3. BOTTOM-RIGHT INNER VIVID CORNER WAVE */}
              <path
                d="M 380 315 C 415 315 446 298 472 268 C 488 250 496 235 500 220 L 500 315 Z"
                fill="url(#backWaveInner)"
              />
            </svg>

            {/* Top Row: Brand Logo & NFC Ready Status */}
            <div className="w-full flex items-center justify-between relative z-10">
              <div className="flex items-center translate-y-1.5 sm:translate-y-2">
                <img
                  src="/logo-light.png"
                  alt="TapByWiseIN"
                  className={`${isLarge ? 'h-7 sm:h-10' : 'h-[22px] sm:h-7'} w-auto object-contain drop-shadow-sm`}
                />
              </div>
              <div className={`flex items-center ${isLarge ? 'gap-2 text-sm sm:text-base' : 'gap-1.5 text-xs sm:text-sm'} text-[#1981FE]`}>
                <span className="font-bold tracking-widest uppercase">NFC</span>
                <Wifi className={`${isLarge ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-4 h-4 sm:w-5 sm:h-5'} rotate-90`} />
              </div>
            </div>

            {/* Central QR Code on Precision White Surface */}
            <div className={`${isLarge ? 'p-4 sm:p-5 rounded-3xl' : 'p-3 rounded-2xl'} bg-white/95 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,255,255,0.8)] border border-slate-200/80 flex flex-col items-center justify-center my-auto relative z-10`}>
              <QRCodeSVG
                value={publicUrl}
                size={isLarge ? 145 : 100}
                bgColor="#ffffff"
                fgColor="#0F172A"
                level="Q"
                marginSize={1}
              />
              <span className={`${isLarge ? 'text-[11px] sm:text-xs mt-2' : 'text-[9px] mt-1.5'} font-bold uppercase tracking-widest text-[#1981FE]`}>
                TAP OR SCAN
              </span>
            </div>

            {/* Bottom Row: Full Name & Profile Link */}
            <div className="text-center w-full relative z-10">
              <p className={`${isLarge ? 'text-sm sm:text-lg' : 'text-xs sm:text-sm'} font-bold text-[#0B1528] tracking-tight`}>{fullName}</p>
              <p className={`${isLarge ? 'text-xs sm:text-sm mt-1' : 'text-[11px] sm:text-xs mt-0.5'} text-[#1981FE] font-mono font-medium`}>{displayUrl}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Helper trigger */}
      <div className="flex items-center justify-center gap-3 mt-3 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => setIsFlipped(!isFlipped)}
          className="inline-flex items-center gap-1.5 font-medium hover:text-foreground text-primary transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>{isFlipped ? 'Show front face' : 'Click card to flip & view QR code'}</span>
        </button>
      </div>
    </div>
  );
};
