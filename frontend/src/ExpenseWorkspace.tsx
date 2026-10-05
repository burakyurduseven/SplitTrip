import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Expense, ExpenseInput, ExpenseSplitMethod, Trip, TripMember } from './types'

type Props = { trip: Trip; members: TripMember[]; expenses: Expense[]; onSave: (input: ExpenseInput, expenseId?: string) => Promise<void>; onDelete: (expenseId: string) => Promise<void> }
const methods: Array<{ value: ExpenseSplitMethod; label: string; copy: string }> = [
  { value: 'EQUAL', label: 'Equally', copy: 'Same share for everyone' },
  { value: 'EXACT', label: 'Exact', copy: 'Set each amount' },
  { value: 'PERCENTAGE', label: 'Percent', copy: 'Split by percentage' },
]
const money = (value: number, currency: string) => new Intl.NumberFormat('en', { style: 'currency', currency }).format(value)
const prettyDate = (date: string) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`))

export function ExpenseWorkspace({ trip, members, expenses, onSave, onDelete }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [method, setMethod] = useState<ExpenseSplitMethod>('EQUAL')
  const [selected, setSelected] = useState<string[]>(members.map(member => member.userId))
  const [shares, setShares] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const total = useMemo(() => expenses.reduce((sum, expense) => sum + Number(expense.amount), 0), [expenses])

  const openCreate = () => { setEditing(null); setMethod('EQUAL'); setSelected(members.map(member => member.userId)); setShares({}); setError(''); setDialogOpen(true) }
  const openEdit = (expense: Expense) => {
    setEditing(expense); setMethod(expense.splitMethod); setSelected(expense.shares.map(share => share.userId))
    setShares(Object.fromEntries(expense.shares.map(share => [share.userId, String(expense.splitMethod === 'PERCENTAGE' ? share.percentage ?? '' : share.amount)])))
    setError(''); setDialogOpen(true)
  }
  const toggleMember = (userId: string) => setSelected(current => current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('')
    const data = new FormData(event.currentTarget)
    const participants = selected.map(userId => ({ userId, ...(method === 'EXACT' ? { amount: Number(shares[userId] || 0) } : {}), ...(method === 'PERCENTAGE' ? { percentage: Number(shares[userId] || 0) } : {}) }))
    try {
      await onSave({ title: String(data.get('title')), amount: Number(data.get('amount')), expenseDate: String(data.get('date')), paidById: String(data.get('paidById')), splitMethod: method, note: String(data.get('note')), participants }, editing?.id)
      setDialogOpen(false)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'We could not save this expense.') }
  }
  const remove = async () => {
    if (!editing) return
    if (!window.confirm(`Delete “${editing.title}”? This will recalculate everyone's balances.`)) return
    try { await onDelete(editing.id); setDialogOpen(false) } catch (reason) { setError(reason instanceof Error ? reason.message : 'We could not delete this expense.') }
  }

  return <div className="expense-workspace">
    <section className="expense-summary">
      <div><p>TRIP SPEND</p><h2>{money(total, trip.defaultCurrency)}</h2><span>across {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}</span></div>
      <button type="button" onClick={openCreate}>＋ Add expense</button>
      <div className="expense-orbit" aria-hidden="true"><i /><i /><i /></div>
    </section>
    <section className="expense-ledger">
      <header><div><p>SHARED LEDGER</p><h2>Money on the move</h2></div><span>{trip.defaultCurrency}</span></header>
      {expenses.length === 0 && <div className="expense-empty"><span>₺</span><h3>No shared expenses yet.</h3><p>Add the first payment and choose exactly how the group should split it.</p><button type="button" onClick={openCreate}>Add the first expense</button></div>}
      <div className="expense-list">{expenses.map((expense, index) => <article key={expense.id}>
        <div className={`expense-icon tone-${index % 3}`}>{expense.title.slice(0, 1).toUpperCase()}</div>
        <div className="expense-main"><div><h3>{expense.title}</h3><span>{prettyDate(expense.expenseDate)} · paid by {expense.paidByName}</span></div><div><strong>{money(Number(expense.amount), trip.defaultCurrency)}</strong><small>{expense.splitMethod.toLowerCase()}</small></div></div>
        <div className="expense-shares">{expense.shares.map(share => <span key={share.userId}>{share.displayName.split(' ')[0]} <b>{money(Number(share.amount), trip.defaultCurrency)}</b></span>)}</div>
        <button className="expense-edit" type="button" aria-label={`Edit ${expense.title}`} onClick={() => openEdit(expense)}>Edit</button>
      </article>)}</div>
    </section>

    {dialogOpen && <div className="dialog-backdrop" role="presentation"><section className="expense-dialog" role="dialog" aria-modal="true" aria-labelledby="expense-dialog-title"><button className="dialog-close" type="button" aria-label="Close" onClick={() => setDialogOpen(false)}>×</button><p>{editing ? 'UPDATE THE LEDGER' : 'A NEW SHARED COST'}</p><h2 id="expense-dialog-title">{editing ? 'Change the expense.' : 'Who picked up the tab?'}</h2><form onSubmit={submit}>
      <div className="expense-form-top"><label>What was it for?<input name="title" required maxLength={120} defaultValue={editing?.title} placeholder="Dinner by the harbour" /></label><label>Amount<input name="amount" type="number" min="0.01" step="0.01" required defaultValue={editing?.amount} placeholder="0.00" /></label></div>
      <div className="expense-form-top"><label>Paid by<select name="paidById" defaultValue={editing?.paidById ?? members[0]?.userId}>{members.map(member => <option key={member.userId} value={member.userId}>{member.displayName}</option>)}</select></label><label>Date<input name="date" type="date" min={trip.startDate} max={trip.endDate} required defaultValue={editing?.expenseDate ?? trip.startDate} /></label></div>
      <fieldset><legend>How should it be split?</legend><div className="split-methods">{methods.map(option => <button type="button" key={option.value} className={method === option.value ? 'active' : ''} onClick={() => setMethod(option.value)}><strong>{option.label}</strong><span>{option.copy}</span></button>)}</div></fieldset>
      <fieldset><legend>Included travellers</legend><div className="participant-list">{members.map(member => <div className={selected.includes(member.userId) ? 'selected' : ''} key={member.userId}><button type="button" aria-label={`Include ${member.displayName}`} onClick={() => toggleMember(member.userId)}><i>{selected.includes(member.userId) ? '✓' : ''}</i><span>{member.displayName}</span></button>{selected.includes(member.userId) && method !== 'EQUAL' && <label><input aria-label={`${method === 'EXACT' ? 'Amount' : 'Percentage'} for ${member.displayName}`} type="number" min="0.01" step="0.01" value={shares[member.userId] ?? ''} onChange={event => setShares(current => ({ ...current, [member.userId]: event.target.value }))} /><b>{method === 'EXACT' ? trip.defaultCurrency : '%'}</b></label>}</div>)}</div></fieldset>
      <label>Note <span>optional</span><textarea name="note" maxLength={500} defaultValue={editing?.note ?? ''} placeholder="Anything the crew should remember?" /></label>{error && <p className="form-error" role="alert">{error}</p>}
      <div className="expense-dialog-actions">{editing && <button className="delete-expense" type="button" onClick={() => void remove()}>Delete expense</button>}<button className="activity-submit" type="submit">{editing ? 'Save changes →' : 'Add expense →'}</button></div>
    </form></section></div>}
  </div>
}
