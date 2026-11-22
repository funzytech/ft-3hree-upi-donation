/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import paperTexture from './assets/images/crumpled_paper_texture_1791451700388.jpg';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { DonationCelebration } from './components/DonationCelebration';
import { AnimatedBrokenHeart } from './components/AnimatedBrokenHeart';
import { DonationActivityCarousel } from './components/DonationActivityCarousel';

const UPI_ID = 'FT.3hree';
const PAYEE_NAME = 'Shiv%20Kumar';
const PRESET_AMOUNTS = [10, 20, 50, 100, 200, 500];
const PROFILE_IMAGE_FILENAME = 'IMG_20261121_092927_ffb5e092.png';

const BUBBLES = [
  { id: 1, size: 48, left: '12%', duration: '28s', delay: '1.0s' },
  { id: 2, size: 30, left: '26%', duration: '34s', delay: '4.5s' },
  { id: 3, size: 64, left: '44%', duration: '30s', delay: '8.0s' },
  { id: 4, size: 36, left: '62%', duration: '26s', delay: '2.2s' },
  { id: 5, size: 54, left: '78%', duration: '32s', delay: '6.8s' },
  { id: 6, size: 28, left: '90%', duration: '29s', delay: '11.0s' },
];

// Synthesize BOTH crisp party-popper pop/crackle burst AND celebratory chime via Web Audio API
const playCelebrationSound = () => {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // 1. Party-Popper Sound: snappy low-mid pop thump + crisp paper burst + celebratory crackle
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(240, now);
    popOsc.frequency.exponentialRampToValueAtTime(52, now + 0.08);
    popGain.gain.setValueAtTime(0.9, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    popOsc.connect(popGain);
    popGain.connect(ctx.destination);
    popOsc.start(now);
    popOsc.stop(now + 0.1);

    // Primary party-popper burst + 2 quick confetti crackle pops
    const burstOffsets = [
      { delay: 0, dur: 0.11, freqStart: 1400, freqEnd: 220, amp: 0.95 },
      { delay: 0.055, dur: 0.065, freqStart: 2200, freqEnd: 650, amp: 0.55 },
      { delay: 0.11, dur: 0.055, freqStart: 2600, freqEnd: 900, amp: 0.42 },
    ];

    burstOffsets.forEach(({ delay, dur, freqStart, freqEnd, amp }) => {
      const start = now + delay;
      const bufferSize = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * (dur * 0.28)));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(1.1, start);
      filter.frequency.setValueAtTime(freqStart, start);
      filter.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(amp, start);
      gain.gain.exponentialRampToValueAtTime(0.008, start + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(start);
    });

    // 2. Celebratory Bell Chime Arpeggio (preserved and harmonized right after the pop)
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
      const start = now + 0.04 + idx * 0.045;
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, start);
      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.setValueAtTime(0.22, start);
      oscGain.gain.exponentialRampToValueAtTime(0.001, start + 0.62);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.68);
    });
  } catch {
    // Audio playback blocked or unavailable
  }
};

// Lightweight route helpers supporting both root (/) and GitHub Pages (/1-1)
function getBasePath(): string {
  if (typeof window === 'undefined') return '';
  const pathname = window.location.pathname || '';
  if (pathname.indexOf('/1-1') === 0 || window.location.hostname.includes('github.io')) {
    return '/1-1';
  }
  return '';
}

function getCurrentRoute(): string {
  if (typeof window === 'undefined') return '/';
  let path = (window.location.pathname || '/').toLowerCase();
  const basePath = getBasePath().toLowerCase();
  if (basePath && path.startsWith(basePath)) {
    path = path.slice(basePath.length);
  }
  const search = window.location.search;
  if (search) {
    try {
      const params = new URLSearchParams(search);
      const queryRoute = params.get('route') || params.get('p');
      if (queryRoute) {
        path = (queryRoute.startsWith('/') ? queryRoute : '/' + queryRoute).toLowerCase();
      }
    } catch {}
  }
  if (path.length > 1 && path.endsWith('/')) {
    path = path.replace(/\/+$/, '');
  }
  return path || '/';
}

