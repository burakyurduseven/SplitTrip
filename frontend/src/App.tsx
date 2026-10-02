import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { Dashboard } from './Dashboard'
import { TripsPage } from './TripsPage'
import { TripDetailPage } from './TripDetailPage'
import { InvitationPage } from './InvitationPage'
import type { AppPage } from './AppNavigation'
import type { AccessTokenResponse, ActivityIdea, ActivityVoteValue, ApiProblem, BalanceSummary, CreateActivityIdeaInput, CreateTripInput, CurrentUser, Expense, ExpenseInput, InvitationPreview, ItineraryItem, ScheduleActivityInput, Trip, TripMember, UpdateScheduleInput } from './types'

type AuthMode = 'login' | 'register'

const readProblem = async (response: Response): Promise<ApiProblem> => {
  try {
    return await response.json() as ApiProblem
  } catch {
    return {}
  }
}

const ArrowIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h13m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
)

const EyeIcon = ({ hidden }: { hidden: boolean }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path d="M2.8 12s3.3-5.2 9.2-5.2S21.2 12 21.2 12s-3.3 5.2-9.2 5.2S2.8 12 2.8 12Z" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.7" />
    {hidden && <path d="m4.2 4.2 15.6 15.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />}
  </svg>
)

function App() {
  const [mode, setMode] = useState<AuthMode>('register')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [accessToken, setAccessToken] = useState('')
  const [trips, setTrips] = useState<Trip[]>([])
  const [bootstrapping, setBootstrapping] = useState(true)
  const [page, setPage] = useState<AppPage | 'trip'>('home')
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [members, setMembers] = useState<TripMember[]>([])
  const [ideas, setIdeas] = useState<ActivityIdea[]>([])
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [balances, setBalances] = useState<BalanceSummary | null>(null)
  const [invitation, setInvitation] = useState<InvitationPreview | null>(null)
  const [invitationToken, setInvitationToken] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const refreshPromise = useRef<Promise<string> | null>(null)

  const endSession = () => {
    setAccessToken('')
    setTrips([])
    setMembers([])
    setIdeas([])
    setItinerary([])
    setExpenses([])
    setBalances(null)
    setUser(null)
    setMode('login')
  }

  const authenticatedFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const send = (token: string) => {
      const headers = new Headers(init.headers)
      headers.set('Authorization', `Bearer ${token}`)
      return fetch(input, { ...init, headers })
    }

    let response = await send(accessToken)
    if (response.status !== 401) return response

    try {
      if (!refreshPromise.current) {
        refreshPromise.current = (async () => {
          const refreshResponse = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' })
          if (!refreshResponse.ok) throw new Error('refresh failed')
          const tokens = await refreshResponse.json() as AccessTokenResponse
          setAccessToken(tokens.accessToken)
          return tokens.accessToken
        })().finally(() => { refreshPromise.current = null })
      }
      const refreshedToken = await refreshPromise.current
      response = await send(refreshedToken)
      return response
    } catch {
      endSession()
      throw new Error('Your session has expired. Please log in again.')
    }
  }

  const loadAccount = async (token: string) => {
    const authorization = { Authorization: `Bearer ${token}` }
    const [profileResponse, tripsResponse] = await Promise.all([
      fetch('/api/v1/users/me', { headers: authorization }),
      fetch('/api/v1/trips', { headers: authorization }),
    ])
    if (!profileResponse.ok) throw await readProblem(profileResponse)
    if (!tripsResponse.ok) throw await readProblem(tripsResponse)
    const loadedTrips = await tripsResponse.json() as Trip[]
    setAccessToken(token)
    setUser(await profileResponse.json() as CurrentUser)
    setTrips(loadedTrips)

    const tripRoute = window.location.pathname.match(/^\/trips\/([0-9a-f-]+)$/i)
    if (tripRoute) {
      const [detailResponse, membersResponse, ideasResponse, itineraryResponse, expensesResponse, balancesResponse] = await Promise.all([
        fetch(`/api/v1/trips/${tripRoute[1]}`, { headers: authorization }),
        fetch(`/api/v1/trips/${tripRoute[1]}/members`, { headers: authorization }),
        fetch(`/api/v1/trips/${tripRoute[1]}/activity-ideas`, { headers: authorization }),
        fetch(`/api/v1/trips/${tripRoute[1]}/itinerary`, { headers: authorization }),
        fetch(`/api/v1/trips/${tripRoute[1]}/expenses`, { headers: authorization }),
        fetch(`/api/v1/trips/${tripRoute[1]}/balances`, { headers: authorization }),
      ])
      if (detailResponse.ok) {
        setSelectedTrip(await detailResponse.json() as Trip)
        if (membersResponse.ok) setMembers(await membersResponse.json() as TripMember[])
        if (ideasResponse.ok) setIdeas(await ideasResponse.json() as ActivityIdea[])
        if (itineraryResponse.ok) setItinerary(await itineraryResponse.json() as ItineraryItem[])
        if (expensesResponse.ok) setExpenses(await expensesResponse.json() as Expense[])
        if (balancesResponse.ok) setBalances(await balancesResponse.json() as BalanceSummary)
        setPage('trip')
      } else {
        window.history.replaceState({}, '', '/trips')
        setPage('trips')
      }
    } else if (window.location.pathname === '/trips') {
      setPage('trips')
    }
  }

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const invitationRoute = window.location.pathname.match(/^\/invitations\/([^/]+)$/)
        if (invitationRoute) {
          const token = invitationRoute[1]
          const previewResponse = await fetch(`/api/v1/invitations/${token}`)
          if (previewResponse.ok) {
            setInvitation(await previewResponse.json() as InvitationPreview)
            setInvitationToken(token)
            setMode('login')
          }
        }
        const response = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' })
        if (!response.ok) return
        const tokens = await response.json() as AccessTokenResponse
        await loadAccount(tokens.accessToken)
      } catch {
        // A missing local API or expired session should simply reveal the sign-in screen.
      } finally {
        setBootstrapping(false)
      }
    }
    void restoreSession()
  }, [])

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError('')
  }

  const signIn = async () => {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
    })
    if (!response.ok) throw await readProblem(response)
    const tokens = await response.json() as AccessTokenResponse
    await loadAccount(tokens.accessToken)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      if (mode === 'register') {
        const response = await fetch('/api/v1/auth/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName, email, password }),
        })
        if (!response.ok) throw await readProblem(response)
      }
      await signIn()
    } catch (problem) {
      const apiProblem = problem as ApiProblem
      const fieldError = apiProblem.errors && Object.values(apiProblem.errors)[0]
      setError(fieldError ?? apiProblem.detail ?? 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const createTrip = async (input: CreateTripInput) => {
    const response = await authenticatedFetch('/api/v1/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!response.ok) {
      const problem = await readProblem(response)
      const fieldError = problem.errors && Object.values(problem.errors)[0]
      const fallback = response.status === 401
        ? 'Your session has expired. Please log in again.'
        : 'We could not create your trip.'
      throw new Error(fieldError ?? problem.detail ?? fallback)
    }
    const trip = await response.json() as Trip
    setTrips(current => [trip, ...current])
  }

  const navigate = (nextPage: AppPage) => {
    window.history.pushState({}, '', nextPage === 'home' ? '/' : '/trips')
    setPage(nextPage)
  }

  const openTrip = async (trip: Trip) => {
    setSelectedTrip(trip)
    setPage('trip')
    window.history.pushState({}, '', `/trips/${trip.id}`)
    try {
      const [tripResponse, membersResponse, ideasResponse, itineraryResponse, expensesResponse, balancesResponse] = await Promise.all([
        authenticatedFetch(`/api/v1/trips/${trip.id}`),
        authenticatedFetch(`/api/v1/trips/${trip.id}/members`),
        authenticatedFetch(`/api/v1/trips/${trip.id}/activity-ideas`),
        authenticatedFetch(`/api/v1/trips/${trip.id}/itinerary`),
        authenticatedFetch(`/api/v1/trips/${trip.id}/expenses`),
        authenticatedFetch(`/api/v1/trips/${trip.id}/balances`),
      ])
      if (tripResponse.ok) setSelectedTrip(await tripResponse.json() as Trip)
      if (membersResponse.ok) setMembers(await membersResponse.json() as TripMember[])
      if (ideasResponse.ok) setIdeas(await ideasResponse.json() as ActivityIdea[])
      if (itineraryResponse.ok) setItinerary(await itineraryResponse.json() as ItineraryItem[])
      if (expensesResponse.ok) setExpenses(await expensesResponse.json() as Expense[])
      if (balancesResponse.ok) setBalances(await balancesResponse.json() as BalanceSummary)
    } catch {
      // Keep the list representation visible if the detail refresh is temporarily unavailable.
    }
  }

  const createInvitation = async () => {
    if (!selectedTrip) throw new Error('No trip is selected.')
    const response = await authenticatedFetch(`/api/v1/trips/${selectedTrip.id}/invitations`, { method: 'POST' })
    if (!response.ok) {
      const problem = await readProblem(response)
      throw new Error(problem.detail ?? 'We could not create an invitation.')
    }
    const created = await response.json() as { token: string; expiresAt: string }
    return { url: `${window.location.origin}/invitations/${created.token}`, expiresAt: created.expiresAt }
  }

  const createActivityIdea = async (input: CreateActivityIdeaInput) => {
    if (!selectedTrip) throw new Error('No trip is selected.')
    const response = await authenticatedFetch(`/api/v1/trips/${selectedTrip.id}/activity-ideas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
    if (!response.ok) { const problem = await readProblem(response); throw new Error(problem.detail ?? 'We could not save this idea.') }
    const idea = await response.json() as ActivityIdea
    setIdeas(current => [idea, ...current])
  }

  const voteOnIdea = async (ideaId: string, vote: ActivityVoteValue | null) => {
    if (!selectedTrip) return
    const response = await authenticatedFetch(`/api/v1/trips/${selectedTrip.id}/activity-ideas/${ideaId}/vote`, vote
      ? { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: vote }) }
      : { method: 'DELETE' })
    if (!response.ok) return
    if (vote) {
      const updated = await response.json() as ActivityIdea
      setIdeas(current => current.map(idea => idea.id === updated.id ? updated : idea))
    } else {
      setIdeas(current => current.map(idea => idea.id === ideaId ? { ...idea, likes: idea.likes - (idea.currentUserVote === 'LIKE' ? 1 : 0), dislikes: idea.dislikes - (idea.currentUserVote === 'DISLIKE' ? 1 : 0), currentUserVote: null } : idea))
    }
  }

  const scheduleActivity = async (input: ScheduleActivityInput) => {
    if (!selectedTrip) throw new Error('No trip is selected.')
    const response = await authenticatedFetch(`/api/v1/trips/${selectedTrip.id}/itinerary`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
    if (!response.ok) { const problem = await readProblem(response); throw new Error(problem.detail ?? 'We could not schedule this activity.') }
    const item = await response.json() as ItineraryItem
    setItinerary(current => [...current, item].sort((left, right) => `${left.scheduledDate}${left.startTime}`.localeCompare(`${right.scheduledDate}${right.startTime}`)))
    setIdeas(current => current.map(idea => idea.id === input.activityIdeaId ? { ...idea, status: 'SCHEDULED' } : idea))
    return item
  }

  const updateScheduledActivity = async (itemId: string, input: UpdateScheduleInput) => {
    if (!selectedTrip) throw new Error('No trip is selected.')
    const response = await authenticatedFetch(`/api/v1/trips/${selectedTrip.id}/itinerary/${itemId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
    if (!response.ok) { const problem = await readProblem(response); throw new Error(problem.detail ?? 'We could not update this activity.') }
    const updated = await response.json() as ItineraryItem
    setItinerary(current => current.map(item => item.id === updated.id ? updated : item).sort((left, right) => `${left.scheduledDate}${left.startTime}`.localeCompare(`${right.scheduledDate}${right.startTime}`)))
    return updated
  }

  const removeScheduledActivity = async (itemId: string, ideaId: string) => {
    if (!selectedTrip) return
    const response = await authenticatedFetch(`/api/v1/trips/${selectedTrip.id}/itinerary/${itemId}`, { method: 'DELETE' })
    if (!response.ok) { const problem = await readProblem(response); throw new Error(problem.detail ?? 'We could not remove this activity.') }
    setItinerary(current => current.filter(item => item.id !== itemId))
    setIdeas(current => current.map(idea => idea.id === ideaId ? { ...idea, status: 'PROPOSED' } : idea))
  }

  const saveExpense = async (input: ExpenseInput, expenseId?: string) => {
    if (!selectedTrip) throw new Error('No trip is selected.')
    const response = await authenticatedFetch(`/api/v1/trips/${selectedTrip.id}/expenses${expenseId ? `/${expenseId}` : ''}`, { method: expenseId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
    if (!response.ok) { const problem = await readProblem(response); const fieldError = problem.errors && Object.values(problem.errors)[0]; throw new Error(fieldError ?? problem.detail ?? 'We could not save this expense.') }
    const saved = await response.json() as Expense
    setExpenses(current => expenseId ? current.map(expense => expense.id === saved.id ? saved : expense) : [saved, ...current])
    const balancesResponse = await authenticatedFetch(`/api/v1/trips/${selectedTrip.id}/balances`)
    if (balancesResponse.ok) setBalances(await balancesResponse.json() as BalanceSummary)
  }

  const deleteExpense = async (expenseId: string) => {
    if (!selectedTrip) return
    const response = await authenticatedFetch(`/api/v1/trips/${selectedTrip.id}/expenses/${expenseId}`, { method: 'DELETE' })
    if (!response.ok) { const problem = await readProblem(response); throw new Error(problem.detail ?? 'We could not delete this expense.') }
    setExpenses(current => current.filter(expense => expense.id !== expenseId))
    const balancesResponse = await authenticatedFetch(`/api/v1/trips/${selectedTrip.id}/balances`)
    if (balancesResponse.ok) setBalances(await balancesResponse.json() as BalanceSummary)
  }

  const removeMember = async (userId: string) => {
    if (!selectedTrip) return
    const response = await authenticatedFetch(`/api/v1/trips/${selectedTrip.id}/members/${userId}`, { method: 'DELETE' })
    if (response.ok) setMembers(current => current.filter(member => member.userId !== userId))
  }

  const leaveTrip = async () => {
    if (!selectedTrip) return
    const response = await authenticatedFetch(`/api/v1/trips/${selectedTrip.id}/members/me`, { method: 'DELETE' })
    if (response.ok) {
      setTrips(current => current.filter(trip => trip.id !== selectedTrip.id))
      setMembers([])
      setSelectedTrip(null)
      navigate('trips')
    }
  }

  const acceptInvitation = async () => {
    if (!invitation || !invitationToken) return
    setJoining(true)
    setJoinError('')
    try {
      const response = await authenticatedFetch(`/api/v1/invitations/${invitationToken}/accept`, { method: 'POST' })
      if (!response.ok) {
        const problem = await readProblem(response)
        throw new Error(problem.detail ?? 'We could not join this trip.')
      }
      const [tripResponse, membersResponse] = await Promise.all([
        authenticatedFetch(`/api/v1/trips/${invitation.tripId}`),
        authenticatedFetch(`/api/v1/trips/${invitation.tripId}/members`),
      ])
      const joinedTrip = await tripResponse.json() as Trip
      setTrips(current => current.some(trip => trip.id === joinedTrip.id) ? current : [joinedTrip, ...current])
      setSelectedTrip(joinedTrip)
      if (membersResponse.ok) setMembers(await membersResponse.json() as TripMember[])
      setInvitation(null)
      window.history.replaceState({}, '', `/trips/${joinedTrip.id}`)
      setPage('trip')
    } catch (reason) {
      setJoinError(reason instanceof Error ? reason.message : 'We could not join this trip.')
    } finally {
      setJoining(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'DELETE', credentials: 'include' })
    } finally {
      endSession()
    }
  }

  if (bootstrapping) {
    return <main className="app-loading"><div className="loading-mark">S</div><p>Mapping your journey...</p></main>
  }

  if (user) {
    if (invitation) return <InvitationPage invitation={invitation} userName={user.displayName} joining={joining} error={joinError} onAccept={acceptInvitation} onCancel={() => { setInvitation(null); navigate('trips') }} />
    const pageProps = { user, trips, onNavigate: navigate, onOpenTrip: (trip: Trip) => void openTrip(trip), onCreateTrip: createTrip, onLogout: logout }
    if (page === 'trip' && selectedTrip) return <TripDetailPage trip={selectedTrip} members={members} ideas={ideas} itinerary={itinerary} expenses={expenses} balances={balances} currentUserId={user.id} onNavigate={navigate} onCreateTrip={() => navigate('trips')} onCreateInvitation={createInvitation} onCreateIdea={createActivityIdea} onVote={voteOnIdea} onSchedule={scheduleActivity} onUpdateSchedule={updateScheduledActivity} onRemoveSchedule={removeScheduledActivity} onSaveExpense={saveExpense} onDeleteExpense={deleteExpense} onRemoveMember={removeMember} onLeaveTrip={leaveTrip} onLogout={logout} />
    return page === 'trips' ? <TripsPage {...pageProps} /> : <Dashboard {...pageProps} />
  }

  return (
    <main className="auth-shell">
      <section className="story-panel" aria-label="About SplitTrip">
        <div className="story-noise" aria-hidden="true" />
        <header className="brand-lockup"><span className="brand-symbol" aria-hidden="true">S</span><span>SplitTrip</span></header>
        <div className="story-copy">
          <p className="eyebrow">GO TOGETHER, SPLIT WITH EASE</p>
          <h1>Share the plans.<br />Keep the <em>memories.</em></h1>
          <p className="story-description">Shape the route together and share expenses as you go. Less time asking who paid, more time enjoying the journey.</p>
        </div>
        <div className="route-art" aria-hidden="true">
          <svg viewBox="0 0 700 310" fill="none"><path className="route-line route-line-shadow" d="M-20 230C108 143 173 286 297 197c94-68 103-179 223-125 70 32 96 123 205 47" /><path className="route-line" d="M-20 230C108 143 173 286 297 197c94-68 103-179 223-125 70 32 96 123 205 47" /></svg>
          <span className="route-dot dot-one" /><span className="route-dot dot-two" />
          <span className="route-pin pin-one"><i>İzmir</i></span><span className="route-pin pin-two"><i>Kaş</i></span>
          <span className="floating-stamp">BON<br />VOYAGE</span>
        </div>
        <div className="trip-snippet"><div className="avatar-stack" aria-hidden="true"><span>BY</span><span>EA</span><span>+</span></div><p><strong>₺12,480</strong><span>split fairly</span></p></div>
      </section>

      <section className="form-panel">
        <div className="mobile-brand"><span className="brand-symbol" aria-hidden="true">S</span><span>SplitTrip</span></div>
        <div className="form-wrap">
          <div className="mode-switch" role="tablist" aria-label="Account access">
            <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => changeMode('register')}>Sign up</button>
            <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => changeMode('login')}>Log in</button>
            <span className={`switch-pill ${mode}`} aria-hidden="true" />
          </div>
          <div className="form-heading">
            <p className="step-label">{mode === 'register' ? 'START A NEW ROUTE' : 'RETURN TO YOUR ROUTE'}</p>
            <h2>{mode === 'register' ? 'Join your travel crew.' : 'Pick up where you left off.'}</h2>
            <p>{mode === 'register' ? 'It takes less than a minute. No passport required.' : 'Your trips and shared expenses are waiting for you.'}</p>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            {mode === 'register' && <label className="field"><span>Your name</span><input aria-label="Your name" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="What should we call you?" required /></label>}
            <label className="field"><span>Email</span><input aria-label="Email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
            <label className="field"><span>Password</span><div className="password-field"><input aria-label="Password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'} minLength={8} required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}><EyeIcon hidden={showPassword} /></button></div></label>
            {error && <p className="form-error" role="alert"><span>!</span>{error}</p>}
            <button className="primary-button" type="submit" disabled={isSubmitting}><span>{isSubmitting ? 'Getting things ready...' : mode === 'register' ? 'Start your journey' : 'Continue your journey'}</span>{!isSubmitting && <ArrowIcon />}</button>
            <p className="terms">By continuing, you agree to our <a href="#terms">Terms of Use</a> and <a href="#privacy">Privacy Policy</a>.</p>
          </form>
        </div>
        <footer className="form-footer"><span>© 2026 SplitTrip</span><span className="made-with">Designed with <b>♥</b> in Türkiye</span></footer>
      </section>
    </main>
  )
}

export default App
