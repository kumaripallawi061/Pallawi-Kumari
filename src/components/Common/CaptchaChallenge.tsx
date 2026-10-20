import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Volume2, ShieldCheck, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  userInput: string;
  onUserInputChange: (val: string) => void;
  errorMessage?: string | null;
  onRefresh?: () => void;
  onCodeGenerated?: (code: string) => void;
}

export const generateCaptchaCode = (length = 6): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result.toUpperCase();
};

export const CaptchaChallenge: React.FC<Props> = ({
  userInput,
  onUserInputChange,
  errorMessage,
  onRefresh,
  onCodeGenerated,
}) => {
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const refreshCaptcha = () => {
    const newCode = generateCaptchaCode(6);
    setCaptchaCode(newCode);
    if (onCodeGenerated) onCodeGenerated(newCode);
    if (onRefresh) onRefresh();
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  // Draw captcha onto canvas whenever captchaCode changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !captchaCode) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#f1f5f9');
    bgGradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Random noise background lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 120 + 80)}, ${Math.floor(Math.random() * 120 + 80)}, ${Math.floor(Math.random() * 120 + 80)}, 0.45)`;
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height
      );
      ctx.stroke();
    }

    // Random background dots
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, 0.3)`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render characters with variable rotation, font, and color
    const charWidth = width / (captchaCode.length + 1);
    const fonts = ['bold 24px monospace', 'bold 24px sans-serif', 'italic bold 25px serif'];
    const colors = ['#0f172a', '#1e293b', '#047857', '#4338ca', '#b91c1c', '#0369a1'];

    for (let i = 0; i < captchaCode.length; i++) {
      const char = captchaCode[i];
      const font = fonts[i % fonts.length];
      const color = colors[i % colors.length];

      ctx.save();
      const x = (i + 0.75) * charWidth;
      const y = height / 2 + (Math.random() * 6 - 3);
      const angle = (Math.random() * 30 - 15) * (Math.PI / 180);

      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(char, 0, 0);

      ctx.restore();
    }

    // Grid scratch overlay
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
    ctx.lineWidth = 1;
    for (let x = 10; x < width; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + Math.sin(x) * 10, height);
      ctx.stroke();
    }
  }, [captchaCode]);

  const speakCaptcha = () => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function') {
        window.speechSynthesis.cancel();
        const textToSpeak = captchaCode.split('').join(' ');
        const utterance = new window.SpeechSynthesisUtterance(`Captcha code: ${textToSpeak}`);
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // SpeechSynthesis may be restricted in sandboxed iframes
    }
  };

  // Check matching on input filling (always in capital letters)
  const trimmedInput = userInput.trim().toUpperCase();
  const isFilled = trimmedInput.length > 0;
  const isMatch = isFilled && trimmedInput === captchaCode.toUpperCase();
  const doesPrefixMatch = isFilled && captchaCode.toUpperCase().startsWith(trimmedInput);

  // Red border condition:
  // - Explicit error from parent
  // - Filled characters that do not match the prefix
  // - Full length filled but not matching
  const isWrong = Boolean(errorMessage) || (isFilled && !doesPrefixMatch) || (trimmedInput.length >= captchaCode.length && !isMatch);
  // Green border condition: exact match
  const isCorrect = isMatch;

  return (
    <div className="space-y-2 pt-1 border-t border-slate-200">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Security Verification CAPTCHA *</span>
        </label>
        <span className="text-[10px] text-emerald-700 font-mono font-bold">Always in CAPITAL letters</span>
      </div>

      {/* Responsive Container: In mobile view (< sm), blank input is below the captcha; in sm+ they sit side-by-side */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
        {/* Captcha Canvas & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Canvas Display */}
          <div className="relative rounded-lg border-2 border-slate-300 overflow-hidden bg-slate-100 shadow-inner flex items-center justify-center shrink-0">
            <canvas
              ref={canvasRef}
              width={160}
              height={46}
              className="block select-none cursor-pointer"
              onClick={refreshCaptcha}
              title="Click image to regenerate CAPTCHA"
            />
          </div>

          {/* Action Buttons: Refresh & Audio */}
          <div className="flex flex-row sm:flex-col gap-1 shrink-0">
            <button
              type="button"
              onClick={refreshCaptcha}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer shadow-2xs"
              title="Generate new CAPTCHA code"
              aria-label="Generate new CAPTCHA code"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={speakCaptcha}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer shadow-2xs"
              title="Audio read out of CAPTCHA characters"
              aria-label="Audio read out of CAPTCHA characters"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Captcha Filling Blank Space: placed below captcha on mobile (full width), beside on desktop */}
        <div className="flex-1 w-full">
          <div className="relative">
            <input
              type="text"
              required
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck="false"
              maxLength={6}
              placeholder="Enter CAPTCHA (CAPITAL LETTERS)"
              value={userInput}
              onChange={(e) => onUserInputChange(e.target.value.toUpperCase())}
              className={`w-full p-2.5 pr-8 text-xs font-mono font-bold tracking-wider rounded-lg transition-all focus:outline-none uppercase ${
                isCorrect
                  ? 'border-2 border-emerald-500 bg-emerald-50/40 text-emerald-950 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs'
                  : isWrong
                  ? 'border-2 border-rose-500 bg-rose-50/40 text-rose-950 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 shadow-xs'
                  : 'border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-300 shadow-2xs'
              }`}
            />
            {isCorrect && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            )}
            {isWrong && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-rose-500 pointer-events-none">
                <XCircle className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Match Feedback */}
      {isCorrect && (
        <div className="p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>CAPTCHA verified successfully!</span>
        </div>
      )}

      {isWrong && (
        <div className="p-1.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{errorMessage || 'Code does not match CAPTCHA. Please enter characters shown in image.'}</span>
        </div>
      )}
    </div>
  );
};

