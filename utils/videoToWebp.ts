/**
 * Conversor cliente-side de archivos (Imágenes, GIFs, Videos MP4/MOV) a WebP optimizado.
 * Extrae fotogramas de video instantáneamente a una imagen WebP de ~300KB.
 */

export async function convertFileToWebp(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    let resolved = false;

    const safeResolve = (result: Blob) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };

    // Timeout de 5 segundos antes de usar fallback
    const timer = setTimeout(() => {
      safeResolve(file);
    }, 5000);

    const isVideo = file.type.startsWith('video/') || 
                    file.name.toLowerCase().endsWith('.mov') || 
                    file.name.toLowerCase().endsWith('.mp4') || 
                    file.name.toLowerCase().endsWith('.webm');

    if (isVideo) {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';

      const url = URL.createObjectURL(file);
      video.src = url;

      const cleanup = () => {
        clearTimeout(timer);
        URL.revokeObjectURL(url);
      };

      const capture = () => {
        try {
          const maxDim = 800;
          let width = video.videoWidth || 640;
          let height = video.videoHeight || 480;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            cleanup();
            return safeResolve(file);
          }

          ctx.drawImage(video, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              cleanup();
              if (blob && blob.size > 0) {
                safeResolve(blob);
              } else {
                safeResolve(file);
              }
            },
            'image/webp',
            0.8
          );
        } catch (e) {
          cleanup();
          safeResolve(file);
        }
      };

      video.onloadeddata = () => {
        capture();
      };

      video.oncanplay = () => {
        capture();
      };

      video.onerror = () => {
        cleanup();
        safeResolve(file);
      };

      video.load();
    } else {
      // Para imágenes (JPG, PNG, GIF, WebP)
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.src = url;

      const cleanup = () => {
        clearTimeout(timer);
        URL.revokeObjectURL(url);
      };

      img.onload = () => {
        try {
          const maxDim = 1000;
          let width = img.naturalWidth || 800;
          let height = img.naturalHeight || 600;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            cleanup();
            return safeResolve(file);
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              cleanup();
              if (blob && blob.size > 0) {
                safeResolve(blob);
              } else {
                safeResolve(file);
              }
            },
            'image/webp',
            0.85
          );
        } catch (e) {
          cleanup();
          safeResolve(file);
        }
      };

      img.onerror = () => {
        cleanup();
        safeResolve(file);
      };
    }
  });
}
