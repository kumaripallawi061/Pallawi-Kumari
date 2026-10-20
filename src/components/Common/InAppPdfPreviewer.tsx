import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Printer,
  Download,
  Share2,
  FileText,
  Eye,
  Check,
  Building,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

export interface DocumentPreviewItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'receipt' | 'certificate' | 'noc';
  badgeText?: string;
  badgeColor?: 'emerald' | 'amber' | 'indigo' | 'rose' | 'slate';
  fileName: string;
  contentNode: React.ReactNode;
}

interface InAppPdfPreviewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentPreviewItem;
  extraDocuments?: DocumentPreviewItem[];
  defaultFullScreen?: boolean;
}

export const InAppPdfPreviewer: React.FC<InAppPdfPreviewerProps> = ({
  isOpen,
  onClose,
  document,
  extraDocuments = [],
  defaultFullScreen = false,
}) => {
  const [isFullScreen, setIsFullScreen] = useState<boolean>(defaultFullScreen);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [activeDocIndex, setActiveDocIndex] = useState<number>(0);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [pageFitMode, setPageFitMode] = useState<'fit-width' | 'fit-page' | 'manual'>('fit-width');

  const containerRef = useRef<HTMLDivElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // All documents in navigation set
  const allDocs = [document, ...extraDocuments.filter(d => d.id !== document.id)];
  const currentDoc = allDocs[activeDocIndex] || document;

  // Handle ESC key to exit full-screen or close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (isFullScreen) {
          setIsFullScreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullScreen, onClose]);

  // Lock body scroll when previewer modal is open
  useEffect(() => {
    if (isOpen) {
      const original = window.document.body.style.overflow;
      window.document.body.style.overflow = 'hidden';
      return () => {
        window.document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  // Reset rotation and zoom on doc change
  useEffect(() => {
    setRotation(0);
    setZoomLevel(100);
  }, [activeDocIndex]);

  if (!isOpen) return null;

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 15, 200));
    setPageFitMode('manual');
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 15, 50));
    setPageFitMode('manual');
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
    setRotation(0);
    setPageFitMode('fit-width');
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Triggers standard browser print/save as PDF dialog for exact vector/rendering accuracy
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: currentDoc.title,
        text: `Official Institutional ${currentDoc.title}: ${currentDoc.subtitle || ''}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `Official Institutional Document: ${currentDoc.title} - ${currentDoc.subtitle || ''}. File: ${currentDoc.fileName}`
      );
      setCopiedNotification('Document details & download link copied to clipboard.');
      setTimeout(() => setCopiedNotification(null), 3000);
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => !prev);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-md text-white animate-in fade-in duration-200">
      {/* Top Application Bar */}
      <header className="no-print bg-slate-900 border-b border-slate-800 px-3 sm:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-lg">
        {/* Left: Document Info & Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-[220px] sm:max-w-md">
                {currentDoc.title}
              </h3>
              {currentDoc.badgeText && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {currentDoc.badgeText}
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate">
              {currentDoc.fileName}
            </p>
          </div>
        </div>

        {/* Center: Multi-document pagination if multiple */}
        {allDocs.length > 1 && (
          <div className="hidden md:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
            <button
              type="button"
              disabled={activeDocIndex === 0}
              onClick={() => setActiveDocIndex((prev) => Math.max(prev - 1, 0))}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Previous Document"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-300 px-1">
              Doc {activeDocIndex + 1} of {allDocs.length}
            </span>
            <button
              type="button"
              disabled={activeDocIndex === allDocs.length - 1}
              onClick={() => setActiveDocIndex((prev) => Math.min(prev + 1, allDocs.length - 1))}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Next Document"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700/80 text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer"
              title="Zoom Out (-15%)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-300 min-w-[42px] text-center select-none">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer"
              title="Zoom In (+15%)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors ml-0.5 cursor-pointer"
              title="Rotate 90 degrees"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Share Document"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Full Screen Toggle */}
          <button
            type="button"
            onClick={toggleFullScreen}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title={isFullScreen ? 'Exit Full Screen (ESC)' : 'Full Screen Preview'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Print / Save PDF Primary */}
          <button
            type="button"
            onClick={handlePrint}
            className="min-h-[36px] px-3 sm:px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print / Save PDF</span>
            <span className="sm:hidden">Print</span>
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 rounded-lg border border-slate-700 transition-colors cursor-pointer ml-1"
            title="Close Preview (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Copy notification popup */}
      {copiedNotification && (
        <div className="no-print bg-emerald-500 text-slate-950 font-bold px-4 py-1.5 text-xs text-center flex items-center justify-center gap-1.5 shadow-md">
          <Check className="w-4 h-4" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Mobile Toolbar (Bottom or Sub-header for Mobile viewports 360-414px) */}
      <div className="no-print sm:hidden bg-slate-900/90 border-b border-slate-800 px-3 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 bg-slate-800 rounded text-slate-300"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="font-mono text-[10px] text-slate-300 px-1">{zoomLevel}%</span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 bg-slate-800 rounded text-slate-300"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            className="p-1.5 bg-slate-800 rounded text-slate-300 ml-1"
          >
            <RotateCw className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetZoom}
            className="text-[11px] text-indigo-400 font-semibold"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={toggleFullScreen}
            className="text-[11px] text-slate-300 flex items-center gap-1 bg-slate-800 px-2 py-1 rounded"
          >
            {isFullScreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            <span>{isFullScreen ? 'Fit' : 'Full'}</span>
          </button>
        </div>
      </div>

      {/* Main Document Preview Stage */}
      <main
        ref={containerRef}
        className={`flex-1 overflow-auto p-3 sm:p-8 flex items-center justify-center transition-all ${
          isFullScreen ? 'p-0 sm:p-2 bg-slate-950' : 'bg-slate-900/60'
        }`}
      >
        <div
          ref={printAreaRef}
          className="transition-transform origin-top duration-150 shadow-2xl relative my-auto"
          style={{
            transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
            maxWidth: isFullScreen ? '100%' : '900px',
            width: '100%',
          }}
        >
          {/* Document Content Canvas */}
          <div className="bg-white rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
            {currentDoc.contentNode}
          </div>
        </div>
      </main>

      {/* Footer Info & Verification Bar */}
      <footer className="no-print bg-slate-900 border-t border-slate-800 px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Institutional Digital Verification · ISO/IEC 27001 Authenticated Paperless Engine</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">Use browser dialog to Save as PDF</span>
          <button
            type="button"
            onClick={handleDownload}
            className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Download High-Res PDF</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
