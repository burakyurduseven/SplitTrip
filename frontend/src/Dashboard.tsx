import { useMemo, useState } from 'react'

import { AppNavigation } from './AppNavigation'
import { CreateTripDialog } from './CreateTripDialog'
import type { AppPage, TripSection } from './AppNavigation'
import type { CreateTripInput, CurrentUser, Trip } from './types'

type Props = {
  user: CurrentUser
  trips: Trip[]
  onNavigate: (page: AppPage) => void
  onOpenTrip: (trip: Trip, section?: TripSection) => void
  onCreateTrip: (input: CreateTripInput) => Promise<void>
  onLogout: () => Promise<void>
}

const dashboardOpenedAt = Date.now()
const dashboardToday = new Date().toLocaleDateString('en-CA')

const shortDate = (date: string) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(new Date(`${date}T00:00:00`))
const tripDates = (trip: Trip) => `${shortDate(trip.startDate)} – ${shortDate(trip.endDate)}`

export function Dashboard({ user, trips, onNavigate, onOpenTrip, onCreateTrip, onLogout }: Props) {
  const [creating, setCreating] = useState(false)
  const upcomingTrips = useMemo(() => trips
    .filter(trip => trip.status === 'ACTIVE' && trip.endDate >= dashboardToday)
    .sort((left, right) => left.startDate.localeCompare(right.startDate) || left.createdAt.localeCompare(right.createdAt)), [trips])
  const nextTrip = upcomingTrips[0]
  const otherTrips = upcomingTrips.slice(1)
  const firstName = user.displayName.split(' ')[0]
  const openTripSection = (section: TripSection) => nextTrip ? onOpenTrip(nextTrip, section) : onNavigate('trips')

  return (
    <div className="dashboard-shell">
      <AppNavigation activePage="home" onNavigate={onNavigate} onCreateTrip={() => setCreating(true)} onOpenSection={openTripSection} onLogout={onLogout} />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div><p className="dash-kicker">WELCOME BACK</p><h1>Good morning, {firstName}.</h1><span>New places, familiar people. Let’s keep the good times going.</span></div>
          <div className="profile-chip" title={user.email}><span>{user.displayName.split(' ').map(word => word[0]).slice(0,2).join('')}</span><i>{user.displayName}</i></div>
        </header>

        {nextTrip ? (
          <section className="adventure-card">
            <div className="adventure-route" aria-hidden="true"><i /><i /><i /><svg viewBox="0 0 700 180"><path d="M-20 155C108 39 177 184 302 98S474 25 720 99" /></svg></div>
            <div className="adventure-copy"><p>YOUR NEXT ADVENTURE</p><h2>{nextTrip.title}</h2><div className="trip-meta"><span>⌖ {nextTrip.destination}</span><span>□ {tripDates(nextTrip)}</span><span className="role-badge">{nextTrip.currentUserRole}</span></div></div>
            <div className="countdown-card"><strong>{Math.max(0, Math.ceil((new Date(`${nextTrip.startDate}T00:00:00`).getTime() - dashboardOpenedAt) / 86400000))}</strong><span>days to go</span></div>
            <button type="button" className="hero-button" onClick={() => onOpenTrip(nextTrip)}>View trip <span>→</span></button>
          </section>
        ) : (
          <section className="adventure-card empty-adventure"><div className="adventure-copy"><p>YOUR NEXT ADVENTURE</p><h2>There is a whole world waiting.</h2><div className="trip-meta"><span>Create your first trip and bring your favorite people along.</span></div></div><button type="button" className="hero-button" onClick={() => setCreating(true)}>Create trip <span>＋</span></button></section>
        )}

        <section className="dashboard-grid">
          <article className="dash-card today-card"><header><h3><span>□</span> Today’s plan</h3><button type="button" onClick={() => openTripSection('itinerary')}>View all →</button></header><div className="empty-card-icon">⌁</div><strong>No plans here yet</strong><p>Your itinerary will appear here once activities are added.</p></article>
          <article className="dash-card expense-card"><header><h3><span>▤</span> Shared expenses</h3><button type="button" onClick={() => openTripSection('expenses')}>View all →</button></header><div className="empty-card-icon coral">₺</div><strong>Nothing to split yet</strong><p>Shared costs will stay organized here.</p></article>
          <article className="dash-card balance-card"><header><h3><span>▥</span> Your balance</h3><button type="button" onClick={() => openTripSection('balances')}>View all →</button></header><div className="balance-zero">₺0.00</div><strong>All settled up</strong><p>Your group balances will appear as expenses are added.</p></article>
        </section>

        <section className="trip-collection">
          <div className="section-heading"><div><p>YOUR COLLECTION</p><h2>More adventures</h2></div><button type="button" onClick={() => setCreating(true)}>＋ Create trip</button></div>
          <div className="trip-card-row">
            {otherTrips.map((trip, index) => <article className={`mini-trip-card tone-${index % 3}`} key={trip.id}><span>{trip.currentUserRole}</span><h3>{trip.title}</h3><p>⌖ {trip.destination}</p><footer><small>{tripDates(trip)}</small><button aria-label={`Open ${trip.title}`} type="button" onClick={() => onOpenTrip(trip)}>→</button></footer></article>)}
            {otherTrips.length === 0 && <button type="button" className="create-card" onClick={() => setCreating(true)}><span>＋</span><strong>Create another story</strong><small>New people. New places. Same great vibes.</small></button>}
          </div>
        </section>
      </main>

      <CreateTripDialog open={creating} onClose={() => setCreating(false)} onCreate={onCreateTrip} />
    </div>
  )
}
