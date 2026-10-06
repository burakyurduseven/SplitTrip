import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import type { ChecklistItem, ChecklistItemInput, ChecklistPriority, ChecklistStatus, Trip, TripMember } from './types'

type Filter = 'all' | 'mine' | 'todo' | 'in_progress' | 'completed'
type Props = {
  trip: Trip
  members: TripMember[]
  items: ChecklistItem[]
  currentUserId: string
  onSave: (input: ChecklistItemInput, itemId?: string) => Promise<void>
  onStatusChange: (itemId: string, status: ChecklistStatus) => Promise<void>
  onDelete: (itemId: string) => Promise<void>
}

const localDate = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const formatDate = (value: string) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
const initials = (name: string) => name.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase()

export function ChecklistWorkspace({ trip, members, items, currentUserId, onSave, onStatusChange, onDelete }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [editing, setEditing] = useState<ChecklistItem | null | undefined>(undefined)
  const completed = items.filter(item => item.status === 'COMPLETED').length
  const progress = items.length ? Math.round(completed * 100 / items.length) : 0
  const visibleItems = useMemo(() => items.filter(item => {
    if (filter === 'mine') return item.assignedToEveryone || item.assigneeId === currentUserId
    if (filter === 'todo') return item.status === 'TODO'
    if (filter === 'in_progress') return item.status === 'IN_PROGRESS'
    if (filter === 'completed') return item.status === 'COMPLETED'
    return true
  }).sort((left, right) => {
    const today = localDate()
    const leftCompleted = left.status === 'COMPLETED' ? 1 : 0
    const rightCompleted = right.status === 'COMPLETED' ? 1 : 0
    if (leftCompleted !== rightCompleted) return leftCompleted - rightCompleted
    const leftOverdue = left.dueDate && left.dueDate < today && !leftCompleted ? 0 : 1
    const rightOverdue = right.dueDate && right.dueDate < today && !rightCompleted ? 0 : 1
    if (leftOverdue !== rightOverdue) return leftOverdue - rightOverdue
    const priorityOrder: Record<ChecklistPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    if (priorityOrder[left.priority] !== priorityOrder[right.priority]) return priorityOrder[left.priority] - priorityOrder[right.priority]
    return (left.dueDate ?? '9999-12-31').localeCompare(right.dueDate ?? '9999-12-31') || left.createdAt.localeCompare(right.createdAt)
  }), [currentUserId, filter, items])

  return <div className="checklist-workspace">
    <header className="checklist-header">
      <div><p>READY, SET, GO</p><h2>Trip checklist</h2><span>Keep every little detail moving before takeoff.</span></div>
      <button type="button" onClick={() => setEditing(null)}>Add task <b>＋</b></button>
    </header>
    <section className="checklist-progress" aria-label={`${progress}% complete`}>
      <div><strong>{completed} of {items.length} completed</strong><span>{progress}%</span></div>
      <i><b style={{ width: `${progress}%` }} /></i>
    </section>
    <nav className="checklist-filters" aria-label="Filter checklist">
      {(['all', 'mine', 'todo', 'in_progress', 'completed'] as Filter[]).map(value => <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value === 'in_progress' ? 'In progress' : value === 'todo' ? 'To do' : value[0].toUpperCase() + value.slice(1)}</button>)}
    </nav>
    {visibleItems.length ? <div className="checklist-list">{visibleItems.map(item => {
      const overdue = item.dueDate && item.dueDate < localDate() && item.status !== 'COMPLETED'
      const canManage = trip.currentUserRole === 'OWNER' || item.createdById === currentUserId
      const canComplete = canManage || item.assignedToEveryone || item.assigneeId === currentUserId
      return <article key={item.id} className={`${item.status === 'COMPLETED' ? 'completed' : ''} ${overdue ? 'overdue' : ''}`}>
        <button className="task-check" type="button" disabled={!canComplete} aria-label={item.status === 'COMPLETED' ? `Reopen ${item.title}` : `Complete ${item.title}`} onClick={() => void onStatusChange(item.id, item.status === 'COMPLETED' ? 'TODO' : 'COMPLETED')}>{item.status === 'COMPLETED' ? '✓' : ''}</button>
        <div className="task-copy"><div><span className={`task-priority ${item.priority.toLowerCase()}`}>{item.priority}</span>{overdue && <span className="task-overdue">OVERDUE</span>}</div><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}<small>Created by {item.createdByName}</small></div>
        <div className="task-meta"><div className="task-assignee"><span>{item.assignedToEveryone ? 'ALL' : initials(item.assigneeName ?? '?')}</span><div><small>ASSIGNED TO</small><strong>{item.assignedToEveryone ? 'Everyone' : item.assigneeName}</strong></div></div><div className="task-date"><small>DUE DATE</small><strong>{item.dueDate ? formatDate(item.dueDate) : 'No deadline'}</strong></div></div>
        <div className="task-actions"><select aria-label={`Status for ${item.title}`} value={item.status} disabled={!canComplete} onChange={event => void onStatusChange(item.id, event.target.value as ChecklistStatus)}><option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option></select>{canManage && <button type="button" onClick={() => setEditing(item)}>Edit</button>}</div>
      </article>
    })}</div> : <div className="checklist-empty"><span>✓</span><h3>{items.length ? 'No tasks match this view.' : 'Your runway is clear.'}</h3><p>{items.length ? 'Try a different filter to see more tasks.' : 'Add the first task and get the whole crew ready.'}</p>{!items.length && <button type="button" onClick={() => setEditing(null)}>Add your first task</button>}</div>}
    {editing !== undefined && <ChecklistDialog item={editing} members={members} onClose={() => setEditing(undefined)} onSave={async input => { await onSave(input, editing?.id); setEditing(undefined) }} onDelete={editing ? async () => { if (window.confirm(`Delete “${editing.title}”?`)) { await onDelete(editing.id); setEditing(undefined) } } : undefined} />}
  </div>
}

