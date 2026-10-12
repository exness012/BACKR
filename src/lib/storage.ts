import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export interface UploadProgressCallback {
  (progress: number): void;
}

/**
 * Converts a base64 Data URL to a Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/webp';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Uploads an image (File or base64 data URL) to Firebase Storage and returns the public download URL.
 * Supports timeoutMs (defaults to 20,000ms = 20s).
 */
export async function uploadProjectAsset(
  path: string,
  imageInput: File | string,
  onProgress?: UploadProgressCallback,
  timeoutMs = 20000
): Promise<string> {
  let blob: Blob;

  if (typeof imageInput === 'string') {
    // If it's already an https URL, return as-is
    if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
      return imageInput;
    }
    blob = dataUrlToBlob(imageInput);
  } else {
    blob = imageInput;
  }

  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, blob, {
    contentType: blob.type || 'image/webp',
  });

  return new Promise((resolve, reject) => {
    let isSettled = false;
    let timer: NodeJS.Timeout | null = null;

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          try {
            uploadTask.cancel();
          } catch {
            // ignore cancel error
          }
          reject(new Error(`Storage upload timed out after ${timeoutMs / 1000}s for ${path}`));
        }
      }, timeoutMs);
    }

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        }
      },
      (error) => {
        if (timer) clearTimeout(timer);
        if (!isSettled) {
          isSettled = true;
          console.error(`Storage upload error at ${path}:`, error);
          reject(error);
        }
      },
      async () => {
        if (timer) clearTimeout(timer);
        if (!isSettled) {
          isSettled = true;
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (err) {
            reject(err);
          }
        }
      }
    );
  });
}