function syncBrowserUrl(route: string, replace = false): void {
  if (typeof window === 'undefined') return;
  try {
    const basePath = getBasePath();
    const normalized = route === '/' ? (basePath ? `${basePath}/` : '/') : `${basePath}${route}`;
    if (window.location.pathname === normalized && !window.location.search.includes('route=')) return;
    if (replace) {
      window.history.replaceState({ route }, '', normalized);
    } else {
      window.history.pushState({ route }, '', normalized);
    }
  } catch {}
}

// Swipeable Liquid Glass Modal Card (Mobile Touch Gesture Support)
interface SwipeableModalCardProps {
  children: React.ReactNode;
  onClose: () => void;
  isClosing?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  showHandle?: boolean;
}

const SwipeableModalCard: React.FC<SwipeableModalCardProps> = ({
  children,
  onClose,
  isClosing = false,
  className = '',
  onClick,
  showHandle = true,
}) => {
  const [offsetY, setOffsetY] = useState(0);
  const startYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isClosing) return;
    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    startXRef.current = touch.clientX;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isClosing || startYRef.current === null || startXRef.current === null) return;
    const touch = e.touches[0];
    const diffY = touch.clientY - startYRef.current;
    const diffX = Math.abs(touch.clientX - startXRef.current);

    if (diffY > 6 && diffY > diffX) {
      const damped = Math.min(diffY * 0.82, 280);
      setOffsetY(damped);
    }
  };

  const handleTouchEnd = () => {
    if (isClosing) return;
    if (offsetY > 70) {
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(15);
        }
      } catch {}
      onClose();
    }
    setOffsetY(0);
    startYRef.current = null;
    startXRef.current = null;
  };

  return (
    <motion.div
      ref={cardRef}
      initial={isClosing ? false : { opacity: 0, scale: 0.94, y: 18, filter: 'blur(4px)' }}
      animate={
        isClosing
          ? { opacity: 0, scale: 0.92, y: 20, filter: 'blur(5px)' }
          : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }
      }
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 28,
        mass: 0.85,
      }}
      onClick={onClick || ((e) => e.stopPropagation())}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        transform: offsetY > 0 ? `translate3d(0, ${offsetY}px, 0)` : undefined,
        touchAction: 'pan-y',
      }}
      className={className}
    >
      {showHandle && (
        <div
          className="w-10 h-1.5 rounded-full bg-[#593e28]/25 hover:bg-[#593e28]/45 mx-auto -mt-1.5 mb-2.5 shrink-0 transition-colors cursor-grab active:cursor-grabbing select-none"
          aria-hidden="true"
        />
      )}
      {children}
    </motion.div>
  );
};

