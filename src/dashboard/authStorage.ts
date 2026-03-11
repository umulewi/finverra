import type { RoleSlug } from './roles'

export type AuthSession = {
  roleId: number
  roleName: string
  roleSlug: RoleSlug
  email: string
  loginAt: string
  payload: unknown
}

const AUTH_STORAGE_KEY = 'finverra-auth-session'

export function saveAuthSession(session: AuthSession) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function getAuthSession() {
  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as AuthSession
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}