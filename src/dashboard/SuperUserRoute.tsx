import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getAuthSession } from './authStorage'
import { isSuperUserSession } from './admin/superUser'

type SuperUserRouteProps = {
  children: ReactNode
}

export default function SuperUserRoute({ children }: SuperUserRouteProps) {
  const session = getAuthSession()

  if (!session || session.roleSlug !== 'admin') {
    return <Navigate to="/dashboard/admin/login" replace />
  }

  if (!isSuperUserSession(session)) {
    return <Navigate to="/dashboard/admin/statistics" replace />
  }

  return <>{children}</>
}
