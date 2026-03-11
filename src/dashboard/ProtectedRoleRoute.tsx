import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getAuthSession } from './authStorage'
import type { RoleSlug } from './roles'

type ProtectedRoleRouteProps = {
  role: RoleSlug
  children: ReactNode
}

export default function ProtectedRoleRoute({ role, children }: ProtectedRoleRouteProps) {
  const session = getAuthSession()

  if (!session || session.roleSlug !== role) {
    return <Navigate to={`/dashboard/${role}/login`} replace />
  }

  return <>{children}</>
}