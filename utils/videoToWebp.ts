/**
 * Conversor cliente-side de archivos (Imágenes, GIFs, Videos MP4/MOV) a WebP optimizado.
 * Reduce el tamaño de los archivos hasta un 90% antes de subirlos a Firebase Storage.
 */

export async function convertFileToWebp(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mov') || file.name.endsWith('.mp4');

    if (isVideo) {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';

      const url = URL.createObjectURL(file);
      video.src = url;

      video.onloadedmetadata = () => {
        // Buscar un fotograma representativo al 20% de la duración o al segundo 1
        const seekTime = Math.min(1, video.duration * 0.2);
        video.currentTime = seekTime;
      };

      video.onseeked = () => {
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
            URL.revokeObjectURL(url);
            return resolve(file); // Fallback al archivo original
          }

          ctx.drawImage(video, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              if (blob && blob.size > 0) {
                resolve(blob);
              } else {
                resolve(file); // Fallback
              }
            },
            'image/webp',
            0.85
          );
        } catch (e) {
          URL.revokeObjectURL(url);
          resolve(file); // Fallback
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file); // Fallback al archivo original si falla la decodificación
      };
    } else {
      // Para imágenes (JPG, PNG, GIF, WebP)
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.src = url;

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
            URL.revokeObjectURL(url);
            return resolve(file);
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              if (blob && blob.size > 0) {
                resolve(blob);
              } else {
                resolve(file);
              }
            },
            'image/webp',
            0.85
          );
        } catch (e) {
          URL.revokeObjectURL(url);
          resolve(file);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
    }
  });
}
