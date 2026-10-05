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

type Filter = 'all' | 'upcoming' | 'past'

const today = new Date().toISOString().slice(0, 10)
const dateRange = (trip: Trip) => {
  const format = (date: string) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`))
  return `${format(trip.startDate)} – ${format(trip.endDate)}`
}

export function TripsPage({ user, trips, onNavigate, onOpenTrip, onCreateTrip, onLogout }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [creating, setCreating] = useState(false)
  const counts = useMemo(() => ({
    upcoming: trips.filter(trip => trip.status === 'ACTIVE' && trip.endDate >= today).length,
    past: trips.filter(trip => trip.status === 'ARCHIVED' || trip.endDate < today).length,
  }), [trips])
  const visibleTrips = trips.filter(trip => filter === 'all' || (filter === 'upcoming' ? trip.status === 'ACTIVE' && trip.endDate >= today : trip.status === 'ARCHIVED' || trip.endDate < today))
  const openTripSection = (section: TripSection) => {
    const target = trips.find(trip => trip.status === 'ACTIVE') ?? trips[0]
    if (target) onOpenTrip(target, section)
    else setCreating(true)
  }

  return (
    <div className="dashboard-shell">
      <AppNavigation activePage="trips" onNavigate={onNavigate} onCreateTrip={() => setCreating(true)} onOpenSection={openTripSection} onLogout={onLogout} />
      <main className="dashboard-main trips-page">
        <header className="trips-header">
          <div><p className="dash-kicker">YOUR COLLECTION</p><h1>Your trips</h1><span>Every shared plan, memory, and expense in one place.</span></div>
          <div className="trips-header-actions"><div className="profile-chip" title={user.email}><span>{user.displayName.split(' ').map(word => word[0]).slice(0, 2).join('')}</span><i>{user.displayName}</i></div><button type="button" onClick={() => setCreating(true)}>＋ Create trip</button></div>
        </header>

        <section className="trip-overview" aria-label="Trip overview">
          <div><span>ALL JOURNEYS</span><strong>{trips.length.toString().padStart(2, '0')}</strong><small>stories in your collection</small></div>
          <div><span>UPCOMING</span><strong>{counts.upcoming.toString().padStart(2, '0')}</strong><small>adventures ahead</small></div>
          <div><span>PAST</span><strong>{counts.past.toString().padStart(2, '0')}</strong><small>memories made</small></div>
          <div className="overview-note"><b>✦</b><p>Collect moments,<br /><em>not things.</em></p></div>
        </section>

        <section className="trips-content">
          <div className="trip-filter" role="tablist" aria-label="Filter trips">
            {(['all', 'upcoming', 'past'] as Filter[]).map(value => <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)}>{value[0].toUpperCase() + value.slice(1)} <span>{value === 'all' ? trips.length : counts[value]}</span></button>)}
          </div>

          {visibleTrips.length > 0 ? <div className="trips-grid">
            {visibleTrips.map((trip, index) => <article className={`journey-card journey-tone-${index % 3}`} key={trip.id}>
              <div className="journey-card-art" aria-hidden="true"><span>{String(index + 1).padStart(2, '0')}</span><i /><i /><svg viewBox="0 0 500 130"><path d="M-10 95C80 15 140 128 238 61s154-22 280 29" /></svg></div>
              <div className="journey-card-body"><div className="journey-card-top"><span>{trip.currentUserRole}</span><small>{trip.status}</small></div><h2>{trip.title}</h2><p>⌖ {trip.destination}</p><footer><div><span>TRAVEL DATES</span><strong>{dateRange(trip)}</strong></div><button type="button" aria-label={`Open ${trip.title}`} onClick={() => onOpenTrip(trip)}>→</button></footer></div>
            </article>)}
            <button type="button" className="journey-create-card" onClick={() => setCreating(true)}><span>＋</span><strong>Start a new story</strong><small>Choose a place and invite your people.</small></button>
          </div> : <div className="trips-empty"><span>⌁</span><h2>No {filter === 'all' ? '' : `${filter} `}trips yet.</h2><p>Your next shared adventure can start right here.</p><button type="button" onClick={() => setCreating(true)}>Create a trip →</button></div>}
        </section>
      </main>
      <CreateTripDialog open={creating} onClose={() => setCreating(false)} onCreate={onCreateTrip} />
    </div>
  )
}
