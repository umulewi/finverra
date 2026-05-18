// export const DEFAULT_API_BASE_URL = 'http://localhost:3000'
export const DEFAULT_API_BASE_URL = 'https://api.finverra.co'
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL
export const API_REQUEST_BASE_URL = import.meta.env.DEV ? '/api' : API_BASE_URL

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_REQUEST_BASE_URL}${normalizedPath}`
}