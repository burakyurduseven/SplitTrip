import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Expense, ExpenseAttachment, ExpenseInput, ExpenseSplitMethod, Trip, TripMember } from './types'

type Props = { trip: Trip; members: TripMember[]; expenses: Expense[]; onSave: (input: ExpenseInput, expenseId?: string) => Promise<Expense>; onDelete: (expenseId: string) => Promise<void>; onUploadAttachments: (expenseId: string, files: File[]) => Promise<ExpenseAttachment[]>; onFetchAttachment: (expenseId: string, attachmentId: string, download?: boolean) => Promise<Blob>; onDeleteAttachment: (expenseId: string, attachmentId: string) => Promise<void> }
const methods: Array<{ value: ExpenseSplitMethod; label: string; copy: string }> = [
  { value: 'EQUAL', label: 'Equally', copy: 'Same share for everyone' },
  { value: 'EXACT', label: 'Exact', copy: 'Set each amount' },
  { value: 'PERCENTAGE', label: 'Percent', copy: 'Split by percentage' },
]
const money = (value: number, currency: string) => new Intl.NumberFormat('en', { style: 'currency', currency }).format(value)
const prettyDate = (date: string) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`))

export function ExpenseWorkspace({ trip, members, expenses, onSave, onDelete, onUploadAttachments, onFetchAttachment, onDeleteAttachment }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [method, setMethod] = useState<ExpenseSplitMethod>('EQUAL')
  const [selected, setSelected] = useState<string[]>(members.map(member => member.userId))
  const [shares, setShares] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<{ expenseId: string; attachment: ExpenseAttachment; url?: string; error?: string } | null>(null)
  const total = useMemo(() => expenses.reduce((sum, expense) => sum + Number(expense.amount), 0), [expenses])

  const openCreate = () => { setEditing(null); setMethod('EQUAL'); setSelected(members.map(member => member.userId)); setShares({}); setFiles([]); setError(''); setDialogOpen(true) }
  const openEdit = (expense: Expense) => {
    setEditing(expense); setMethod(expense.splitMethod); setSelected(expense.shares.map(share => share.userId))
    setShares(Object.fromEntries(expense.shares.map(share => [share.userId, String(expense.splitMethod === 'PERCENTAGE' ? share.percentage ?? '' : share.amount)])))
    setFiles([]); setError(''); setDialogOpen(true)
  }
  const toggleMember = (userId: string) => setSelected(current => current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('')
    const data = new FormData(event.currentTarget)
    const participants = selected.map(userId => ({ userId, ...(method === 'EXACT' ? { amount: Number(shares[userId] || 0) } : {}), ...(method === 'PERCENTAGE' ? { percentage: Number(shares[userId] || 0) } : {}) }))
    setSaving(true)
    try {
      const saved = await onSave({ title: String(data.get('title')), amount: Number(data.get('amount')), expenseDate: String(data.get('date')), paidById: String(data.get('paidById')), splitMethod: method, note: String(data.get('note')), participants }, editing?.id)
      setEditing(saved)
      if (files.length) await onUploadAttachments(saved.id, files)
      setDialogOpen(false)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'We could not save this expense.') }
    finally { setSaving(false) }
  }
  const chooseFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const selectedFiles = Array.from(incoming)
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    const invalid = selectedFiles.find(file => !allowed.includes(file.type) || file.size > 10 * 1024 * 1024)
    if (invalid) { setError('Documents must be JPG, PNG, WebP, or PDF files no larger than 10 MB.'); return }
    if (files.length + selectedFiles.length > 5) { setError('Upload at most five documents at a time.'); return }
    setFiles(current => [...current, ...selectedFiles]); setError('')
  }
  const showAttachment = async (expenseId: string, attachment: ExpenseAttachment) => {
    setPreview({ expenseId, attachment })
    try { const blob = await onFetchAttachment(expenseId, attachment.id); setPreview(current => current ? { ...current, url: URL.createObjectURL(blob) } : null) }
    catch (reason) { setPreview(current => current ? { ...current, error: reason instanceof Error ? reason.message : 'We could not open this document.' } : null) }
  }
  const closePreview = () => { if (preview?.url) URL.revokeObjectURL(preview.url); setPreview(null) }
  const downloadAttachment = async () => {
    if (!preview) return
    try { const blob = await onFetchAttachment(preview.expenseId, preview.attachment.id, true); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = preview.attachment.originalName; link.click(); URL.revokeObjectURL(url) }
    catch (reason) { setPreview(current => current ? { ...current, error: reason instanceof Error ? reason.message : 'We could not download this document.' } : null) }
  }
  const removeAttachment = async (expenseId: string, attachment: ExpenseAttachment) => {
    if (!window.confirm(`Delete “${attachment.originalName}”?`)) return
    try { await onDeleteAttachment(expenseId, attachment.id); setEditing(current => current ? { ...current, attachments: (current.attachments ?? []).filter(item => item.id !== attachment.id) } : current); if (preview?.attachment.id === attachment.id) closePreview() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'We could not delete this document.') }
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
        <div className="expense-main"><div><h3>{expense.title}</h3><span>{prettyDate(expense.expenseDate)} · paid by {expense.paidByName}</span>{(expense.attachments ?? []).length > 0 && <button className="expense-attachment-count" type="button" onClick={() => void showAttachment(expense.id, expense.attachments[0])}>⌕ {expense.attachments.length} {expense.attachments.length === 1 ? 'document' : 'documents'}</button>}</div><div><strong>{money(Number(expense.amount), trip.defaultCurrency)}</strong><small>{expense.splitMethod.toLowerCase()}</small></div></div>
        <div className="expense-shares">{expense.shares.map(share => <span key={share.userId}>{share.displayName.split(' ')[0]} <b>{money(Number(share.amount), trip.defaultCurrency)}</b></span>)}</div>
        <button className="expense-edit" type="button" aria-label={`Edit ${expense.title}`} onClick={() => openEdit(expense)}>Edit</button>
      </article>)}</div>
    </section>

    {dialogOpen && <div className="dialog-backdrop" role="presentation"><section className="expense-dialog" role="dialog" aria-modal="true" aria-labelledby="expense-dialog-title"><button className="dialog-close" type="button" aria-label="Close" onClick={() => setDialogOpen(false)}>×</button><p>{editing ? 'UPDATE THE LEDGER' : 'A NEW SHARED COST'}</p><h2 id="expense-dialog-title">{editing ? 'Change the expense.' : 'Who picked up the tab?'}</h2><form onSubmit={submit}>
      <div className="expense-form-top"><label>What was it for?<input name="title" required maxLength={120} defaultValue={editing?.title} placeholder="Dinner by the harbour" /></label><label>Amount<input name="amount" type="number" min="0.01" step="0.01" required defaultValue={editing?.amount} placeholder="0.00" /></label></div>
      <div className="expense-form-top"><label>Paid by<select name="paidById" defaultValue={editing?.paidById ?? members[0]?.userId}>{members.map(member => <option key={member.userId} value={member.userId}>{member.displayName}</option>)}</select></label><label>Date<input name="date" type="date" min={trip.startDate} max={trip.endDate} required defaultValue={editing?.expenseDate ?? trip.startDate} /></label></div>
      <fieldset><legend>How should it be split?</legend><div className="split-methods">{methods.map(option => <button type="button" key={option.value} className={method === option.value ? 'active' : ''} onClick={() => setMethod(option.value)}><strong>{option.label}</strong><span>{option.copy}</span></button>)}</div></fieldset>
      <fieldset><legend>Included travellers</legend><div className="participant-list">{members.map(member => <div className={selected.includes(member.userId) ? 'selected' : ''} key={member.userId}><button type="button" aria-label={`Include ${member.displayName}`} onClick={() => toggleMember(member.userId)}><i>{selected.includes(member.userId) ? '✓' : ''}</i><span>{member.displayName}</span></button>{selected.includes(member.userId) && method !== 'EQUAL' && <label><input aria-label={`${method === 'EXACT' ? 'Amount' : 'Percentage'} for ${member.displayName}`} type="number" min="0.01" step="0.01" value={shares[member.userId] ?? ''} onChange={event => setShares(current => ({ ...current, [member.userId]: event.target.value }))} /><b>{method === 'EXACT' ? trip.defaultCurrency : '%'}</b></label>}</div>)}</div></fieldset>
      <label>Note <span>optional</span><textarea name="note" maxLength={500} defaultValue={editing?.note ?? ''} placeholder="Anything the crew should remember?" /></label>
      <fieldset className="expense-documents"><legend>Receipts or invoices <span>optional · JPG, PNG, WebP or PDF · max 10 MB</span></legend><label className="document-drop" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); chooseFiles(event.dataTransfer.files) }}><input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" onChange={event => chooseFiles(event.target.files)} /><b>＋</b><span>Drop documents here or browse</span></label>{files.length > 0 && <div className="pending-documents">{files.map((file, index) => <span key={`${file.name}-${index}`}>⌕ {file.name}<button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles(current => current.filter((_, itemIndex) => itemIndex !== index))}>×</button></span>)}</div>}{editing && (editing.attachments ?? []).length > 0 && <div className="saved-documents">{editing.attachments.map(attachment => <div key={attachment.id}><button type="button" onClick={() => void showAttachment(editing.id, attachment)}>⌕ <span>{attachment.originalName}</span></button><button type="button" aria-label={`Delete ${attachment.originalName}`} onClick={() => void removeAttachment(editing.id, attachment)}>×</button></div>)}</div>}</fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="expense-dialog-actions">{editing && <button className="delete-expense" type="button" disabled={saving} onClick={() => void remove()}>Delete expense</button>}<button className="activity-submit" type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes →' : 'Add expense →'}</button></div>
    </form></section></div>}
    {preview && <div className="dialog-backdrop"><section className="attachment-preview" role="dialog" aria-modal="true" aria-label={preview.attachment.originalName}><button className="dialog-close" type="button" aria-label="Close document" onClick={closePreview}>×</button><header><div><p>EXPENSE DOCUMENT</p><h2>{preview.attachment.originalName}</h2><span>{(preview.attachment.sizeBytes / 1024).toFixed(1)} KB · uploaded by {preview.attachment.uploadedByName}</span></div><button type="button" onClick={() => void downloadAttachment()}>Download ↓</button></header>{preview.error ? <p className="form-error" role="alert">{preview.error}</p> : !preview.url ? <div className="attachment-loading">Opening document...</div> : preview.attachment.contentType === 'application/pdf' ? <iframe title={preview.attachment.originalName} src={preview.url} /> : <img src={preview.url} alt={preview.attachment.originalName} />}</section></div>}
  </div>
}
