import { useState } from 'react'
import type { FormEvent } from 'react'

import type { Trip, UpdateTripInput } from './types'

type Props = {
  trip: Trip
  currencyLocked: boolean
  onClose: () => void
  onUpdate: (input: UpdateTripInput) => Promise<void>
}

const formFromTrip = (trip: Trip): UpdateTripInput => ({
  title: trip.title, destination: trip.destination, description: trip.description ?? '',
  startDate: trip.startDate, endDate: trip.endDate, defaultCurrency: trip.defaultCurrency,
})

export function EditTripDialog({ trip, currencyLocked, onClose, onUpdate }: Props) {
  const [form, setForm] = useState(() => formFromTrip(trip))
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (field: keyof UpdateTripInput, value: string) => setForm(current => ({ ...current, [field]: value }))
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('')
    if (form.startDate > form.endDate) { setError('The start date must be before the end date.'); return }
    setSubmitting(true)
    try { await onUpdate(form); onClose() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'We could not update this trip.') }
    finally { setSubmitting(false) }
  }

  return <div className="dialog-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="trip-dialog edit-trip-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-trip-title">
      <div className="dialog-accent" aria-hidden="true"><span>EDIT</span><i /></div>
      <header className="dialog-header"><div><p>CHANGE OF PLANS</p><h2 id="edit-trip-title">Shape the journey.</h2></div><button type="button" className="icon-button" aria-label="Close edit trip form" onClick={onClose}>×</button></header>
      <form className="trip-form" onSubmit={submit}>
        <label className="field"><span>Trip name</span><input value={form.title} onChange={event => update('title', event.target.value)} maxLength={100} required autoFocus /></label>
        <label className="field"><span>Destination</span><input value={form.destination} onChange={event => update('destination', event.target.value)} maxLength={160} required /></label>
        <div className="date-grid"><label className="field"><span>Starts</span><input type="date" value={form.startDate} onChange={event => update('startDate', event.target.value)} required /></label><label className="field"><span>Ends</span><input type="date" value={form.endDate} onChange={event => update('endDate', event.target.value)} required /></label></div>
        <div className="currency-row"><label className="field currency-field"><span>Currency</span><select value={form.defaultCurrency} disabled={currencyLocked} onChange={event => update('defaultCurrency', event.target.value)}><option>TRY</option><option>EUR</option><option>USD</option><option>GBP</option></select>{currencyLocked && <small>Locked because this trip has expenses.</small>}</label><label className="field description-field"><span>A little note <i>optional</i></span><input value={form.description} onChange={event => update('description', event.target.value)} maxLength={1000} /></label></div>
        {error && <p className="form-error" role="alert"><span>!</span>{error}</p>}
        <footer className="dialog-actions"><button type="button" className="text-button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit" disabled={submitting}><span>{submitting ? 'Saving changes...' : 'Save changes'}</span><b>→</b></button></footer>
      </form>
    </section>
  </div>
}