function ChecklistDialog({ item, members, onClose, onSave, onDelete }: { item: ChecklistItem | null; members: TripMember[]; onClose: () => void; onSave: (input: ChecklistItemInput) => Promise<void>; onDelete?: () => Promise<void> }) {
  const [title, setTitle] = useState(item?.title ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [assignee, setAssignee] = useState(item?.assignedToEveryone ? 'everyone' : item?.assigneeId ?? 'everyone')
  const [priority, setPriority] = useState<ChecklistPriority>(item?.priority ?? 'MEDIUM')
  const [dueDate, setDueDate] = useState(item?.dueDate ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('')
    try { await onSave({ title, description, assigneeId: assignee === 'everyone' ? null : assignee, assignedToEveryone: assignee === 'everyone', priority, dueDate: dueDate || null }) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'We could not save this task.') }
    finally { setSaving(false) }
  }
  return <div className="dialog-backdrop"><section className="checklist-dialog" role="dialog" aria-modal="true" aria-labelledby="checklist-dialog-title"><button className="dialog-close" type="button" aria-label="Close task form" onClick={onClose}>×</button><p>TRIP PREP</p><h2 id="checklist-dialog-title">{item ? 'Fine-tune the task.' : 'What needs doing?'}</h2><form onSubmit={submit}><label>Task title<input value={title} onChange={event => setTitle(event.target.value)} maxLength={120} required autoFocus /></label><label>Description <span>optional</span><textarea value={description} onChange={event => setDescription(event.target.value)} maxLength={1000} placeholder="Add a helpful detail for the crew" /></label><div className="checklist-form-grid"><label>Assign to<select value={assignee} onChange={event => setAssignee(event.target.value)}><option value="everyone">Everyone</option>{members.map(member => <option value={member.userId} key={member.userId}>{member.displayName}</option>)}</select></label><label>Due date <span>optional</span><input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} /></label></div><fieldset><legend>Priority</legend><div className="priority-options">{(['LOW', 'MEDIUM', 'HIGH'] as ChecklistPriority[]).map(value => <button type="button" className={priority === value ? `active ${value.toLowerCase()}` : ''} onClick={() => setPriority(value)} key={value}>{value[0] + value.slice(1).toLowerCase()}</button>)}</div></fieldset>{error && <p className="form-error" role="alert"><span>!</span>{error}</p>}<div className="checklist-dialog-actions">{onDelete && <button className="delete-task" type="button" onClick={() => void onDelete()}>Delete task</button>}<button className="activity-submit" type="submit" disabled={saving}>{saving ? 'Saving...' : item ? 'Save changes' : 'Create task'} <span>→</span></button></div></form></section></div>
}
