import { useMemo, useState } from 'react'
import type { DragEvent, FormEvent } from 'react'

import type { ActivityIdea, ActivityVoteValue, CreateActivityIdeaInput, ItineraryItem, ScheduleActivityInput, Trip, UpdateScheduleInput } from './types'

type Props = {
  trip: Trip
  ideas: ActivityIdea[]
  itinerary: ItineraryItem[]
  onCreateIdea: (input: CreateActivityIdeaInput) => Promise<void>
  onVote: (ideaId: string, vote: ActivityVoteValue | null) => Promise<void>
  onSchedule: (input: ScheduleActivityInput) => Promise<ItineraryItem>
  onUpdateSchedule: (itemId: string, input: UpdateScheduleInput) => Promise<ItineraryItem>
  onRemoveSchedule: (itemId: string, ideaId: string) => Promise<void>
}

const pad = (value: number) => value.toString().padStart(2, '0')
const minutesToTime = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
const addMinutes = (time: string, amount: number) => {
  const [hours, minutes] = time.split(':').map(Number)
  return minutesToTime(Math.min(hours * 60 + minutes + amount, 23 * 60 + 59))
}
const readableTime = (time: string) => time.slice(0, 5)
const timeToMinutes = (time: string) => {
  const [hours, minutes] = readableTime(time).split(':').map(Number)
  return hours * 60 + minutes
}
const dateLabel = (date: string) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`))
const weekdayLabel = (date: string) => new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(`${date}T12:00:00`))

type PositionedItem = { item: ItineraryItem; lane: number; lanes: number }
const positionOverlaps = (items: ItineraryItem[]): PositionedItem[] => {
  const sorted = [...items].sort((left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime))
  const result: PositionedItem[] = []
  for (let cursor = 0; cursor < sorted.length;) {
    const cluster: ItineraryItem[] = [sorted[cursor++]]
    let clusterEnd = timeToMinutes(cluster[0].endTime)
    while (cursor < sorted.length && timeToMinutes(sorted[cursor].startTime) < clusterEnd) {
      clusterEnd = Math.max(clusterEnd, timeToMinutes(sorted[cursor].endTime))
      cluster.push(sorted[cursor++])
    }
    const laneEnds: number[] = []
    const assigned = cluster.map(item => {
      const start = timeToMinutes(item.startTime)
      let lane = laneEnds.findIndex(end => end <= start)
      if (lane < 0) lane = laneEnds.length
      laneEnds[lane] = timeToMinutes(item.endTime)
      return { item, lane }
    })
    result.push(...assigned.map(value => ({ ...value, lanes: laneEnds.length })))
  }
  return result
}

export function ItineraryWorkspace({ trip, ideas, itinerary, onCreateIdea, onVote, onSchedule, onUpdateSchedule, onRemoveSchedule }: Props) {
  const dates = useMemo(() => {
    const values: string[] = []
    const current = new Date(`${trip.startDate}T12:00:00`)
    const last = new Date(`${trip.endDate}T12:00:00`)
    while (current <= last) {
      values.push(`${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`)
      current.setDate(current.getDate() + 1)
    }
    return values
  }, [trip.startDate, trip.endDate])
  const [selectedDate, setSelectedDate] = useState(dates[0])
  const [ideaFormOpen, setIdeaFormOpen] = useState(false)
  const [scheduleIdea, setScheduleIdea] = useState<ActivityIdea | null>(null)
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null)
  const [scheduleStart, setScheduleStart] = useState('09:00')
  const [scheduleEnd, setScheduleEnd] = useState('11:00')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const dayItems = itinerary.filter(item => item.scheduledDate === selectedDate)
  const timelineStart = Math.min(8 * 60, ...dayItems.map(item => Math.floor(timeToMinutes(item.startTime) / 30) * 30))
  const timelineEnd = Math.max(22 * 60, ...dayItems.map(item => Math.ceil(timeToMinutes(item.endTime) / 30) * 30))
  const slots = Array.from({ length: Math.max(1, (timelineEnd - timelineStart) / 30) }, (_, index) => minutesToTime(timelineStart + index * 30))
  const positionedItems = positionOverlaps(dayItems)

  const openScheduler = (idea: ActivityIdea, start = '09:00') => {
    setEditingItem(null)
    setScheduleIdea(idea)
    setScheduleStart(start)
    setScheduleEnd(addMinutes(start, idea.estimatedDurationMinutes))
    setFormError('')
    setNotice('')
  }

  const openEditor = (item: ItineraryItem) => {
    const idea = ideas.find(candidate => candidate.id === item.activityIdeaId)
    if (!idea) return
    setEditingItem(item)
    setScheduleIdea(idea)
    setSelectedDate(item.scheduledDate)
    setScheduleStart(readableTime(item.startTime))
    setScheduleEnd(readableTime(item.endTime))
    setFormError('')
    setNotice('')
  }

  const dropIdea = (event: DragEvent, time: string) => {
    event.preventDefault()
    const idea = ideas.find(candidate => candidate.id === event.dataTransfer.getData('text/activity-idea'))
    if (idea && idea.status === 'PROPOSED') openScheduler(idea, time)
  }

  const createIdea = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    const data = new FormData(event.currentTarget)
    try {
      await onCreateIdea({
        title: String(data.get('title')),
        description: String(data.get('description')),
        location: String(data.get('location')),
        estimatedDurationMinutes: Number(data.get('duration')),
      })
      setIdeaFormOpen(false)
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : 'We could not save this idea.')
    }
  }

  const schedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!scheduleIdea) return
    setFormError('')
    const data = new FormData(event.currentTarget)
    try {
      const scheduleInput = {
        scheduledDate: String(data.get('date')),
        startTime: String(data.get('startTime')),
        endTime: String(data.get('endTime')),
        note: String(data.get('note')),
      }
      const item = editingItem
        ? await onUpdateSchedule(editingItem.id, scheduleInput)
        : await onSchedule({ activityIdeaId: scheduleIdea.id, ...scheduleInput })
      setScheduleIdea(null)
      setEditingItem(null)
      setSelectedDate(item.scheduledDate)
      setNotice(item.overlapsExistingItem ? 'Saved with a time conflict — you can keep both for now.' : editingItem ? 'Itinerary updated.' : 'Activity added to the itinerary.')
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : 'We could not schedule this activity.')
    }
  }

  const removeFromSchedule = async () => {
    if (!editingItem || !scheduleIdea) return
    setFormError('')
    try {
      await onRemoveSchedule(editingItem.id, scheduleIdea.id)
      setScheduleIdea(null)
      setEditingItem(null)
      setNotice('Activity returned to the idea pool.')
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : 'We could not remove this activity.')
    }
  }

  return <div className="itinerary-workspace">
    <aside className="idea-pool">
      <header><div><p>GROUP BRAINSTORM</p><h2>Idea pool</h2><small>Drag an idea onto a time slot, or tap Schedule.</small></div><button type="button" onClick={() => { setIdeaFormOpen(true); setFormError('') }}>＋ Add idea</button></header>
      <div className="idea-list">
        {ideas.length === 0 && <div className="idea-empty"><span>✦</span><strong>Start with a possibility.</strong><small>Everyone in the trip can suggest as many activities as they like.</small></div>}
        {ideas.map(idea => <article className={`idea-card ${idea.status.toLowerCase()}`} key={idea.id} draggable={idea.status === 'PROPOSED'} onDragStart={event => event.dataTransfer.setData('text/activity-idea', idea.id)}>
          <div className="idea-card-top"><span>{idea.status === 'SCHEDULED' ? '✓ PLANNED' : '⋮⋮ DRAG TO PLAN'}</span><small>{idea.estimatedDurationMinutes} min</small></div>
          <h3>{idea.title}</h3>{idea.location && <p>⌖ {idea.location}</p>}{idea.description && <p>{idea.description}</p>}
          <footer><div className="vote-buttons"><button type="button" className={idea.currentUserVote === 'LIKE' ? 'active' : ''} aria-label={`Like ${idea.title}`} onClick={() => void onVote(idea.id, idea.currentUserVote === 'LIKE' ? null : 'LIKE')}>↑ {idea.likes}</button><button type="button" className={idea.currentUserVote === 'DISLIKE' ? 'active dislike' : ''} aria-label={`Dislike ${idea.title}`} onClick={() => void onVote(idea.id, idea.currentUserVote === 'DISLIKE' ? null : 'DISLIKE')}>↓ {idea.dislikes}</button></div><span>by {idea.createdByName}</span>{idea.status === 'PROPOSED' && <button type="button" onClick={() => openScheduler(idea)}>Schedule</button>}</footer>
        </article>)}
      </div>
    </aside>
    <section className="timeline-panel">
      <header><div><p>DAY BY DAY</p><h2>Trip timeline</h2></div><span>{dayItems.length} planned</span></header>
      <nav className="date-strip" aria-label="Itinerary dates">{dates.map(date => <button key={date} type="button" aria-current={selectedDate === date ? 'date' : undefined} onClick={() => setSelectedDate(date)}><b>{weekdayLabel(date)}</b><span>{dateLabel(date)}</span></button>)}</nav>
      {notice && <p className="schedule-notice">{notice}</p>}
      <div className="timeline" style={{ height: `${slots.length * 54}px` }}>
        <div className="timeline-grid">{slots.map(time => <div className="time-row" key={time} onDragOver={event => event.preventDefault()} onDrop={event => dropIdea(event, time)}><time>{time}</time><div className="time-dropzone" /></div>)}</div>
        <div className="timeline-events">{positionedItems.map(({ item, lane, lanes }) => {
          const colorIndex = Math.max(0, itinerary.findIndex(candidate => candidate.id === item.id)) % 3
          const top = (timeToMinutes(item.startTime) - timelineStart) * 1.8 + 3
          const height = Math.max(46, (timeToMinutes(item.endTime) - timeToMinutes(item.startTime)) * 1.8 - 6)
          return <article className={`timeline-event color-${colorIndex}`} key={item.id} style={{ top: `${top}px`, height: `${height}px`, left: `calc(${lane * 100 / lanes}% + ${lane * 3}px)`, width: `calc(${100 / lanes}% - ${(lanes - 1) * 3 / lanes}px)` }}><div><b>{item.title}</b><button type="button" aria-label={`Edit ${item.title}`} onClick={() => openEditor(item)}>Edit</button></div><span>{readableTime(item.startTime)}–{readableTime(item.endTime)}{item.location ? ` · ${item.location}` : ''}</span>{item.note && <small>{item.note}</small>}</article>
        })}</div>
      </div>
    </section>

    {ideaFormOpen && <div className="dialog-backdrop" role="presentation"><section className="activity-dialog" role="dialog" aria-modal="true" aria-labelledby="idea-dialog-title"><button className="dialog-close" type="button" aria-label="Close" onClick={() => setIdeaFormOpen(false)}>×</button><p>ADD TO THE MIX</p><h2 id="idea-dialog-title">What should we do?</h2><form onSubmit={createIdea}><label>Activity name<input name="title" required maxLength={120} placeholder="Sunset boat tour" /></label><div className="activity-form-row"><label>Location <span>optional</span><input name="location" maxLength={160} placeholder="Old harbour" /></label><label>Estimated duration<select name="duration" defaultValue="120"><option value="30">30 minutes</option><option value="60">1 hour</option><option value="90">1.5 hours</option><option value="120">2 hours</option><option value="180">3 hours</option><option value="240">4 hours</option></select></label></div><label>Why this one? <span>optional</span><textarea name="description" maxLength={500} placeholder="Share a detail with the crew..." /></label>{formError && <p className="form-error" role="alert">{formError}</p>}<button className="activity-submit" type="submit">Share idea →</button></form></section></div>}

    {scheduleIdea && <div className="dialog-backdrop" role="presentation"><section className="activity-dialog schedule-dialog" role="dialog" aria-modal="true" aria-labelledby="schedule-dialog-title"><button className="dialog-close" type="button" aria-label="Close" onClick={() => { setScheduleIdea(null); setEditingItem(null) }}>×</button><p>{editingItem ? 'CHANGE OF PLANS' : 'MAKE IT REAL'}</p><h2 id="schedule-dialog-title">{editingItem ? 'Adjust the itinerary.' : 'Place it on the map.'}</h2><div className="schedule-summary"><strong>{scheduleIdea.title}</strong><span>{scheduleIdea.estimatedDurationMinutes} min suggested</span></div><form onSubmit={schedule}><label>Date<select name="date" value={selectedDate} onChange={event => setSelectedDate(event.target.value)}>{dates.map(date => <option value={date} key={date}>{dateLabel(date)}</option>)}</select></label><div className="activity-form-row"><label>Starts<input name="startTime" type="time" value={scheduleStart} onChange={event => { setScheduleStart(event.target.value); setScheduleEnd(addMinutes(event.target.value, scheduleIdea.estimatedDurationMinutes)) }} required /></label><label>Ends<input name="endTime" type="time" value={scheduleEnd} onChange={event => setScheduleEnd(event.target.value)} required /></label></div><label>Plan note <span>optional</span><textarea name="note" maxLength={500} defaultValue={editingItem?.note ?? ''} placeholder="Meet by the entrance..." /></label>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="schedule-actions">{editingItem && <button className="remove-schedule" type="button" onClick={() => void removeFromSchedule()}>Return to idea pool</button>}<button className="activity-submit" type="submit">{editingItem ? 'Save changes →' : 'Add to itinerary →'}</button></div></form></section></div>}
  </div>
}
