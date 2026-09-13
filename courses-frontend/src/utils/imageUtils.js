/**
 * Optimize Cloudinary image URLs by injecting transformation parameters.
 * This avoids serving raw 5MB+ uploads to users — instead, Cloudinary
 * dynamically resizes/compresses/converts to WebP on the fly.
 *
 * @param {string} url - The original Cloudinary image URL
 * @param {object} options
 * @param {number} [options.width] - Target width in pixels
 * @param {number} [options.height] - Target height in pixels (optional)
 * @param {string} [options.crop] - Cloudinary crop mode (default: none; use "fill" for avatars)
 * @param {string} [options.quality] - Quality setting (default: "auto")
 * @param {string} [options.format] - Format setting (default: "auto" → WebP/AVIF)
 * @returns {string} Optimized URL
 */
export function getOptimizedImageUrl(url, options = {}) {
  if (!url || typeof url !== "string") return url;

  // Only transform Cloudinary URLs
  if (!url.includes("cloudinary.com")) return url;

  // Don't double-transform if already optimized
  if (url.includes("q_auto") || url.includes("f_auto")) return url;

  const {
    width,
    height,
    crop,
    quality = "auto",
    format = "auto",
  } = options;

  // Build transformation string
  const parts = [];
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (crop) parts.push(`c_${crop}`);
  parts.push(`q_${quality}`);
  parts.push(`f_${format}`);

  const transformation = parts.join(",");

  // Insert transformation after /upload/
  return url.replace("/upload/", `/upload/${transformation}/`);
}

/**
 * Pre-configured helpers for common use cases
 */

/** Card cover images — 500px wide, auto quality/format */
export function getCardImageUrl(url) {
  return getOptimizedImageUrl(url, { width: 500 });
}

/** Small avatar/profile images — 80×80px, cropped to fill */
export function getAvatarUrl(url) {
  return getOptimizedImageUrl(url, { width: 80, height: 80, crop: "fill" });
}

/** Medium profile images — 200×200px, cropped to fill */
export function getProfileImageUrl(url) {
  return getOptimizedImageUrl(url, { width: 200, height: 200, crop: "fill" });
}

/** Gallery/detail page images — 800px wide */
export function getDetailImageUrl(url) {
  return getOptimizedImageUrl(url, { width: 800 });
}
