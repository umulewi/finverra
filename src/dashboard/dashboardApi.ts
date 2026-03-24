import { buildApiUrl } from '../config/api'
import { getDefaultRoleOptions, mapApiRoleToOption, type ApiRole, type RoleOption } from './roles'

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function getErrorMessage(payload: unknown, fallbackMessage: string) {
  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  if (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }

  return fallbackMessage
}

export async function fetchAvailableRoles() {
  let response: Response

  try {
    response = await fetch(buildApiUrl('/select_role'))
  } catch {
    return getDefaultRoleOptions()
  }

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Unable to load roles from the server.'))
  }

  if (!Array.isArray(payload)) {
    throw new Error('Unexpected role response from the server.')
  }

  return payload
    .filter((item): item is ApiRole => (
      item !== null
      && typeof item === 'object'
      && 'id' in item
      && typeof item.id === 'number'
      && 'name' in item
      && typeof item.name === 'string'
    ))
    .map(mapApiRoleToOption)
    .filter((role): role is RoleOption => role !== undefined)
}

export type LoginPayload = {
  email: string
  password: string
  role: RoleOption
}

export type EntrepreneurSignupPayload = {
  email: string
  password: string
  role: RoleOption
  firstName: string
  lastName: string
  telephone: string
}

export async function loginWithRole({ email, password, role }: LoginPayload) {
  let response: Response

  try {
    response = await fetch(buildApiUrl('/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        role_id: role.id,
      }),
    })
  } catch {
    throw new Error('Unable to reach the login server at http://localhost:3000/login. Check that the backend is running and allows requests from the frontend.')
  }

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Login failed. Please verify your credentials and role.'))
  }

  return payload
}

export async function signupEntrepreneur({
  email,
  password,
  role,
  firstName,
  lastName,
  telephone,
}: EntrepreneurSignupPayload) {
  let response: Response

  try {
    response = await fetch(buildApiUrl('/enterpreneur/signup'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        role_id: role.id,
        first_name: firstName,
        last_name: lastName,
        telephone,
      }),
    })
  } catch {
    throw new Error('Unable to reach the signup server at http://localhost:3000/enterpreneur/signup. Check that the backend is running and allows requests from the frontend.')
  }

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Entrepreneur signup failed. Please verify your details and try again.'))
  }

  return payload
}