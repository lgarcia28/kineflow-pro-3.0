/**
 * Conversor cliente-side ultrarrápido de imágenes a WebP y passthrough instantáneo para videos.
 * Evita cualquier demora o bloqueo en el hilo del navegador.
 */

export async function convertFileToWebp(file: File): Promise<Blob> {
  const isVideo = file.type.startsWith('video/') || 
                  file.name.toLowerCase().endsWith('.mov') || 
                  file.name.toLowerCase().endsWith('.mp4') || 
                  file.name.toLowerCase().endsWith('.webm');

  // Para videos: Retornar el archivo directamente sin demora en el hilo principal
  if (isVideo) {
    return file;
  }

  // Para imágenes (JPG, PNG, GIF, WebP)
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(file);
    }, 1000);

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
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            cleanup();
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
        cleanup();
        resolve(file);
      }
    };

    img.onerror = () => {
      cleanup();
      resolve(file);
    };
  });
}
