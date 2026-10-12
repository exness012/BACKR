export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImage(file: File, maxSizeMB: number): ImageValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file format. Please upload a PNG, JPG, or WEBP image.',
    };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is ${maxSizeMB}MB.`,
    };
  }

  return { valid: true };
}

export interface ResizeResult {
  dataUrl: string;
  sizeBytes: number;
  width: number;
  height: number;
}

/**
 * Calculates human readable file size
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Helper to calculate byte size from base64 data URL
 */
export function getDataUrlByteLength(dataUrl: string): number {
  const parts = dataUrl.split(',');
  if (parts.length < 2) return 0;
  const base64Str = parts[1];
  const padding = base64Str.endsWith('==') ? 2 : base64Str.endsWith('=') ? 1 : 0;
  return Math.floor((base64Str.length * 3) / 4) - padding;
}

/**
 * Resizes an image client-side to keep under maximum dimension and compresses to WebP/JPEG data URL.
 * Skips re-compression if the file is already WebP, within dimension bounds, and smaller than target.
 */
export async function resizeToDataUrl(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.75
): Promise<ResizeResult> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const origWidth = img.width;
      const origHeight = img.height;

      // If already within bounds, is webp, and reasonable size, we can read directly without re-compression
      if (
        file.type === 'image/webp' &&
        origWidth <= maxWidth &&
        origHeight <= maxHeight &&
        file.size < 500 * 1024
      ) {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          resolve({
            dataUrl: res,
            sizeBytes: file.size,
            width: origWidth,
            height: origHeight,
          });
        };
        reader.onerror = () => reject(new Error('Failed reading WebP file directly'));
        reader.readAsDataURL(file);
        return;
      }

      let targetWidth = origWidth;
      let targetHeight = origHeight;

      // Calculate scaled dimensions keeping aspect ratio
      if (targetWidth > maxWidth || targetHeight > maxHeight) {
        const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
        targetWidth = Math.max(1, Math.round(targetWidth * ratio));
        targetHeight = Math.max(1, Math.round(targetHeight * ratio));
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to obtain canvas 2D rendering context.'));
        return;
      }

      // Smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      try {
        // Try WebP at requested quality (0.75)
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        const sizeBytes = getDataUrlByteLength(dataUrl);

        resolve({
          dataUrl,
          sizeBytes,
          width: targetWidth,
          height: targetHeight,
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to encode image to data URL.'));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file for processing.'));
    };

    img.src = objectUrl;
  });
}
