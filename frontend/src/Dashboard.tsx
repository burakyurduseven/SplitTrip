import { useEffect, useMemo, useRef, useState } from 'react'

import { AppNavigation } from './AppNavigation'
import { CreateTripDialog } from './CreateTripDialog'
import type { AppPage, TripSection } from './AppNavigation'
import type { ChecklistSummary, CreateTripInput, CurrentUser, Trip } from './types'

type Props = {
  user: CurrentUser
  trips: Trip[]
  checklistSummaries: Record<string, ChecklistSummary>
  onLoadChecklistSummary: (tripId: string) => Promise<void>
  onNavigate: (page: AppPage) => void
  onOpenTrip: (trip: Trip, section?: TripSection) => void
  onCreateTrip: (input: CreateTripInput) => Promise<void>
  onLogout: () => Promise<void>
}

const dashboardOpenedAt = Date.now()
const dashboardToday = new Date().toLocaleDateString('en-CA')

const shortDate = (date: string) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(new Date(`${date}T00:00:00`))
const tripDates = (trip: Trip) => `${shortDate(trip.startDate)} – ${shortDate(trip.endDate)}`

export function Dashboard({ user, trips, checklistSummaries, onLoadChecklistSummary, onNavigate, onOpenTrip, onCreateTrip, onLogout }: Props) {
  const [creating, setCreating] = useState(false)
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const touchStartX = useRef<number | null>(null)
  const upcomingTrips = useMemo(() => trips
    .filter(trip => trip.status === 'ACTIVE' && trip.endDate >= dashboardToday)
    .sort((left, right) => left.startDate.localeCompare(right.startDate) || left.createdAt.localeCompare(right.createdAt)), [trips])
  const selectedIndex = Math.max(0, upcomingTrips.findIndex(trip => trip.id === selectedTripId))
  const selectedTrip = upcomingTrips[selectedIndex]
  const otherTrips = upcomingTrips.filter(trip => trip.id !== selectedTrip?.id)
  const checklistSummary = selectedTrip ? checklistSummaries[selectedTrip.id] : undefined
  const checklistProgress = checklistSummary?.total ? Math.round(checklistSummary.completed * 100 / checklistSummary.total) : 0
  const firstName = user.displayName.split(' ')[0]
  const openTripSection = (section: TripSection) => selectedTrip ? onOpenTrip(selectedTrip, section) : onNavigate('trips')
  const selectTrip = (index: number) => {
    const trip = upcomingTrips[index]
    if (trip) setSelectedTripId(trip.id)
  }
  useEffect(() => {
    if (selectedTrip && !checklistSummaries[selectedTrip.id]) void onLoadChecklistSummary(selectedTrip.id)
  }, [checklistSummaries, onLoadChecklistSummary, selectedTrip])

  return (
    <div className="dashboard-shell">
      <AppNavigation activePage="home" onNavigate={onNavigate} onCreateTrip={() => setCreating(true)} onOpenSection={openTripSection} onLogout={onLogout} />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div><p className="dash-kicker">WELCOME BACK</p><h1>Good morning, {firstName}.</h1><span>New places, familiar people. Let’s keep the good times going.</span></div>
          <div className="profile-chip" title={user.email}><span>{user.displayName.split(' ').map(word => word[0]).slice(0,2).join('')}</span><i>{user.displayName}</i></div>
        </header>

        {selectedTrip ? (
          <section className="adventure-card" onTouchStart={event => { touchStartX.current = event.touches[0].clientX }} onTouchEnd={event => { if (touchStartX.current === null) return; const distance = event.changedTouches[0].clientX - touchStartX.current; if (Math.abs(distance) > 45) selectTrip(selectedIndex + (distance < 0 ? 1 : -1)); touchStartX.current = null }}>
            <div className="adventure-route" aria-hidden="true"><i /><i /><i /><svg viewBox="0 0 700 180"><path d="M-20 155C108 39 177 184 302 98S474 25 720 99" /></svg></div>
            {upcomingTrips.length > 1 && <div className="trip-carousel-controls"><button type="button" aria-label="Previous trip" disabled={selectedIndex === 0} onClick={() => selectTrip(selectedIndex - 1)}>←</button><span>{selectedIndex + 1} / {upcomingTrips.length}</span><button type="button" aria-label="Next trip" disabled={selectedIndex === upcomingTrips.length - 1} onClick={() => selectTrip(selectedIndex + 1)}>→</button></div>}
            <div className="adventure-copy"><p>{selectedIndex === 0 ? 'YOUR NEXT ADVENTURE' : 'UPCOMING ADVENTURE'}</p><h2>{selectedTrip.title}</h2><div className="trip-meta"><span>⌖ {selectedTrip.destination}</span><span>□ {tripDates(selectedTrip)}</span><span className="role-badge">{selectedTrip.currentUserRole}</span></div></div>
            <div className="countdown-card"><strong>{Math.max(0, Math.ceil((new Date(`${selectedTrip.startDate}T00:00:00`).getTime() - dashboardOpenedAt) / 86400000))}</strong><span>days to go</span></div>
            <button type="button" className="hero-button" onClick={() => onOpenTrip(selectedTrip)}>View trip <span>→</span></button>
            {upcomingTrips.length > 1 && <div className="trip-carousel-dots" aria-label="Choose trip">{upcomingTrips.map((trip, index) => <button key={trip.id} type="button" className={index === selectedIndex ? 'active' : ''} aria-label={`Show ${trip.title}`} aria-current={index === selectedIndex ? 'true' : undefined} onClick={() => selectTrip(index)} />)}</div>}
          </section>
        ) : (
          <section className="adventure-card empty-adventure"><div className="adventure-copy"><p>YOUR NEXT ADVENTURE</p><h2>There is a whole world waiting.</h2><div className="trip-meta"><span>Create your first trip and bring your favorite people along.</span></div></div><button type="button" className="hero-button" onClick={() => setCreating(true)}>Create trip <span>＋</span></button></section>
        )}

        <section className="dashboard-grid">
          <article className="dash-card today-card"><header><h3><span>□</span> Today’s plan</h3><button type="button" onClick={() => openTripSection('itinerary')}>View all →</button></header><div className="empty-card-icon">⌁</div><strong>No plans here yet</strong><p>Your itinerary will appear here once activities are added.</p></article>
          <article className="dash-card expense-card"><header><h3><span>▤</span> Shared expenses</h3><button type="button" onClick={() => openTripSection('expenses')}>View all →</button></header><div className="empty-card-icon coral">₺</div><strong>Nothing to split yet</strong><p>Shared costs will stay organized here.</p></article>
          <article className="dash-card balance-card"><header><h3><span>▥</span> Your balance</h3><button type="button" onClick={() => openTripSection('balances')}>View all →</button></header><div className="balance-zero">₺0.00</div><strong>All settled up</strong><p>Your group balances will appear as expenses are added.</p></article>
        </section>

        {selectedTrip && <section className="dashboard-checklist">
          <div className="dashboard-checklist-mark">✓</div>
          <div className="dashboard-checklist-copy"><p>TRIP CHECKLIST · {selectedTrip.title}</p><h2>{!checklistSummary ? 'Loading checklist...' : checklistSummary.total ? `${checklistSummary.completed} of ${checklistSummary.total} completed` : 'Nothing on the list yet.'}</h2><span>{checklistSummary?.overdue ? `${checklistSummary.overdue} ${checklistSummary.overdue === 1 ? 'task needs' : 'tasks need'} attention` : checklistSummary?.total ? 'Everything is moving in the right direction.' : checklistSummary ? 'Add the first task and get everyone ready.' : 'Gathering the latest trip tasks.'}</span></div>
          <div className="dashboard-checklist-progress"><div><i><b style={{ width: `${checklistProgress}%` }} /></i><strong>{checklistProgress}%</strong></div><button type="button" onClick={() => onOpenTrip(selectedTrip, 'checklist')}>{checklistSummary?.total ? 'Open checklist' : 'Add the first task'} →</button></div>
        </section>}

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
