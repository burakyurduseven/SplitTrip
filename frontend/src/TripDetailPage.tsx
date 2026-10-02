import { useState } from 'react'

import { AppNavigation } from './AppNavigation'
import type { AppPage } from './AppNavigation'
import type { CurrentUser, Trip } from './types'

type Props = {
  user: CurrentUser
  trip: Trip
  onNavigate: (page: AppPage) => void
  onCreateTrip: () => void
  onLogout: () => Promise<void>
}

type Section = 'overview' | 'itinerary' | 'expenses' | 'balances' | 'members'
const sections: Section[] = ['overview', 'itinerary', 'expenses', 'balances', 'members']
const formatDate = (date: string) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`))

function EmptyModule({ icon, title, copy }: { icon: string; title: string; copy: string }) {
  return <div className="detail-empty"><span>{icon}</span><h3>{title}</h3><p>{copy}</p><button type="button" disabled>Coming next</button></div>
}

export function TripDetailPage({ user, trip, onNavigate, onCreateTrip, onLogout }: Props) {
  const [section, setSection] = useState<Section>('overview')
  const days = Math.max(1, Math.round((new Date(`${trip.endDate}T00:00:00`).getTime() - new Date(`${trip.startDate}T00:00:00`).getTime()) / 86400000) + 1)

  return (
    <div className="dashboard-shell">
      <AppNavigation activePage="trips" onNavigate={onNavigate} onCreateTrip={onCreateTrip} onLogout={onLogout} />
      <main className="dashboard-main trip-detail-page">
        <button className="detail-back" type="button" onClick={() => onNavigate('trips')}>← All trips</button>
        <section className="detail-hero">
          <div className="detail-route" aria-hidden="true"><i /><i /><i /><svg viewBox="0 0 900 220"><path d="M-20 175C125 36 247 220 382 104S650 32 930 142" /></svg></div>
          <div className="detail-hero-copy"><div><span className="detail-role">{trip.currentUserRole}</span><span className="detail-status">{trip.status}</span></div><p>YOUR TRIP</p><h1>{trip.title}</h1><div className="detail-meta"><span>⌖ {trip.destination}</span><span>□ {formatDate(trip.startDate)} – {formatDate(trip.endDate)}</span><span>◷ {days} {days === 1 ? 'day' : 'days'}</span></div>{trip.description && <blockquote>{trip.description}</blockquote>}</div>
          <div className="detail-actions"><button type="button" disabled title="Trip editing will be added in a later phase">Edit trip</button><button type="button" disabled title="Invitations will be added in the membership phase">Invite people ＋</button></div>
        </section>

        <section className="detail-stats" aria-label="Trip summary">
          <div><span>PEOPLE</span><strong>—</strong><small>Member list coming next</small></div>
          <div><span>ACTIVITIES</span><strong>00</strong><small>Nothing planned yet</small></div>
          <div><span>SPENT</span><strong>{trip.defaultCurrency} 0</strong><small>No expenses yet</small></div>
          <div><span>YOUR BALANCE</span><strong>{trip.defaultCurrency} 0</strong><small>All settled up</small></div>
        </section>

        <nav className="detail-tabs" aria-label="Trip sections">
          {sections.map(value => <button key={value} type="button" aria-current={section === value ? 'page' : undefined} onClick={() => setSection(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}
        </nav>

        <section className="detail-content">
          {section === 'overview' && <div className="overview-layout">
            <article className="detail-panel detail-plan"><header><div><p>NEXT UP</p><h2>Your itinerary</h2></div><button type="button" onClick={() => setSection('itinerary')}>View itinerary →</button></header><EmptyModule icon="⌁" title="The days are yours to shape." copy="Activities will appear here once you start building the itinerary." /></article>
            <aside className="detail-side-stack"><article className="detail-panel"><p className="panel-kicker">TRIP CREW</p><h2>Travelling together</h2><div className="current-member"><span>{user.displayName.split(' ').map(word => word[0]).slice(0, 2).join('')}</span><div><strong>{user.displayName}</strong><small>{trip.currentUserRole.toLowerCase()}</small></div></div><button type="button" className="panel-link" onClick={() => setSection('members')}>See members →</button></article><article className="detail-panel money-panel"><p className="panel-kicker">SHARED MONEY</p><h2>Nothing to settle.</h2><p>Add expenses during the trip and SplitTrip will keep the group even.</p><button type="button" className="panel-link" onClick={() => setSection('expenses')}>See expenses →</button></article></aside>
          </div>}
          {section === 'itinerary' && <EmptyModule icon="⌁" title="No activities planned yet." copy="The itinerary module will organize activities by day and time." />}
          {section === 'expenses' && <EmptyModule icon="₺" title="No shared expenses yet." copy="Equal, exact-amount, and percentage splits will live here." />}
          {section === 'balances' && <EmptyModule icon="⇄" title="Everyone is settled up." copy="Balances and suggested transfers will appear after expenses are added." />}
          {section === 'members' && <div className="members-preview"><div className="current-member"><span>{user.displayName.split(' ').map(word => word[0]).slice(0, 2).join('')}</span><div><strong>{user.displayName}</strong><small>{trip.currentUserRole.toLowerCase()}</small></div></div><p>Invitations and complete member management are coming in the next phase.</p></div>}
        </section>
      </main>
    </div>
  )
}
