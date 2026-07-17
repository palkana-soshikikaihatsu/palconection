import { useRef, useState, useEffect, ChangeEvent } from 'react'
import { compressImageToBase64 } from '../../utils/image'
import api from '../../services/api'

interface ImagePickerProps {
  value?: string
  onChange: (imageUrl: string) => void
  disabled?: boolean
  label?: string
  round?: boolean
}

export function ImagePicker({
  value,
  onChange,
  disabled = false,
  label = '画像を選択',
  round = false,
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(value || '')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setPreview(value || '')
  }, [value])

  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click()
    }
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setError('')
    setIsUploading(true)

    try {
      const { base64, mimeType, previewUrl } = await compressImageToBase64(file)
      setPreview(previewUrl)

      const result = await api.uploadImage(base64, mimeType, file.name)
      if (result.success && result.data?.url) {
        setPreview(result.data.url)
        onChange(result.data.url)
      } else {
        setError(result.error || '画像のアップロードに失敗しました')
        setPreview(value || '')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '画像の処理に失敗しました')
      setPreview(value || '')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClear = () => {
    setPreview('')
    onChange('')
    setError('')
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      <div className="flex flex-col items-center gap-3">
        {(preview || value) && (
          <img
            src={preview || value}
            alt="プレビュー"
            className={`object-cover bg-gray-200 ${
              round ? 'w-24 h-24 rounded-full' : 'w-full max-h-48 rounded-lg'
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23e5e7eb"/><text x="50" y="55" text-anchor="middle" fill="%239ca3af" font-size="14">No Image</text></svg>'
            }}
          />
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled || isUploading}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            {isUploading ? 'アップロード中...' : label}
          </button>
          {(preview || value) && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled || isUploading}
              className="text-sm text-gray-500 hover:text-red-500 px-2"
            >
              削除
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
      <p className="text-xs text-gray-400 mt-2 text-center">
        JPEG / PNG / WebP（5MB以下）
      </p>
    </div>
  )
}
