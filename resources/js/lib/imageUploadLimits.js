export const FALLBACK_MAX_IMAGE_KB = 500

export function formatFileSizeLabel(bytes) {
  if (typeof bytes !== 'number' || bytes < 0) return '0 KB'
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

/**
 * @param {File | null | undefined} file
 * @param {number} [maxKb]
 * @returns {string | null} Error message if over limit, otherwise null.
 */
export function imageTooLargeMessage(file, maxKb = FALLBACK_MAX_IMAGE_KB) {
  const cap = Math.max(1, Number(maxKb) || FALLBACK_MAX_IMAGE_KB)
  if (!file || typeof file.size !== 'number') return null
  if (file.size <= cap * 1024) return null
  return `This image is too large. Maximum size is ${cap} KB (this file is ${formatFileSizeLabel(file.size)}).`
}

export function jsonUploadErrorMessage(payload) {
  if (!payload || typeof payload !== 'object') return 'Upload failed.'
  if (typeof payload.message === 'string' && payload.message.trim()) return payload.message
  const errs = payload.errors
  if (errs && typeof errs === 'object') {
    const flat = Object.values(errs).flat()
    const first = flat.find((v) => typeof v === 'string' && v.trim())
    if (first) return first
  }
  return 'Upload failed.'
}
