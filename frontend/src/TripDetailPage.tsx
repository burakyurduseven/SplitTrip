import { useState } from 'react'

import { AppNavigation } from './AppNavigation'
import { ItineraryWorkspace } from './ItineraryWorkspace'
import { ExpenseWorkspace } from './ExpenseWorkspace'
import { BalanceWorkspace } from './BalanceWorkspace'
import { EditTripDialog } from './EditTripDialog'
import type { AppPage, TripSection } from './AppNavigation'
import type { ActivityIdea, ActivityVoteValue, BalanceSummary, CreateActivityIdeaInput, Expense, ExpenseInput, ItineraryItem, ScheduleActivityInput, Settlement, SettlementInput, Trip, TripMember, UpdateScheduleInput, UpdateTripInput } from './types'

type Props = {
  trip: Trip
  members: TripMember[]
  ideas: ActivityIdea[]
  itinerary: ItineraryItem[]
  expenses: Expense[]
  balances: BalanceSummary | null
  settlements: Settlement[]
  currentUserId: string
  initialSection?: TripSection
  loading: boolean
  loadError: string
  onRetry: () => void
  onNavigate: (page: AppPage) => void
  onCreateTrip: () => void
  onCreateInvitation: () => Promise<{ url: string; expiresAt: string }>
  onUpdateTrip: (input: UpdateTripInput) => Promise<void>
  onCreateIdea: (input: CreateActivityIdeaInput) => Promise<void>
  onVote: (ideaId: string, vote: ActivityVoteValue | null) => Promise<void>
  onSchedule: (input: ScheduleActivityInput) => Promise<ItineraryItem>
  onUpdateSchedule: (itemId: string, input: UpdateScheduleInput) => Promise<ItineraryItem>
  onRemoveSchedule: (itemId: string, ideaId: string) => Promise<void>
  onSaveExpense: (input: ExpenseInput, expenseId?: string) => Promise<void>
  onDeleteExpense: (expenseId: string) => Promise<void>
  onRecordSettlement: (input: SettlementInput) => Promise<void>
  onVoidSettlement: (settlementId: string) => Promise<void>
  onRemoveMember: (userId: string) => Promise<void>
  onLeaveTrip: () => Promise<void>
  onLogout: () => Promise<void>
}

