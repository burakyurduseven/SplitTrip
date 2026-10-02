import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { Dashboard } from './Dashboard'
import { TripsPage } from './TripsPage'
import { TripDetailPage } from './TripDetailPage'
import type { AppPage } from './AppNavigation'
import type { AccessTokenResponse, ApiProblem, CreateTripInput, CurrentUser, Trip } from './types'

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

  const endSession = () => {
    setAccessToken('')
    setTrips([])
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

    const refreshResponse = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' })
    if (!refreshResponse.ok) {
      endSession()
      throw new Error('Your session has expired. Please log in again.')
    }

    try {
      const tokens = await refreshResponse.json() as AccessTokenResponse
      setAccessToken(tokens.accessToken)
      response = await send(tokens.accessToken)
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
      const detailResponse = await fetch(`/api/v1/trips/${tripRoute[1]}`, { headers: authorization })
      if (detailResponse.ok) {
        setSelectedTrip(await detailResponse.json() as Trip)
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
      const response = await authenticatedFetch(`/api/v1/trips/${trip.id}`)
      if (response.ok) setSelectedTrip(await response.json() as Trip)
    } catch {
      // Keep the list representation visible if the detail refresh is temporarily unavailable.
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
    const pageProps = { user, trips, onNavigate: navigate, onOpenTrip: (trip: Trip) => void openTrip(trip), onCreateTrip: createTrip, onLogout: logout }
    if (page === 'trip' && selectedTrip) return <TripDetailPage user={user} trip={selectedTrip} onNavigate={navigate} onCreateTrip={() => navigate('trips')} onLogout={logout} />
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
