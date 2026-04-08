/**
 * Detecta el tipo de media a partir de una URL y devuelve los datos
 * necesarios para renderizarla correctamente.
 */

export type MediaType = 'youtube' | 'drive' | 'instagram' | 'image' | 'unknown';

export interface MediaInfo {
  type: MediaType;
  embedUrl: string;     // URL para usar en <iframe src="...">
  thumbnailUrl: string; // URL de miniatura para preview
  isVideo: boolean;
}

/**
 * Extrae el video ID de YouTube desde distintos formatos de URL.
 * Soporta: watch?v=, /shorts/, youtu.be/
 */
function getYoutubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Extrae el FILE_ID de Google Drive desde distintos formatos de URL.
 */
function getDriveId(url: string): string | null {
  const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Extrae el shortcode de un post de Instagram.
 */
function getInstagramCode(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Analiza una URL de media y devuelve la información de embedding.
 */
export function parseMediaUrl(url: string): MediaInfo {
  if (!url) {
    return { type: 'unknown', embedUrl: '', thumbnailUrl: '', isVideo: false };
  }

  // YouTube (videos normales, Shorts, youtu.be)
  const ytId = getYoutubeId(url);
  if (ytId) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      isVideo: true,
    };
  }

  // Google Drive
  const driveId = getDriveId(url);
  if (driveId) {
    return {
      type: 'drive',
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${driveId}&sz=w400`,
      isVideo: true,
    };
  }

  // Instagram
  const igCode = getInstagramCode(url);
  if (igCode) {
    return {
      type: 'instagram',
      embedUrl: `https://www.instagram.com/p/${igCode}/embed/`,
      thumbnailUrl: '',
      isVideo: true,
    };
  }

  // Imagen convencional (URL directa a imagen)
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;
  if (imageExtensions.test(url)) {
    return {
      type: 'image',
      embedUrl: url,
      thumbnailUrl: url,
      isVideo: false,
    };
  }

  // Fallback: tratamos de mostrar como imagen pero sabemos que puede fallar
  return {
    type: 'unknown',
    embedUrl: url,
    thumbnailUrl: url,
    isVideo: false,
  };
}