type Section = TripSection
const sections: Section[] = ['overview', 'itinerary', 'expenses', 'balances', 'members']
const formatDate = (date: string) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`))

function EmptyModule({ icon, title, copy }: { icon: string; title: string; copy: string }) {
  return <div className="detail-empty"><span>{icon}</span><h3>{title}</h3><p>{copy}</p><button type="button" disabled>Coming next</button></div>
}

export function TripDetailPage({ trip, members, ideas, itinerary, expenses, balances, settlements, currentUserId, initialSection = 'overview', loading, loadError, onRetry, onNavigate, onCreateTrip, onCreateInvitation, onUpdateTrip, onCreateIdea, onVote, onSchedule, onUpdateSchedule, onRemoveSchedule, onSaveExpense, onDeleteExpense, onRecordSettlement, onVoidSettlement, onRemoveMember, onLeaveTrip, onLogout }: Props) {
  const [section, setSection] = useState<Section>(initialSection)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')
  const [inviteExpiry, setInviteExpiry] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [editingTrip, setEditingTrip] = useState(false)
  const days = Math.max(1, Math.round((new Date(`${trip.endDate}T00:00:00`).getTime() - new Date(`${trip.startDate}T00:00:00`).getTime()) / 86400000) + 1)
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const currentBalance = Number(balances?.members.find(member => member.userId === currentUserId)?.netBalance ?? 0)
  const formattedBalance = new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(currentBalance))

  const createInvitation = async () => {
    setInviteOpen(true)
    setInviteLoading(true)
    setInviteError('')
    try {
      const invitation = await onCreateInvitation()
      setInviteUrl(invitation.url)
      setInviteExpiry(invitation.expiresAt)
    } catch (reason) {
      setInviteError(reason instanceof Error ? reason.message : 'We could not create an invitation.')
    } finally {
      setInviteLoading(false)
    }
  }

  const copyInvitation = async () => {
    await navigator.clipboard.writeText(inviteUrl)
  }

  return (
    <div className="dashboard-shell">
      <AppNavigation activePage="trips" activeSection={section === 'overview' || section === 'members' ? undefined : section} onNavigate={onNavigate} onCreateTrip={onCreateTrip} onOpenSection={setSection} onLogout={onLogout} />
      <main className="dashboard-main trip-detail-page">
        <button className="detail-back" type="button" onClick={() => onNavigate('trips')}>← All trips</button>
        <section className="detail-hero">
          <div className="detail-route" aria-hidden="true"><i /><i /><i /><svg viewBox="0 0 900 220"><path d="M-20 175C125 36 247 220 382 104S650 32 930 142" /></svg></div>
          <div className="detail-hero-copy"><div><span className="detail-role">{trip.currentUserRole}</span><span className="detail-status">{trip.status}</span></div><p>YOUR TRIP</p><h1>{trip.title}</h1><div className="detail-meta"><span>⌖ {trip.destination}</span><span>□ {formatDate(trip.startDate)} – {formatDate(trip.endDate)}</span><span>◷ {days} {days === 1 ? 'day' : 'days'}</span></div>{trip.description && <blockquote>{trip.description}</blockquote>}</div>
          <div className="detail-actions"><button type="button" disabled={trip.currentUserRole !== 'OWNER'} title={trip.currentUserRole !== 'OWNER' ? 'Only the trip owner can edit this trip' : undefined} onClick={() => setEditingTrip(true)}>Edit trip {trip.currentUserRole !== 'OWNER' && '🔒'}</button><button type="button" disabled={trip.currentUserRole !== 'OWNER'} title={trip.currentUserRole !== 'OWNER' ? 'Only the trip owner can invite people' : undefined} onClick={() => void createInvitation()}>Invite people {trip.currentUserRole === 'OWNER' ? '＋' : '🔒'}</button></div>
        </section>

        <section className="detail-stats" aria-label="Trip summary">
          <div><span>PEOPLE</span><strong>{members.length.toString().padStart(2, '0')}</strong><small>{members.length === 1 ? 'traveller' : 'travellers'} together</small></div>
          <div><span>ACTIVITIES</span><strong>{itinerary.length.toString().padStart(2, '0')}</strong><small>{itinerary.length ? 'in your itinerary' : 'Nothing planned yet'}</small></div>
          <div><span>SPENT</span><strong>{trip.defaultCurrency} {new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(totalSpent)}</strong><small>{expenses.length ? `${expenses.length} shared ${expenses.length === 1 ? 'expense' : 'expenses'}` : 'No expenses yet'}</small></div>
          <div><span>YOUR BALANCE</span><strong>{currentBalance > 0 ? '+' : currentBalance < 0 ? '−' : ''}{trip.defaultCurrency} {formattedBalance}</strong><small>{currentBalance > 0 ? 'You get back' : currentBalance < 0 ? 'You owe' : 'All settled up'}</small></div>
        </section>

        <nav className="detail-tabs" aria-label="Trip sections">
          {sections.map(value => <button key={value} type="button" disabled={loading} aria-current={section === value ? 'page' : undefined} onClick={() => setSection(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}
        </nav>

        <section className="detail-content">
          {loading && <div className="trip-detail-skeleton" role="status" aria-label="Loading trip details"><div className="skeleton-panel"><i /><i /><i /><i /></div><div className="skeleton-stack"><i /><i /></div><span>Gathering the latest trip details...</span></div>}
          {!loading && loadError && <div className="trip-load-error" role="alert"><span>!</span><div><h2>We hit a detour.</h2><p>{loadError}</p></div><button type="button" onClick={onRetry}>Try again</button></div>}
          {!loading && !loadError && section === 'overview' && <div className="overview-layout">
            <article className="detail-panel detail-plan"><header><div><p>NEXT UP</p><h2>Your itinerary</h2></div><button type="button" onClick={() => setSection('itinerary')}>View itinerary →</button></header><EmptyModule icon="⌁" title="The days are yours to shape." copy="Activities will appear here once you start building the itinerary." /></article>
            <aside className="detail-side-stack"><article className="detail-panel"><p className="panel-kicker">TRIP CREW</p><h2>Travelling together</h2>{members.slice(0, 2).map(member => <div className="current-member" key={member.userId}><span>{member.displayName.split(' ').map(word => word[0]).slice(0, 2).join('')}</span><div><strong>{member.displayName}</strong><small>{member.role.toLowerCase()}</small></div></div>)}<button type="button" className="panel-link" onClick={() => setSection('members')}>See members →</button></article><article className="detail-panel money-panel"><p className="panel-kicker">SHARED MONEY</p><h2>{currentBalance === 0 ? 'Nothing to settle.' : currentBalance > 0 ? `You get back ${trip.defaultCurrency} ${formattedBalance}.` : `You owe ${trip.defaultCurrency} ${formattedBalance}.`}</h2><p>{expenses.length ? 'Your position is calculated from every expense and share in this trip.' : 'Add expenses during the trip and SplitTrip will keep the group even.'}</p><button type="button" className="panel-link" onClick={() => setSection(expenses.length ? 'balances' : 'expenses')}>{expenses.length ? 'See balances' : 'See expenses'} →</button></article></aside>
          </div>}
          {!loading && !loadError && section === 'itinerary' && <ItineraryWorkspace trip={trip} ideas={ideas} itinerary={itinerary} onCreateIdea={onCreateIdea} onVote={onVote} onSchedule={onSchedule} onUpdateSchedule={onUpdateSchedule} onRemoveSchedule={onRemoveSchedule} />}
          {!loading && !loadError && section === 'expenses' && <ExpenseWorkspace trip={trip} members={members} expenses={expenses} onSave={onSaveExpense} onDelete={onDeleteExpense} />}
          {!loading && !loadError && section === 'balances' && <BalanceWorkspace trip={trip} summary={balances} settlements={settlements} currentUserId={currentUserId} onRecord={onRecordSettlement} onVoid={onVoidSettlement} />}
          {!loading && !loadError && section === 'members' && <div className="members-preview"><header><div><p className="panel-kicker">TRIP CREW</p><h2>{members.length} {members.length === 1 ? 'traveller' : 'travellers'}</h2></div>{trip.currentUserRole === 'OWNER' && <button type="button" onClick={() => void createInvitation()}>Invite people ＋</button>}</header><div className="member-list">{members.map(member => <article key={member.userId}><div className="current-member"><span>{member.displayName.split(' ').map(word => word[0]).slice(0, 2).join('')}</span><div><strong>{member.displayName}</strong><small>{member.email}</small></div></div><div className="member-actions"><b>{member.role}</b>{trip.currentUserRole === 'OWNER' && member.role !== 'OWNER' && <button type="button" onClick={() => void onRemoveMember(member.userId)}>Remove</button>}</div></article>)}</div>{trip.currentUserRole === 'MEMBER' && <button className="leave-trip" type="button" onClick={() => void onLeaveTrip()}>Leave trip</button>}</div>}
        </section>
      </main>
      {editingTrip && <EditTripDialog trip={trip} currencyLocked={expenses.length > 0} onClose={() => setEditingTrip(false)} onUpdate={onUpdateTrip} />}
      {inviteOpen && <div className="dialog-backdrop" role="presentation"><section className="invite-dialog" role="dialog" aria-modal="true" aria-labelledby="invite-title"><button type="button" aria-label="Close invitation" onClick={() => setInviteOpen(false)}>×</button><p>BRING YOUR PEOPLE</p><h2 id="invite-title">Share the journey.</h2>{inviteLoading && <div className="invite-loading">Creating a secure link...</div>}{inviteError && <p className="form-error" role="alert"><span>!</span>{inviteError}</p>}{inviteUrl && <><label>Invitation link<input value={inviteUrl} readOnly /></label><small>Single use · Expires {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(inviteExpiry))}</small><button className="copy-invite" type="button" onClick={() => void copyInvitation()}>Copy invitation link</button></>}</section></div>}
    </div>
  )
}
