import React, { useState, useEffect } from 'react';
import { Cake, Sparkles, X, Heart, Award } from 'lucide-react';

interface Props {
  userName: string;
  userRole?: string;
  userIdentifier?: string; // Roll number or employee code
  formattedDob?: string;
  onDismiss?: () => void;
  isModal?: boolean;
}

export const BirthdayCelebrationBanner: React.FC<Props> = ({
  userName,
  userRole = 'student',
  userIdentifier,
  formattedDob,
  onDismiss,
  isModal = false,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Keep confetti animating smoothly for initial celebration
    const timer = setTimeout(() => setShowConfetti(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) return null;

  const content = (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-indigo-500/15 border border-amber-300/80 dark:border-amber-700/80 p-4 sm:p-5 shadow-sm text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
      {/* Subtle festive particle burst overlay */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
          <span className="absolute top-2 left-6 text-sm animate-bounce opacity-80">🎉</span>
          <span className="absolute top-4 right-10 text-sm animate-pulse opacity-75">✨</span>
          <span className="absolute bottom-3 left-1/4 text-xs animate-ping opacity-60">⭐</span>
          <span className="absolute top-2 right-1/3 text-xs animate-bounce opacity-70">🎈</span>
          <span className="absolute bottom-2 right-8 text-sm opacity-80">🎂</span>
        </div>
      )}

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          {/* Cake Icon Capsule */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 ring-4 ring-amber-100 dark:ring-amber-950">
            <Cake className="w-6 h-6 animate-pulse" />
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold tracking-wider uppercase text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/40 px-2 py-0.5 rounded-md border border-amber-300/60 flex items-center gap-1 shrink-0">
                <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Birthday Celebration</span>
              </span>
              {formattedDob && (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {formattedDob}
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Happy Birthday, {userName}! 🎂
            </h3>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl">
              The Principal, Faculty Members, and Administration of the College extend their warmest felicitations to you today!
              May this year bring academic distinction, boundless inspiration, and radiant milestones in your journey.
            </p>

            {userIdentifier && (
              <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Verified Institutional Record · {userRole === 'student' ? 'Roll No' : 'Staff Code'}: <strong className="font-mono text-slate-800 dark:text-slate-200">{userIdentifier}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Close / Dismiss button */}
        <button
          type="button"
          onClick={handleClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer shrink-0"
          title="Dismiss birthday banner"
          aria-label="Dismiss birthday banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-2.5 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between text-xs">
        <span className="text-[11px] text-amber-900 dark:text-amber-200 font-medium flex items-center gap-1">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>Wishing you joy, good health, and success</span>
        </span>
        <button
          type="button"
          onClick={handleClose}
          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          Thank You!
        </button>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-2 shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
