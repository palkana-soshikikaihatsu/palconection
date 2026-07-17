const MAX_WIDTH = 800
const MAX_HEIGHT = 800
const JPEG_QUALITY = 0.75
const MAX_FILE_SIZE_MB = 5

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return '画像ファイルを選択してください'
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `画像は${MAX_FILE_SIZE_MB}MB以下にしてください`
  }
  return null
}

/**
 * 画像をリサイズ・圧縮してBase64（dataなし）を返す
 */
export async function compressImageToBase64(file: File): Promise<{
  base64: string
  mimeType: string
  previewUrl: string
}> {
  const validationError = validateImageFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const bitmap = await createImageBitmap(file)
  const { width, height } = fitSize(bitmap.width, bitmap.height, MAX_WIDTH, MAX_HEIGHT)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('画像の処理に失敗しました')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const mimeType = 'image/jpeg'
  const dataUrl = canvas.toDataURL(mimeType, JPEG_QUALITY)
  const base64 = dataUrl.split(',')[1] || ''

  return {
    base64,
    mimeType,
    previewUrl: dataUrl,
  }
}

function fitSize(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let w = width
  let h = height
  if (w > maxWidth) {
    h = Math.round((h * maxWidth) / w)
    w = maxWidth
  }
  if (h > maxHeight) {
    w = Math.round((w * maxHeight) / h)
    h = maxHeight
  }
  return { width: w, height: h }
}
