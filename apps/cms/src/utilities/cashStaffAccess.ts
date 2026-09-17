import {
  APIError,
  type CollectionBeforeChangeHook,
  type CollectionBeforeLoginHook,
  type GlobalBeforeChangeHook,
  type PayloadRequest,
} from 'payload'

export const CASH_STAFF_EMAIL = 'cash-staff@storefront.invalid'
export const CASH_STAFF_SESSION_SECONDS = 15 * 60
export const cashStaffAuthority = Symbol('cash-staff')

export function isCashStaff(user: { email?: string | null } | null | undefined) {
  return user?.email?.toLowerCase() === CASH_STAFF_EMAIL
}

export const protectCashStaffAccount: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  if (
    (isCashStaff(data) || isCashStaff(originalDoc)) &&
    req.context.cashStaffAuthority !== cashStaffAuthority
  )
    throw new APIError('Administrá el acceso de caja desde Configuración del sitio.', 403)
  return data
}

export const cashStaffBeforeLogin: CollectionBeforeLoginHook = async ({ user, req }) => {
  if (isCashStaff(user)) {
    const settings = await req.payload.findGlobal({
      slug: 'site-settings',
      overrideAccess: true,
      depth: 0,
      req,
    })
    if (req.context.cashStaffAuthority !== cashStaffAuthority || !settings.cashStaffEnabled)
      throw new APIError('No se pudo iniciar sesión.', 401)
  }
  return user
}

export const configureCashStaff: GlobalBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const password = data.cashStaffPassword
  delete data.cashStaffPassword
  const hasPassword = typeof password === 'string' && password.length > 0
  const enabled = data.cashStaffEnabled ?? originalDoc?.cashStaffEnabled ?? false
  if (!hasPassword && enabled === Boolean(originalDoc?.cashStaffEnabled)) return data
  if (!req.user?.roles?.includes('admin')) throw new APIError('Acceso denegado.', 403)
  if (hasPassword && (password.length < 12 || password.length > 128))
    throw new APIError('Usá una contraseña de entre 12 y 128 caracteres.', 400)
  const existing = (
    await req.payload.find({
      collection: 'users',
      where: { email: { equals: CASH_STAFF_EMAIL } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
  ).docs[0]
  if (!existing && !hasPassword) {
    if (enabled) throw new APIError('Configurá una contraseña antes de habilitar caja.', 400)
    return data
  }
  const previousContext = { ...req.context }
  try {
    const account = {
      email: CASH_STAFF_EMAIL,
      name: 'Caja del storefront (acceso compartido)',
      editorLanguage: 'es' as const,
      roles: ['customer' as const],
      enableAPIKey: false,
      sessions: [],
      loginAttempts: 0,
      lockUntil: null,
      ...(hasPassword ? { password } : {}),
    }
    const context = { cashStaffAuthority }
    if (existing)
      await req.payload.update({
        collection: 'users',
        id: existing.id,
        data: account,
        req,
        context,
        overrideAccess: true,
      })
    else if (typeof password === 'string')
      await req.payload.create({
        collection: 'users',
        data: { ...account, password },
        req,
        context,
        overrideAccess: true,
      })
  } finally {
    req.context = previousContext
  }
  return data
}

export async function authorizeCashStaff(req: PayloadRequest): Promise<boolean> {
  if (
    !req.user ||
    !isCashStaff(req.user) ||
    !('_sid' in req.user) ||
    typeof req.user._sid !== 'string'
  )
    return false
  const sessionID = req.user._sid
  const user = await req.payload.findByID({
    collection: 'users',
    id: req.user.id,
    depth: 0,
    overrideAccess: true,
    req,
  })
  if (!isCashStaff(user) || user.roles.length !== 1 || user.roles[0] !== 'customer') return false
  const session = user.sessions?.find((entry) => entry.id === sessionID)
  const started = Date.parse(session?.createdAt ?? '')
  const expires = Date.parse(session?.expiresAt ?? '')
  if (
    !Number.isFinite(started) ||
    started > Date.now() ||
    Date.now() - started >= CASH_STAFF_SESSION_SECONDS * 1000 ||
    !(expires > Date.now())
  )
    return false
  const settings = await req.payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
    overrideAccess: true,
    req,
  })
  return settings.cashStaffEnabled === true
}
