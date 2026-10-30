export const ARTICLE_IMAGE_BUCKET = "article-images";
export const MAX_ARTICLE_IMAGE_BYTES = 5 * 1024 * 1024;

const formats = {
  "image/jpeg": {
    extension: "jpg",
    matches: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    matches: (bytes) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value),
  },
  "image/webp": {
    extension: "webp",
    matches: (bytes) => String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP",
  },
  "image/gif": {
    extension: "gif",
    matches: (bytes) => ["GIF87a", "GIF89a"].includes(String.fromCharCode(...bytes.slice(0, 6))),
  },
};

export function validateArticleImage({ type, size, bytes }) {
  if (!Number.isInteger(size) || size <= 0) {
    return { ok: false, error: "Choose a non-empty image file." };
  }
  if (size > MAX_ARTICLE_IMAGE_BYTES) {
    return { ok: false, error: "Choose an image smaller than 5 MB." };
  }

  const format = formats[type];
  if (!format) {
    return { ok: false, error: "Use a JPEG, PNG, WebP, or GIF image." };
  }
  if (!(bytes instanceof Uint8Array) || !format.matches(bytes)) {
    return { ok: false, error: "The file contents do not match the selected image format." };
  }

  return { ok: true, extension: format.extension };
}
