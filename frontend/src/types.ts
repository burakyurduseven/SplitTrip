export type ApiProblem = { detail?: string; errors?: Record<string, string> }
export type AccessTokenResponse = { accessToken: string }
export type CurrentUser = { id: string; displayName: string; email: string; createdAt: string }
export type Trip = {
  id: string
  ownerId: string
  title: string
  destination: string
  description: string | null
  startDate: string
  endDate: string
  defaultCurrency: string
  status: 'ACTIVE' | 'ARCHIVED'
  currentUserRole: 'OWNER' | 'MEMBER'
  createdAt: string
}

export type CreateTripInput = {
  title: string
  destination: string
  description: string
  startDate: string
  endDate: string
  defaultCurrency: string
}
