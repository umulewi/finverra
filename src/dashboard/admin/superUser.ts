import type { AuthSession } from '../authStorage'

const SUPER_USER_EMAIL = 'admin@finverra.co'

export function isSuperUserSession(session: AuthSession | null) {
  if (!session || session.roleSlug !== 'admin') {
    return false
  }

  return session.email.trim().toLowerCase() === SUPER_USER_EMAIL
}
