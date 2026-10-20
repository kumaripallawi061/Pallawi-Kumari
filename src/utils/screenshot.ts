import html2canvas from 'html2canvas';

export interface ScreenshotOptions {
  filename?: string;
  showFlash?: boolean;
  onSuccess?: (dataUrl: string) => void;
  onError?: (err: unknown) => void;
}

/**
 * Triggers a subtle camera shutter flash animation on the viewport
 */
export const triggerShutterEffect = () => {
  const flash = document.createElement('div');
  flash.style.position = 'fixed';
  flash.style.inset = '0';
  flash.style.backgroundColor = 'white';
  flash.style.opacity = '0.75';
  flash.style.pointerEvents = 'none';
  flash.style.zIndex = '999999';
  flash.style.transition = 'opacity 350ms ease-out';
  document.body.appendChild(flash);

  requestAnimationFrame(() => {
    flash.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(flash)) {
        document.body.removeChild(flash);
      }
    }, 400);
  });
};

/**
 * Capture an HTMLElement as a PNG screenshot and download it
 */
export const captureScreenshot = async (
  targetElement?: HTMLElement | null,
  options: ScreenshotOptions = {}
): Promise<string | null> => {
  try {
    const el = targetElement || document.getElementById('root') || document.body;
    if (!el) return null;

    if (options.showFlash !== false) {
      triggerShutterEffect();
    }

    const canvas = await html2canvas(el, {
      scale: 2, // High resolution retina capture
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#f8fafc',
      logging: false,
      ignoreElements: (element) => {
        // Exclude floating action widgets if marked with data-no-screenshot
        return element.hasAttribute('data-no-screenshot');
      },
    });

    const dataUrl = canvas.toDataURL('image/png');
    const defaultName = `RLSY_ERP_Demo_Screenshot_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.png`;
    const filename = options.filename || defaultName;

    // Trigger download
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Try copying to clipboard if supported
    if (navigator.clipboard && window.ClipboardItem) {
      canvas.toBlob((blob) => {
        if (blob) {
          try {
            navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
          } catch {
            // Clipboard write might be restricted by browser permissions, ignore
          }
        }
      }, 'image/png');
    }

    if (options.onSuccess) {
      options.onSuccess(dataUrl);
    }

    return dataUrl;
  } catch (error) {
    console.warn('Screenshot capture error:', error);
    if (options.onError) {
      options.onError(error);
    }
    return null;
  }
};