export default function App() {
  // Donation Modal State
  const [isDonateModalOpen, setIsDonateModalOpen] = useState<boolean>(false);
  const [isDonateModalClosing, setIsDonateModalClosing] = useState<boolean>(false);
  const [donationAmountType, setDonationAmountType] = useState<'preset' | 'any'>('any');
  const [selectedPresetAmount, setSelectedPresetAmount] = useState<number | null>(null);
  const [customDonationAmount, setCustomDonationAmount] = useState<string>('');
  const [hasInteractedWithAmount, setHasInteractedWithAmount] = useState<boolean>(false);
  const [donationQrDataUrl, setDonationQrDataUrl] = useState<string>('');
  const [prevQrDataUrl, setPrevQrDataUrl] = useState<string>('');
  const [qrTransitionId, setQrTransitionId] = useState<number>(0);
  const [showDonationThankYou, setShowDonationThankYou] = useState<boolean>(false);
  const [isDonationThankYouClosing, setIsDonationThankYouClosing] = useState<boolean>(false);
  const [completedDonationAmount, setCompletedDonationAmount] = useState<number | null>(null);
  const [reportedDonationId, setReportedDonationId] = useState<string | null>(null);
  const [copiedUpiId, setCopiedUpiId] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<boolean>(false);
  const [activityRefreshSignal, setActivityRefreshSignal] = useState<number>(0);

  const copiedUpiIdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevDonationAmountRef = useRef<number | null | undefined>(undefined);
  const qrDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const donationQrRef = useRef<string>('');

  const profileImageSrc = `${getBasePath()}/assets/aistudio/${PROFILE_IMAGE_FILENAME}`;

  const triggerHaptic = useCallback((pattern: number | number[] = 15) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {}
  }, []);

  // Desktop vs Mobile/Tablet detection (hides "Pay via UPI" on Desktop/Laptops, preserves on Mobile/Tablet)
  const [isDesktopDevice, setIsDesktopDevice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const ua = (navigator.userAgent || '').toLowerCase();
    const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const isMobileOrTabletUA =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(ua) ||
      isIPadOS;
    if (isMobileOrTabletUA) return false;
    const isTouchOnly = window.matchMedia('(pointer: coarse) and (hover: none)').matches;
    if (isTouchOnly) return false;
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    const isWide = window.innerWidth >= 1024;
    return (isWide || hasFinePointer) && !isMobileOrTabletUA;
  });

  useEffect(() => {
    const handleDeviceCheck = () => {
      const ua = (navigator.userAgent || '').toLowerCase();
      const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
      const isMobileOrTabletUA =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(ua) ||
        isIPadOS;
      if (isMobileOrTabletUA) {
        setIsDesktopDevice(false);
        return;
      }
      const isTouchOnly = window.matchMedia('(pointer: coarse) and (hover: none)').matches;
      if (isTouchOnly) {
        setIsDesktopDevice(false);
        return;
      }
      const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
      const isWide = window.innerWidth >= 1024;
      setIsDesktopDevice((isWide || hasFinePointer) && !isMobileOrTabletUA);
    };

    window.addEventListener('resize', handleDeviceCheck);
    return () => window.removeEventListener('resize', handleDeviceCheck);
  }, []);

  // Dynamic Donation Amount Calculations
  const parsedCustomAmount = customDonationAmount.trim() ? parseInt(customDonationAmount, 10) : 0;
  const activeDonationAmount: number | null =
    donationAmountType === 'preset' && selectedPresetAmount
      ? selectedPresetAmount
      : parsedCustomAmount > 0
      ? parsedCustomAmount
      : null;

  // Dynamic Donation UPI URI: omits am parameter when no amount is selected
  const currentDonationUpiUri = activeDonationAmount
    ? `upi://pay?pa=${UPI_ID}&pn=${PAYEE_NAME}&am=${activeDonationAmount}&cu=INR`
    : `upi://pay?pa=${UPI_ID}&pn=${PAYEE_NAME}&cu=INR`;

  // Preloaded QR code generation with smooth 0.5s mix/blend cross-fade and zero flicker
  useEffect(() => {
    if (!isDonateModalOpen) {
      prevDonationAmountRef.current = undefined;
      return;
    }

    if (prevDonationAmountRef.current === activeDonationAmount && donationQrRef.current) {
      return;
    }

    if (qrDebounceTimerRef.current) {
      clearTimeout(qrDebounceTimerRef.current);
    }

    let isMounted = true;
    qrDebounceTimerRef.current = setTimeout(() => {
      prevDonationAmountRef.current = activeDonationAmount;
      QRCode.toDataURL(currentDonationUpiUri, {
        width: 520,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' },
      })
        .then((url) => {
          if (!isMounted) return;
          // Preload generated QR bitmap so the 0.5s blend runs with zero blank flicker
          const preloadImg = new Image();
          const commitSwap = () => {
            if (!isMounted) return;
            if (donationQrRef.current && donationQrRef.current !== url) {
              setPrevQrDataUrl(donationQrRef.current);
              setQrTransitionId((id) => id + 1);
            }
            donationQrRef.current = url;
            setDonationQrDataUrl(url);
          };
          preloadImg.onload = commitSwap;
          preloadImg.onerror = commitSwap;
          preloadImg.src = url;
        })
        .catch((err) => {
          console.warn('Donation QR generation error:', err);
        });
    }, 60);

    return () => {
      isMounted = false;
      if (qrDebounceTimerRef.current) {
        clearTimeout(qrDebounceTimerRef.current);
      }
    };
  }, [activeDonationAmount, currentDonationUpiUri, isDonateModalOpen]);

  // Silent Screenshot & Screen Recording Protection while Donate Modal is active
  useEffect(() => {
    if (!isDonateModalOpen || isDonateModalClosing) {
      document.body.classList.remove('donate-protection-active');
      return;
    }

    document.body.classList.add('donate-protection-active');

    const handleCaptureKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' ||
        e.code === 'PrintScreen' ||
        ((e.metaKey || e.ctrlKey) &&
          e.shiftKey &&
          (e.key === 's' || e.key === 'S' || e.key === '3' || e.key === '4' || e.key === '5'))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleCaptureKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      document.body.classList.remove('donate-protection-active');
      window.removeEventListener('keydown', handleCaptureKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, [isDonateModalOpen, isDonateModalClosing]);

  // Direct route handling (/pay opens Donate Modal directly on load; popstate syncs Back/Forward)
  useEffect(() => {
    const resolveRoute = (route: string) => {
      if (route === '/pay' || route === '/donate') {
        setSelectedPresetAmount(null);
        setCustomDonationAmount('');
        setHasInteractedWithAmount(false);
        setDonationAmountType('any');
        setShowDonationThankYou(false);
        setIsDonationThankYouClosing(false);
        setIsDonateModalOpen(true);
        setIsDonateModalClosing(false);
      } else if (route === '/pay/thanks') {
        setIsDonateModalOpen(false);
        setIsDonateModalClosing(false);
        setShowDonationThankYou(true);
        setIsDonationThankYouClosing(false);
      } else {
        setIsDonateModalOpen(false);
        setIsDonateModalClosing(false);
        setShowDonationThankYou(false);
        setIsDonationThankYouClosing(false);
      }
    };

    const initial = getCurrentRoute();
    resolveRoute(initial);
    if (initial === '/pay' || initial === '/donate') {
      syncBrowserUrl('/pay', true);
    } else if (initial === '/pay/thanks') {
      syncBrowserUrl('/pay/thanks', true);
    }

    const onPopState = () => {
      resolveRoute(getCurrentRoute());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Escape key closes active modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDonationThankYou && !isDonationThankYouClosing) {
          handleCloseThankYou();
        } else if (isDonateModalOpen && !isDonateModalClosing) {
          handleCloseDonateModal();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handleOpenDonateModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic(15);
    setSelectedPresetAmount(null);
    setCustomDonationAmount('');
    setHasInteractedWithAmount(false);
    setDonationAmountType('any');
    setShowDonationThankYou(false);
    setIsDonationThankYouClosing(false);
    setIsDonateModalOpen(true);
    setIsDonateModalClosing(false);
    syncBrowserUrl('/pay', false);
  };

  const handleCloseDonateModal = () => {
    if (isDonateModalClosing) return;
    setIsDonateModalClosing(true);
    syncBrowserUrl('/', false);
    setTimeout(() => {
      setIsDonateModalOpen(false);
      setIsDonateModalClosing(false);
    }, 240);
  };

  const handleCloseThankYou = () => {
    if (isDonationThankYouClosing) return;
    setIsDonationThankYouClosing(true);
    syncBrowserUrl('/', false);
    setTimeout(() => {
      setShowDonationThankYou(false);
      setIsDonationThankYouClosing(false);
      setActivityRefreshSignal((n) => n + 1);
    }, 240);
  };

  const handleSelectPresetAmount = (amt: number) => {
    triggerHaptic(12);
    setHasInteractedWithAmount(true);
    setSelectedPresetAmount(amt);
    setCustomDonationAmount('');
    setDonationAmountType('preset');
  };

  const handleCustomAmountChange = (raw: string) => {
    const sanitized = raw.replace(/[^0-9]/g, '');
    setHasInteractedWithAmount(true);
    setCustomDonationAmount(sanitized);
    setSelectedPresetAmount(null);
    setDonationAmountType('any');
  };

  const handleCopyUpiId = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic(15);
    const fallbackCopy = () => {
      const ta = document.createElement('textarea');
      ta.value = UPI_ID;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {}
      document.body.removeChild(ta);
    };

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(UPI_ID).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }

    setCopiedUpiId(true);
    if (copiedUpiIdTimerRef.current) clearTimeout(copiedUpiIdTimerRef.current);
    copiedUpiIdTimerRef.current = setTimeout(() => {
      setCopiedUpiId(false);
    }, 1800);
  };

  const handlePayNow = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic(20);
    if (donationAmountType === 'any' && customDonationAmount.trim()) {
      const parsed = parseInt(customDonationAmount, 10);
      if (isNaN(parsed) || parsed <= 0) return;
    }
    try {
      window.location.href = currentDonationUpiUri;
    } catch (err) {
      console.warn('Could not launch payment URI directly:', err);
    }
  };

  const fireCelebrationFanfare = useCallback(() => {
    const palette = ['#f59e0b', '#d97706', '#fbbf24', '#f43f5e', '#10b981', '#fde68a'];
    try {
      confetti({
        particleCount: 65,
        spread: 68,
        startVelocity: 36,
        origin: { x: 0.5, y: 0.62 },
        colors: palette,
      });
      setTimeout(() => {
        try {
          confetti({
            particleCount: 38,
            angle: 60,
            spread: 55,
            startVelocity: 40,
            origin: { x: 0.14, y: 0.68 },
            colors: palette,
          });
          confetti({
            particleCount: 38,
            angle: 120,
            spread: 55,
            startVelocity: 40,
            origin: { x: 0.86, y: 0.68 },
            colors: palette,
          });
        } catch {}
      }, 220);
    } catch {}

    try {
      playCelebrationSound();
    } catch {}
  }, []);

  const handleConfirmContribution = () => {
    const reportedAmount = activeDonationAmount;
    setCompletedDonationAmount(reportedAmount);
    setReportedDonationId(null);
    fireCelebrationFanfare();

    // Record donor-reported contribution strictly as 'pending_verification' (never auto-verified)
    fetch('/api/donations/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: reportedAmount }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.id) {
          setReportedDonationId(data.id);
        }
      })
      .catch(() => {
        // Static hosting fallback: celebration still proceeds cleanly
      });

    setTimeout(() => {
      setIsDonateModalOpen(false);
      setIsDonateModalClosing(false);
      setShowDonationThankYou(true);
      setIsDonationThankYouClosing(false);
      syncBrowserUrl('/pay/thanks', false);
    }, 260);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-exact-warm flex flex-col items-center justify-center px-4">
      {/* Aesthetic Parchment Paper Texture Layer */}
      <div
        className="pointer-events-none fixed -inset-4 bg-cover bg-center bg-no-repeat opacity-[0.24] mix-blend-multiply blur-[1px]"
        style={{ backgroundImage: `url(${paperTexture})` }}
        aria-hidden="true"
      />

      {/* Fine Paper Fiber Grain Overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.12] mix-blend-color-burn"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      {/* Subtle Floating Warm Bubbles */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        {BUBBLES.map((bubble) => (
          <div
            key={bubble.id}
            className="floating-bubble-soft"
            style={{
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              left: bubble.left,
              animationDuration: bubble.duration,
              animationDelay: bubble.delay,
            }}
          />
        ))}
      </div>

      {/* Main Centered Donation Dashboard */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-[440px]">
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="liquid-glass-menu w-full rounded-[32px] px-7 py-9 sm:px-9 sm:py-11 flex flex-col items-center gap-6 shadow-[0_24px_54px_-12px_rgba(95,70,40,0.34)]"
        >
          <div className="glass-glow-rim" aria-hidden="true" />

          {/* Brand Emblem & Identity (FT.3hree · Shiv Kumar) */}
          <div className="flex flex-col items-center gap-3.5">
            <div className="h-20 w-20 sm:h-22 sm:w-22 rounded-2xl bg-white/85 border-2 border-white/95 shadow-[0_10px_24px_-6px_rgba(65,42,18,0.34)] overflow-hidden flex items-center justify-center p-0.5">
              {!logoError ? (
                <img
                  src={profileImageSrc}
                  alt="FT.3hree"
                  onError={() => setLogoError(true)}
                  className="w-full h-full object-cover object-center rounded-[14px] select-none"
                />
              ) : (
                <span className="font-['Outfit',sans-serif] font-black text-xl text-[#261508]">
                  FT
                </span>
              )}
            </div>

            <div className="flex flex-col items-center gap-1">
              <h1 className="font-['Outfit',sans-serif] font-extrabold text-2xl sm:text-3xl tracking-tight text-debossed">
                FT.3hree
              </h1>
              <p className="text-xs sm:text-sm font-medium text-[#6d5138]">
                Support Creator · Shiv Kumar
              </p>
            </div>
          </div>

          {/* Primary Center Action: Premium Animated Donate Now Button */}
          <div className="relative w-full max-w-[264px] flex items-center justify-center overflow-visible">
            {/* Subtle Ambient Depth Aura */}
            <div
              className="donate-cta-aura pointer-events-none absolute -inset-1.5 rounded-3xl"
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={handleOpenDonateModal}
              className="donate-cta-premium group relative w-full py-3.5 px-7 rounded-2xl bg-gradient-to-r from-[#3a2210] via-[#2c1708] to-[#1e0f05] hover:from-[#2c1708] hover:to-black text-[#fffaf2] font-['Outfit',sans-serif] font-extrabold text-base sm:text-[17px] tracking-tight transition-colors duration-200 cursor-pointer border border-[#c7a77b]/50 flex items-center justify-center gap-2.5 overflow-visible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#593e28] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e6d5b7]"
            >
              {/* Clipped inner shine reflection layer (keeps button overflow-visible for zero heart clipping) */}
              <span
                className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden"
                aria-hidden="true"
              >
                <span className="donate-cta-shine-beam absolute inset-y-0 left-0 w-16" />
              </span>

              <AnimatedBrokenHeart className="w-7 h-7 -my-1 -ml-1" />
              <span className="relative z-10 whitespace-nowrap">Donate Now</span>
            </button>
          </div>
        </motion.div>

        {/* Live Homepage Verified Donation Activity Carousel (renders strictly verified donors only) */}
        <DonationActivityCarousel refreshSignal={activityRefreshSignal} />
      </main>

      {/*
        Dedicated QR Code Payment Selection Modal:
        1. Amount selection (presets ₹10, ₹20, ₹50, ₹100, ₹200, ₹500)
        2. Any Amount / custom donation amount option
        3. Large crisp black donation QR code with smooth ~0.5s mix/blend transition
        4. Real configured UPI ID (FT.3hree) with icon-only copy button
        5. Pay via UPI button (Mobile/Tablet only)
        6. I've Completed My Donation button (unchanged color + heartbeat pulse after amount interaction)
      */}
      {isDonateModalOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleCloseDonateModal();
          }}
          className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-md overflow-hidden select-none ${
            isDonateModalClosing ? 'animate-contact-backdrop-close' : 'animate-contact-backdrop'
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="donate-modal-heading"
        >
          <SwipeableModalCard
            onClose={handleCloseDonateModal}
            isClosing={isDonateModalClosing}
            className={`liquid-glass-menu donate-protected-content relative w-full max-w-[380px] sm:max-w-[400px] rounded-[24px] p-3.5 sm:p-4 shadow-[0_24px_50px_-12px_rgba(95,70,40,0.38)] flex flex-col gap-2 overflow-hidden ${
              isDonateModalClosing ? 'animate-about-modal-close' : 'animate-contact-modal'
            }`}
          >
            <div className="glass-glow-rim" aria-hidden="true" />

            {/* Header with Title and Close Button */}
            <div className="flex items-center justify-between pb-1.5 border-b border-[#a68d6a]/25 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 border border-rose-200/80 shadow-xs text-rose-500">
                  <svg className="h-3.5 w-3.5 fill-current animate-pulse" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <div>
                  <h3
                    id="donate-modal-heading"
                    className="font-['Outfit',sans-serif] font-black text-sm sm:text-base text-[#261508] leading-tight"
                  >
                    Support Us
                  </h3>
                  <p className="text-[9px] text-[#7d644d] font-semibold leading-none">
                    Support FT.3hree Creator
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic(12);
                  handleCloseDonateModal();
                }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/70 hover:bg-white text-[#4a321f] transition-all cursor-pointer shadow-xs border border-white/80 active:scale-95 shrink-0"
                aria-label="Close"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* 1. AMOUNT SELECTION (Predefined Presets) */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-[#7d644d]">
                Amount Selection
              </span>
              <div className="grid grid-cols-6 gap-1">
                {PRESET_AMOUNTS.map((amt) => {
                  const isSelected = donationAmountType === 'preset' && selectedPresetAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSelectPresetAmount(amt)}
                      className={`py-1 px-0.5 rounded-lg text-xs font-bold font-['Outfit',sans-serif] tabular-nums transition-all duration-200 cursor-pointer shadow-2xs active:scale-95 border ${
                        isSelected
                          ? 'bg-[#2c1708] text-white border-black shadow-xs scale-102 ring-1 ring-amber-400/50'
                          : 'bg-white/75 hover:bg-white text-[#382312] border-white/90 hover:scale-[1.01]'
                      }`}
                    >
                      <span>₹{amt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. ANY AMOUNT (Custom Amount Option) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(12);
                  setDonationAmountType('any');
                  setSelectedPresetAmount(null);
                  setCustomDonationAmount('');
                }}
                className={`py-1.5 px-2 rounded-lg text-[10.5px] font-extrabold font-['Outfit',sans-serif] transition-all duration-200 cursor-pointer shadow-2xs active:scale-95 border shrink-0 whitespace-nowrap ${
                  donationAmountType === 'any'
                    ? 'bg-[#2c1708] text-white border-black ring-1 ring-amber-400/50'
                    : 'bg-white/75 hover:bg-white text-[#382312] border-white/90'
                }`}
              >
                Any Amount
              </button>
              <div className="relative flex-1 flex items-center">
                <span className="absolute left-2.5 text-xs font-black text-[#5c3e21]">₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter custom amount"
                  value={customDonationAmount}
                  onFocus={() => {
                    setDonationAmountType('any');
                    setSelectedPresetAmount(null);
                  }}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="w-full pl-6 pr-2.5 py-1.5 rounded-lg bg-white/90 border border-white/95 text-xs font-bold tabular-nums text-[#261508] placeholder-[#9c8269] shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all duration-200"
                />
              </div>
            </div>

            {/* 3. LARGE DONATION QR CODE (Pure #000/#fff, Smooth 0.5s Mix/Blend Transition) */}
            <div
              className={`relative w-full ${
                isDesktopDevice ? 'max-w-[250px] sm:max-w-[270px]' : 'max-w-[220px] sm:max-w-[240px]'
              } aspect-square mx-auto flex items-center justify-center p-2 bg-white rounded-2xl border border-[#a68d6a]/25 shadow-xs shrink-0 overflow-hidden`}
            >
              {/* Outgoing QR smoothly fades & scales out during the 0.5s mix transition, then unmounts cleanly */}
              {prevQrDataUrl && prevQrDataUrl !== donationQrDataUrl && (
                <motion.img
                  key={`prev-${qrTransitionId}`}
                  src={prevQrDataUrl}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: 0, scale: 0.965 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] object-contain rounded-lg select-none pointer-events-none"
                />
              )}

              {/* Incoming crisp scannable QR code blends smoothly over ~0.5s */}
              {donationQrDataUrl ? (
                <motion.img
                  key={`curr-${qrTransitionId}-${donationQrDataUrl.slice(-16)}`}
                  id="donation-qr-image"
                  src={donationQrDataUrl}
                  alt="Payment QR Code"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  initial={prevQrDataUrl ? { opacity: 0, scale: 1.035 } : { opacity: 1, scale: 1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: prevQrDataUrl ? 0.5 : 0, ease: [0.22, 1, 0.36, 1] }}
                  onAnimationComplete={() => {
                    if (prevQrDataUrl) {
                      setPrevQrDataUrl('');
                    }
                  }}
                  className="relative z-10 w-full h-full object-contain rounded-lg select-none block pointer-events-auto"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="h-6 w-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Real Configured UPI ID (FT.3hree) with Icon-Only Copy Button */}
            <div className="flex items-center justify-center gap-2 py-1 px-3 rounded-xl bg-[#241306]/90 backdrop-blur-md border border-[#8a6844]/40 shadow-xs self-center">
              <span className="text-[11px] font-bold font-mono tracking-tight text-[#fdf9f3] select-all">
                {UPI_ID}
              </span>
              <button
                type="button"
                onClick={handleCopyUpiId}
                aria-label="Copy UPI ID"
                title="Copy UPI ID"
                className={`p-1 rounded-lg transition-colors duration-300 cursor-pointer active:scale-90 flex items-center justify-center ${
                  copiedUpiId
                    ? 'text-emerald-400 bg-emerald-900/50'
                    : 'text-amber-200/80 hover:text-white hover:bg-white/15'
                }`}
              >
                {copiedUpiId ? (
                  <svg
                    className="h-3.5 w-3.5 transition-opacity duration-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    className="h-3.5 w-3.5 transition-opacity duration-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>

            <p className="text-[10px] sm:text-[10.5px] font-bold text-[#6d5138] text-center tracking-tight select-none">
              Please scan the QR code manually. Do not screenshot.
            </p>

            {/* 4. PRIMARY BUTTON: Pay via UPI (Mobile/Tablet only) & 5. SECONDARY BUTTON: I've Completed My Donation */}
            <div className="flex flex-col gap-1.5 pt-0.5">
              {!isDesktopDevice && (
                <button
                  type="button"
                  onClick={handlePayNow}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#2c1708] via-[#45270f] to-[#2c1708] hover:from-black hover:to-black text-white font-['Outfit',sans-serif] font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all text-center cursor-pointer border border-[#8c6b4b]/40 select-none md:hidden"
                >
                  Pay via UPI
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic(18);
                  handleConfirmContribution();
                }}
                className={`w-full py-2 px-4 rounded-xl font-['Outfit',sans-serif] font-black text-xs shadow-2xs active:scale-95 transition-all text-center cursor-pointer border select-none bg-white/85 hover:bg-white text-[#2c1708] border-[#a68d6a]/40 ${
                  hasInteractedWithAmount ? 'animate-donation-heartbeat shadow-md' : ''
                }`}
              >
                I've Completed My Donation
              </button>
            </div>
          </SwipeableModalCard>
        </div>
      )}

      {/* Celebratory Thank-You Confirmation Popup + Optional Donor Profile Submission */}
      {showDonationThankYou && (
        <div
          onClick={handleCloseThankYou}
          className={`fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/45 backdrop-blur-md overflow-y-auto ${
            isDonationThankYouClosing ? 'animate-contact-backdrop-close' : 'animate-contact-backdrop'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Donation confirmation celebration"
        >
          <SwipeableModalCard
            onClose={handleCloseThankYou}
            isClosing={isDonationThankYouClosing}
            className={`liquid-glass-menu relative w-full max-w-[390px] max-h-[92vh] overflow-y-auto rounded-[28px] px-5 py-5 sm:px-6 sm:py-5 shadow-[0_24px_50px_-12px_rgba(95,70,40,0.38)] flex flex-col items-center text-center ${
              isDonationThankYouClosing ? 'animate-contact-modal-close' : 'animate-contact-modal'
            }`}
          >
            <div className="glass-glow-rim" aria-hidden="true" />
            <DonationCelebration
              amount={completedDonationAmount}
              donationId={reportedDonationId}
              onClose={handleCloseThankYou}
            />
          </SwipeableModalCard>
        </div>
      )}
    </div>
  );
}
