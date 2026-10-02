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

export type TripMember = {
  userId: string
  displayName: string
  email: string
  role: 'OWNER' | 'MEMBER'
  joinedAt: string
}

export type CreatedInvitation = { token: string; expiresAt: string }
export type InvitationPreview = { tripId: string; tripTitle: string; destination: string; expiresAt: string }

export type ActivityVoteValue = 'LIKE' | 'DISLIKE'
export type ActivityIdea = {
  id: string
  createdById: string
  createdByName: string
  title: string
  description: string | null
  location: string | null
  estimatedDurationMinutes: number
  status: 'PROPOSED' | 'SCHEDULED' | 'ARCHIVED'
  likes: number
  dislikes: number
  currentUserVote: ActivityVoteValue | null
  createdAt: string
}

export type CreateActivityIdeaInput = {
  title: string
  description: string
  location: string
  estimatedDurationMinutes: number
}

export type ScheduleActivityInput = {
  activityIdeaId: string
  scheduledDate: string
  startTime: string
  endTime: string
  note: string
}

export type ItineraryItem = {
  id: string
  activityIdeaId: string
  title: string
  location: string | null
  scheduledDate: string
  startTime: string
  endTime: string
  note: string | null
  scheduledByName: string
  overlapsExistingItem: boolean
}
