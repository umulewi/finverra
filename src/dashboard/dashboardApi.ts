import { API_BASE_URL, buildApiUrl } from '../config/api'
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

function buildConfiguredApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
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

export type InvestorSignupPayload = {
  email: string
  password: string
  role: RoleOption
  firstName: string
  lastName: string
  telephone: string
}

export type InvestorVerifyOtpPayload = {
  email: string
  otp: string
}

export type InvestorChangePasswordPayload = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
  accessToken?: string
}

export type InvestorPasswordResetPayload = {
  email: string
  newPassword: string
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
    throw new Error(`Unable to reach the login server at ${buildConfiguredApiUrl('/login')}. Check that the backend is running and allows requests from the frontend.`)
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
    throw new Error(`Unable to reach the signup server at ${buildConfiguredApiUrl('/enterpreneur/signup')}. Check that the backend is running and allows requests from the frontend.`)
  }

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Entrepreneur signup failed. Please verify your details and try again.'))
  }

  return payload
}

export async function signupInvestor({
  email,
  password,
  role,
  firstName,
  lastName,
  telephone,
}: InvestorSignupPayload) {
  let response: Response

  try {
    response = await fetch(buildApiUrl('/investor/signup'), {
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
    throw new Error(`Unable to reach the signup server at ${buildConfiguredApiUrl('/investor/signup')}. Check that the backend is running and allows requests from the frontend.`)
  }

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Investor signup failed. Please verify your details and try again.'))
  }

  return payload
}

export async function verifyInvestorOtp({ email, otp }: InvestorVerifyOtpPayload) {
  let response: Response

  try {
    response = await fetch(buildApiUrl('/investor/verify-otp'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        otp,
      }),
    })
  } catch {
    throw new Error(`Unable to reach the verification server at ${buildConfiguredApiUrl('/investor/verify-otp')}. Check that the backend is running and allows requests from the frontend.`)
  }

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'OTP verification failed.'))
  }

  return payload
}

export async function resendInvestorOtp(email: string) {
  let response: Response

  try {
    response = await fetch(buildApiUrl('/investor/resend-otp'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
      }),
    })
  } catch {
    throw new Error(`Unable to reach the resend OTP server at ${buildConfiguredApiUrl('/investor/resend-otp')}. Check that the backend is running and allows requests from the frontend.`)
  }

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Failed to resend OTP.'))
  }

  return payload
}

export async function forgotInvestorPassword(email: string) {
  let response: Response

  try {
    response = await fetch(buildApiUrl('/investor/forgot-password'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
      }),
    })
  } catch {
    throw new Error(`Unable to reach the forgot password server at ${buildConfiguredApiUrl('/investor/forgot-password')}. Check that the backend is running and allows requests from the frontend.`)
  }

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Failed to send OTP to the provided email.'))
  }

  return payload
}

export async function verifyInvestorForgotOtp({ email, otp }: InvestorVerifyOtpPayload) {
  let response: Response

  try {
    response = await fetch(buildApiUrl('/investor/verify-forgot-otp'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        otp,
      }),
    })
  } catch {
    throw new Error(`Unable to reach the forgot OTP verification server at ${buildConfiguredApiUrl('/investor/verify-forgot-otp')}. Check that the backend is running and allows requests from the frontend.`)
  }

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Forgot-password OTP verification failed.'))
  }

  return payload
}

export async function resendInvestorForgotOtp(email: string) {
  let response: Response

  try {
    response = await fetch(buildApiUrl('/investor/resend-otp'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
      }),
    })
  } catch {
    throw new Error(`Unable to reach the forgot OTP resend server at ${buildConfiguredApiUrl('/investor/resend-otp')}. Check that the backend is running and allows requests from the frontend.`)
  }

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Failed to resend forgot-password OTP.'))
  }

  return payload
}

export async function changeInvestorPassword({
  currentPassword,
  newPassword,
  confirmPassword,
  accessToken,
}: InvestorChangePasswordPayload) {
  let response: Response

  try {
    response = await fetch(buildApiUrl('/investor/change-password'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    })
  } catch {
    throw new Error(`Unable to reach the change password server at ${buildConfiguredApiUrl('/investor/change-password')}. Check that the backend is running and allows requests from the frontend.`)
  }

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Password change failed.'))
  }

  return payload
}

export async function resetInvestorPassword({ email, newPassword }: InvestorPasswordResetPayload) {
  let response: Response
  const requestBody = JSON.stringify({
    email,
    newPassword,
  })

  try {
    response = await fetch(buildApiUrl('/investor/password-change'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    })
  } catch {
    throw new Error(`Unable to reach the password reset server at ${buildConfiguredApiUrl('/investor/password-change')}. Check that the backend is running and allows requests from the frontend.`)
  }

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Password reset failed.'))
  }

  return payload
}