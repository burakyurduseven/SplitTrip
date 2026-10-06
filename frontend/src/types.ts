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
export type UpdateTripInput = CreateTripInput

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

export type UpdateScheduleInput = Omit<ScheduleActivityInput, 'activityIdeaId'>

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

export type ExpenseSplitMethod = 'EQUAL' | 'EXACT' | 'PERCENTAGE'
export type ExpenseShare = { userId: string; displayName: string; amount: number; percentage: number | null }
export type Expense = {
  id: string
  title: string
  amount: number
  expenseDate: string
  splitMethod: ExpenseSplitMethod
  note: string | null
  paidById: string
  paidByName: string
  createdByName: string
  shares: ExpenseShare[]
  createdAt: string
}
export type ExpenseInput = {
  title: string
  amount: number
  expenseDate: string
  paidById: string
  splitMethod: ExpenseSplitMethod
  note: string
  participants: Array<{ userId: string; amount?: number; percentage?: number }>
}

export type MemberBalance = {
  userId: string
  displayName: string
  paid: number
  owed: number
  netBalance: number
}

export type TransferSuggestion = {
  fromUserId: string
  fromName: string
  toUserId: string
  toName: string
  amount: number
}

export type BalanceSummary = {
  totalSpent: number
  members: MemberBalance[]
  suggestedTransfers: TransferSuggestion[]
}

export type Settlement = {
  id: string
  fromUserId: string
  fromName: string
  toUserId: string
  toName: string
  amount: number
  settlementDate: string
  note: string | null
  status: 'ACTIVE' | 'VOIDED'
  createdByName: string
  createdAt: string
  voidedAt: string | null
}

export type SettlementInput = {
  fromUserId: string
  toUserId: string
  amount: number
  settlementDate: string
  note: string
}

export type ChecklistStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
export type ChecklistPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type ChecklistItem = {
  id: string
  title: string
  description: string | null
  assigneeId: string | null
  assigneeName: string | null
  assignedToEveryone: boolean
  status: ChecklistStatus
  priority: ChecklistPriority
  dueDate: string | null
  createdById: string
  createdByName: string
  createdAt: string
  updatedAt: string
  completedAt: string | null
}
export type ChecklistItemInput = {
  title: string
  description: string
  assigneeId: string | null
  assignedToEveryone: boolean
  priority: ChecklistPriority
  dueDate: string | null
}
export type ChecklistSummary = {
  total: number
  completed: number
  overdue: number
  assignedToCurrentUser: number
}
