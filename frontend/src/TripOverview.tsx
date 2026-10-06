import type { CSSProperties } from 'react'
import type { ActivityIdea, BalanceSummary, ChecklistItem, Expense, ItineraryItem, Trip, TripMember } from './types'

type Section = 'itinerary' | 'checklist' | 'expenses' | 'balances' | 'members'
type Props = {
  trip: Trip
  members: TripMember[]
  ideas: ActivityIdea[]
  itinerary: ItineraryItem[]
  expenses: Expense[]
  balances: BalanceSummary | null
  checklist: ChecklistItem[]
  currentUserId: string
  onOpen: (section: Section) => void
}

const today = () => new Date().toLocaleDateString('en-CA')
const money = (amount: number) => new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
const shortDate = (date: string) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(new Date(`${date}T00:00:00`))
const timeValue = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))

export function TripOverview({ trip, members, ideas, itinerary, expenses, balances, checklist, currentUserId, onOpen }: Props) {
  const now = today()
  const duration = Math.max(1, Math.round((new Date(`${trip.endDate}T00:00:00`).getTime() - new Date(`${trip.startDate}T00:00:00`).getTime()) / 86400000) + 1)
  const daysUntil = Math.ceil((new Date(`${trip.startDate}T00:00:00`).getTime() - new Date(`${now}T00:00:00`).getTime()) / 86400000)
  const journeyState = now < trip.startDate ? `${daysUntil} days to go` : now <= trip.endDate ? 'Happening now' : 'Trip completed'
  const proposedIdeas = ideas.filter(idea => idea.status === 'PROPOSED')
  const unvotedIdeas = proposedIdeas.filter(idea => idea.currentUserVote === null)
  const topIdea = [...proposedIdeas].sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes))[0]
  const nextItem = itinerary.find(item => item.scheduledDate >= now)
  const plannedDates = new Set(itinerary.map(item => item.scheduledDate))
  const emptyDays = Array.from({ length: duration }, (_, index) => {
    const date = new Date(`${trip.startDate}T00:00:00`)
    date.setDate(date.getDate() + index)
    return date.toLocaleDateString('en-CA')
  }).filter(date => !plannedDates.has(date)).length
  const conflicts = itinerary.filter((item, index) => itinerary.some((other, otherIndex) => index < otherIndex && item.scheduledDate === other.scheduledDate && timeValue(item.startTime) < timeValue(other.endTime) && timeValue(item.endTime) > timeValue(other.startTime))).length

  const completedTasks = checklist.filter(item => item.status === 'COMPLETED').length
  const overdueTasks = checklist.filter(item => item.status !== 'COMPLETED' && item.dueDate !== null && item.dueDate < now)
  const myOpenTasks = checklist.filter(item => item.status !== 'COMPLETED' && (item.assignedToEveryone || item.assigneeId === currentUserId))
  const nextTask = [...checklist].filter(item => item.status !== 'COMPLETED' && item.dueDate).sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))[0]
  const checklistProgress = checklist.length ? Math.round(completedTasks / checklist.length * 100) : 0

  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const paidByMe = expenses.filter(expense => expense.paidById === currentUserId).reduce((sum, expense) => sum + Number(expense.amount), 0)
  const attachmentCount = expenses.reduce((sum, expense) => sum + expense.attachments.length, 0)
  const missingDocuments = expenses.filter(expense => expense.attachments.length === 0).length
  const currentBalance = Number(balances?.members.find(member => member.userId === currentUserId)?.netBalance ?? 0)
  const transfers = balances?.suggestedTransfers ?? []
  const myTransfer = transfers.find(transfer => transfer.fromUserId === currentUserId || transfer.toUserId === currentUserId)

  const readinessParts = [itinerary.length > 0, checklistProgress >= 50, members.length > 1, expenses.length > 0]
  const readiness = Math.round(readinessParts.filter(Boolean).length / readinessParts.length * 100)
  const alerts = [
    overdueTasks.length ? { tone: 'urgent', icon: '!', title: `${overdueTasks.length} overdue ${overdueTasks.length === 1 ? 'task' : 'tasks'}`, copy: 'A deadline has passed and the task is still open.', section: 'checklist' as Section } : null,
    conflicts ? { tone: 'warm', icon: '↔', title: `${conflicts} itinerary ${conflicts === 1 ? 'conflict' : 'conflicts'}`, copy: 'Two activities occupy the same time window.', section: 'itinerary' as Section } : null,
    unvotedIdeas.length ? { tone: 'yellow', icon: '♡', title: `${unvotedIdeas.length} ${unvotedIdeas.length === 1 ? 'idea awaits' : 'ideas await'} your vote`, copy: 'Help the crew decide what makes the final plan.', section: 'itinerary' as Section } : null,
    missingDocuments ? { tone: 'cool', icon: '⌑', title: `${missingDocuments} ${missingDocuments === 1 ? 'expense has' : 'expenses have'} no document`, copy: 'Add a receipt or invoice if the group needs a record.', section: 'expenses' as Section } : null,
    transfers.length ? { tone: 'green', icon: '↗', title: `${transfers.length} unsettled ${transfers.length === 1 ? 'payment' : 'payments'}`, copy: 'The suggested transfers can bring everyone even.', section: 'balances' as Section } : null,
  ].filter(Boolean) as Array<{ tone: string; icon: string; title: string; copy: string; section: Section }>

  return <div className="trip-summary">
    <section className="summary-readiness">
      <div><p>TRIP READINESS</p><h2>{journeyState}</h2><span>{trip.destination} · {duration} {duration === 1 ? 'day' : 'days'} · {members.length} {members.length === 1 ? 'traveller' : 'travellers'}</span></div>
      <div className="readiness-score" style={{ '--progress': `${readiness * 3.6}deg` } as CSSProperties}><strong>{readiness}%</strong><small>ready</small></div>
    </section>

    <section className="summary-grid" aria-label="Trip overview">
      <article className="summary-card plan-card"><header><div><p>THE PLAN</p><h2>{itinerary.length ? `${itinerary.length} activities scheduled` : 'Start shaping the days'}</h2></div><button type="button" onClick={() => onOpen('itinerary')}>Open itinerary →</button></header><div className="summary-metrics"><span><b>{proposedIdeas.length}</b>ideas</span><span><b>{emptyDays}</b>empty days</span><span><b>{conflicts}</b>conflicts</span></div>{nextItem ? <div className="summary-highlight"><span>NEXT ACTIVITY</span><strong>{nextItem.title}</strong><small>{shortDate(nextItem.scheduledDate)} · {nextItem.startTime.slice(0, 5)}–{nextItem.endTime.slice(0, 5)}</small></div> : <div className="summary-placeholder">No activities are scheduled yet. Turn a crew idea into the first plan.</div>}{topIdea && <p className="summary-footnote">Crew favourite: <b>{topIdea.title}</b> · {topIdea.likes - topIdea.dislikes >= 0 ? '+' : ''}{topIdea.likes - topIdea.dislikes}</p>}</article>

      <article className="summary-card checklist-card"><header><div><p>CHECKLIST</p><h2>{completedTasks} of {checklist.length} completed</h2></div><button type="button" onClick={() => onOpen('checklist')}>Open checklist →</button></header><div className="summary-progress"><i style={{ width: `${checklistProgress}%` }} /></div><div className="summary-metrics"><span><b>{checklistProgress}%</b>done</span><span><b>{myOpenTasks.length}</b>mine</span><span className={overdueTasks.length ? 'metric-alert' : ''}><b>{overdueTasks.length}</b>overdue</span></div>{nextTask ? <p className="summary-footnote">Nearest deadline: <b>{nextTask.title}</b> · {shortDate(nextTask.dueDate!)}</p> : <p className="summary-footnote">{checklist.length ? 'No upcoming deadlines.' : 'Add the first preparation task for the crew.'}</p>}</article>

      <article className="summary-card expense-card"><header><div><p>EXPENSES</p><h2>{trip.defaultCurrency} {money(totalSpent)}</h2></div><button type="button" onClick={() => onOpen('expenses')}>Open expenses →</button></header><div className="summary-metrics"><span><b>{expenses.length}</b>expenses</span><span><b>{attachmentCount}</b>documents</span><span><b>{trip.defaultCurrency} {money(paidByMe)}</b>you paid</span></div><p className="summary-footnote">{members.length ? `${trip.defaultCurrency} ${money(totalSpent / members.length)} average per traveller` : 'Add travellers to calculate a group average.'}</p></article>

      <article className="summary-card balance-card"><header><div><p>YOUR BALANCE</p><h2>{currentBalance > 0 ? `You get back ${trip.defaultCurrency} ${money(currentBalance)}` : currentBalance < 0 ? `You owe ${trip.defaultCurrency} ${money(Math.abs(currentBalance))}` : 'All settled up'}</h2></div><button type="button" onClick={() => onOpen('balances')}>Open balances →</button></header>{myTransfer ? <div className="summary-highlight"><span>NEXT SUGGESTED PAYMENT</span><strong>{myTransfer.fromUserId === currentUserId ? `Pay ${myTransfer.toName}` : `Receive from ${myTransfer.fromName}`}</strong><small>{trip.defaultCurrency} {money(Number(myTransfer.amount))}</small></div> : <div className="summary-placeholder compact">There is no payment waiting for you.</div>}<p className="summary-footnote">{transfers.length} group {transfers.length === 1 ? 'transfer' : 'transfers'} remaining</p></article>
    </section>

    <section className="attention-section"><header><div><p>NEEDS ATTENTION</p><h2>{alerts.length ? 'A few things worth a look.' : 'Everything looks calm.'}</h2></div><span>{alerts.length} {alerts.length === 1 ? 'item' : 'items'}</span></header>{alerts.length ? <div className="attention-list">{alerts.map(alert => <button type="button" className={alert.tone} onClick={() => onOpen(alert.section)} key={`${alert.section}-${alert.title}`}><i>{alert.icon}</i><span><strong>{alert.title}</strong><small>{alert.copy}</small></span><b>→</b></button>)}</div> : <div className="all-clear"><span>✓</span><div><strong>Your trip is in good shape.</strong><small>New reminders will appear here when something needs the crew’s attention.</small></div></div>}</section>
  </div>
}
