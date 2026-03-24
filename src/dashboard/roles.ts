export type RoleSlug = 'admin' | 'entrepreneur' | 'investor'

export type ApiRole = {
  id: number
  name: string
}

export type RoleDefinition = {
  slug: RoleSlug
  name: string
  shortDescription: string
  loginDescription: string
  dashboardHeading: string
  dashboardDescription: string
  highlights: string[]
}

export type RoleOption = ApiRole & RoleDefinition

const ROLE_DEFINITIONS: Record<RoleSlug, RoleDefinition> = {
  admin: {
    slug: 'admin',
    name: 'Admin',
    shortDescription: 'Manage platform access, oversee activity, and support every side of the ecosystem.',
    loginDescription: 'Sign in to manage users, monitor activity, and keep the platform running securely.',
    dashboardHeading: 'Admin Dashboard',
    dashboardDescription: 'Review platform activity, supervise role onboarding, and coordinate operational controls.',
    highlights: ['Role governance', 'Platform monitoring', 'Operations control'],
  },
  entrepreneur: {
    slug: 'entrepreneur',
    name: 'Entrepreneur',
    shortDescription: 'Build your profile, publish opportunities, and connect with investment partners.',
    loginDescription: 'Sign in to manage your business profile, submissions, and funding journey.',
    dashboardHeading: 'Entrepreneur Dashboard',
    dashboardDescription: 'Track your company profile, investment materials, and conversations with investors.',
    highlights: ['Business profile', 'Opportunity pipeline', 'Funding readiness'],
  },
  investor: {
    slug: 'investor',
    name: 'Investor',
    shortDescription: 'Review curated ventures, manage your pipeline, and follow portfolio activity.',
    loginDescription: 'Sign in to evaluate opportunities and manage your investment workflow.',
    dashboardHeading: 'Investor Dashboard',
    dashboardDescription: 'Review pipeline activity, follow shortlisted ventures, and monitor portfolio movement.',
    highlights: ['Opportunity review', 'Deal tracking', 'Portfolio visibility'],
  },
}

export function normalizeRoleSlug(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_')

  if (normalized === 'admin') {
    return 'admin'
  }

  if (normalized === 'entrepreneur') {
    return 'entrepreneur'
  }

  if (normalized === 'enterpreneur') {
    return 'entrepreneur'
  }

  if (normalized === 'investor') {
    return 'investor'
  }

  return undefined
}

export function mapApiRoleToOption(role: ApiRole) {
  const slug = normalizeRoleSlug(role.name)

  if (!slug) {
    return undefined
  }

  return {
    ...role,
    ...ROLE_DEFINITIONS[slug],
  } satisfies RoleOption
}

export function getRoleDefinition(slug: RoleSlug) {
  return ROLE_DEFINITIONS[slug]
}

const DEFAULT_ROLE_IDS: Record<RoleSlug, number> = {
  admin: 1,
  entrepreneur: 2,
  investor: 3,
}

export function getDefaultRoleOptions(): RoleOption[] {
  return (Object.keys(ROLE_DEFINITIONS) as RoleSlug[]).map((slug) => ({
    id: DEFAULT_ROLE_IDS[slug],
    ...ROLE_DEFINITIONS[slug],
  }))
}