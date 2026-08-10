export type Role = 'admin' | 'customer'

export type RoleBearingUser = {
  id?: number | string
  roles?: Role[] | null
} | null | undefined

export const checkRole = (allRoles: Role[] = [], user?: RoleBearingUser): boolean => {
  if (!user?.roles?.length) return false
  return allRoles.some((role) => user.roles?.includes(role))
}
