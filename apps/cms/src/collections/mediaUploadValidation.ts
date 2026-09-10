import { ValidationError } from 'payload'
import type { CollectionBeforeValidateHook } from 'payload'

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024
export const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024

export const validateMediaUploadSize: CollectionBeforeValidateHook = ({ data, req }) => {
  const file = req.file
  if (!file) return data

  const limit = file.mimetype.startsWith('video/') ? MAX_VIDEO_UPLOAD_BYTES : MAX_IMAGE_UPLOAD_BYTES

  if (file.size <= limit) return data

  const limitInMb = limit / 1024 / 1024
  throw new ValidationError({
    errors: [
      {
        path: 'file',
        message:
          req.locale === 'en'
            ? `The file exceeds the ${limitInMb} MB limit.`
            : `El archivo supera el límite de ${limitInMb} MB.`,
      },
    ],
  })
}
