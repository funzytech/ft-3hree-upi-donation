import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export interface VerifiedDonorItem {
  id: string;
  donorName: string;
  donorAvatar: string;
  amount: number;
  verifiedAt: string;
}

interface DonationActivityCarouselProps {
  refreshSignal?: number;
}

const DISPLAY_INTERVAL_MS = 2600; // >= 1.5s clearly visible pause before vertical transition

/**
 * Live Homepage Donation Activity Carousel.
 * Strictly displays ONLY genuine, verified donations where the donor voluntarily
 * submitted their name, profile image, and explicit public display consent.
 * Never populates dummy, sample, or synthetic donor records.
 */
export const DonationActivityCarousel: React.FC<DonationActivityCarouselProps> = ({
  refreshSignal = 0,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [verifiedDonations, setVerifiedDonations] = useState<VerifiedDonorItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchVerified = async () => {
      try {
        const res = await fetch('/api/donations/verified', {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && Array.isArray(data?.donations)) {
          const genuine = data.donations.filter(
            (item: unknown): item is VerifiedDonorItem => {
              if (!item || typeof item !== 'object') return false;
              const rec = item as Record<string, unknown>;
              return (
                typeof rec.id === 'string' &&
                typeof rec.donorName === 'string' &&
                rec.donorName.trim().length > 0 &&
                typeof rec.donorAvatar === 'string' &&
                rec.donorAvatar.trim().length > 0 &&
                typeof rec.amount === 'number' &&
                rec.amount > 0
              );
            }
          );
          setVerifiedDonations(genuine);
          setActiveIndex(0);
        }
      } catch {
        // Static hosting or offline: gracefully render nothing without fake entries
      }
    };

    fetchVerified();
    const pollTimer = setInterval(fetchVerified, 45000);

    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(pollTimer);
    };
  }, [refreshSignal]);

  useEffect(() => {
    if (verifiedDonations.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % verifiedDonations.length);
    }, DISPLAY_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [verifiedDonations.length]);

  // Strict Anti-Fake Rule: render nothing when no genuine verified donations exist
  if (verifiedDonations.length === 0) {
    return null;
  }

  const currentDonor = verifiedDonations[activeIndex % verifiedDonations.length];

  return (
    <section
      aria-label="Recent verified donations"
      className="relative z-10 w-full max-w-[440px] mt-4"
    >
      <div className="relative h-[74px] w-full overflow-hidden rounded-[22px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentDonor.id}
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 28, scale: 0.92, filter: 'blur(3px)' }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -28, scale: 0.88, filter: 'blur(4px)' }
            }
            transition={{
              duration: prefersReducedMotion ? 0.2 : 0.48,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="liquid-glass-menu absolute inset-0 rounded-[22px] px-4 py-3 flex items-center gap-3.5 shadow-[0_14px_30px_-10px_rgba(95,70,40,0.28)]"
          >
            <div className="glass-glow-rim" aria-hidden="true" />

            {/* Left Side: Donor Profile Picture */}
            <div className="relative h-12 w-12 shrink-0 rounded-full p-[2px] bg-gradient-to-br from-white via-[#f3e5cd] to-[#b8976b] shadow-sm">
              <img
                src={currentDonor.donorAvatar}
                alt={currentDonor.donorName}
                className="h-full w-full rounded-full object-cover object-center bg-[#f4ead9] select-none"
                loading="lazy"
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white ring-2 ring-[#f3e8d7]"
                title="Verified donor"
              >
                <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            </div>

            {/* Right Side: Donor Name + Donation Amount in INR */}
            <div className="min-w-0 flex-1 flex items-center justify-between gap-3 text-left">
              <div className="min-w-0 flex flex-col">
                <p className="truncate font-['Outfit',sans-serif] font-extrabold text-sm sm:text-[15px] text-[#241407] leading-tight">
                  {currentDonor.donorName}
                </p>
                <span className="text-[11px] font-semibold text-[#75583d] leading-snug">
                  Verified supporter
                </span>
              </div>

              <div className="shrink-0 text-right">
                <span className="font-['Outfit',sans-serif] font-black text-base sm:text-[17px] text-[#261508] tabular-nums tracking-tight">
                  ₹{currentDonor.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
