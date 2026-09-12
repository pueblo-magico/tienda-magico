import { ValidationError } from 'payload'
import type { CollectionBeforeValidateHook } from 'payload'

export const validateProductMedia: CollectionBeforeValidateHook = ({ data, req }) => {
  if (!data || !Array.isArray(data.gallery)) return data
  const primary = data.gallery.filter((row: Record<string, unknown>) => row.isPrimary === true)
  if (primary.length > 1) {
    throw new ValidationError({
      errors: [
        {
          path: 'gallery',
          message:
            req.locale === 'en'
              ? 'Choose only one primary media item.'
              : 'Elegí un solo medio principal.',
        },
      ],
    })
  }
  data.gallery.forEach((row: Record<string, unknown>, index: number) => {
    const external = typeof row.externalVideoUrl === 'string' ? row.externalVideoUrl.trim() : ''
    const caption = typeof row.caption === 'string' ? row.caption.trim() : ''
    const isEmptyRow = !external && !row.image && !caption && row.isPrimary !== true

    // Payload inserts an empty array row before opening the upload selector. It must
    // remain valid long enough for editors to create or choose the related media.
    if (isEmptyRow) return

    if (!external && !row.image) {
      throw new ValidationError({
        errors: [
          {
            path: `gallery.${index}.image`,
            message:
              req.locale === 'en'
                ? 'Each gallery row needs an image or a YouTube URL.'
                : 'Cada fila de la galería necesita una imagen o una URL de YouTube.',
          },
        ],
      })
    }
    if (!external) return
    try {
      const url = new URL(external)
      const host = url.hostname.toLowerCase().replace(/^www\./, '')
      const validHost = host === 'youtube.com' || host === 'youtu.be'
      const hasId =
        host === 'youtu.be'
          ? url.pathname.length > 1
          : url.searchParams.has('v') || /^\/shorts\/[^/]+$/.test(url.pathname)
      if (url.protocol !== 'https:' || !validHost || !hasId) throw new Error('invalid')
    } catch {
      throw new ValidationError({
        errors: [
          {
            path: `gallery.${index}.externalVideoUrl`,
            message:
              req.locale === 'en'
                ? 'Use a secure YouTube watch, youtu.be, or Shorts URL.'
                : 'Usá una URL segura de YouTube, youtu.be o Shorts.',
          },
        ],
      })
    }
  })
  return data
}
