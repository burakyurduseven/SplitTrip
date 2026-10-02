import { useState } from 'react'
import type { FormEvent } from 'react'

import type { CreateTripInput } from './types'

type Props = {
  open: boolean
  onClose: () => void
  onCreate: (input: CreateTripInput) => Promise<void>
}

const initialForm: CreateTripInput = {
  title: '', destination: '', description: '', startDate: '', endDate: '', defaultCurrency: 'TRY',
}

export function CreateTripDialog({ open, onClose, onCreate }: Props) {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      setError('The start date must be before the end date.')
      return
    }
    setSubmitting(true)
    try {
      await onCreate(form)
      setForm(initialForm)
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'We could not create your trip.')
    } finally {
      setSubmitting(false)
    }
  }

  const update = (field: keyof CreateTripInput, value: string) => setForm(current => ({ ...current, [field]: value }))

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="trip-dialog" role="dialog" aria-modal="true" aria-labelledby="create-trip-title">
        <div className="dialog-accent" aria-hidden="true"><span>01</span><i /></div>
        <header className="dialog-header">
          <div><p>NEW ADVENTURE</p><h2 id="create-trip-title">Where to next?</h2></div>
          <button type="button" className="icon-button" aria-label="Close create trip form" onClick={onClose}>×</button>
        </header>
        <form className="trip-form" onSubmit={submit}>
          <label className="field"><span>Trip name</span><input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Aegean Summer" maxLength={100} required autoFocus /></label>
          <label className="field"><span>Destination</span><input value={form.destination} onChange={e => update('destination', e.target.value)} placeholder="Kaş, Türkiye" maxLength={160} required /></label>
          <div className="date-grid">
            <label className="field"><span>Starts</span><input type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} required /></label>
            <label className="field"><span>Ends</span><input type="date" value={form.endDate} onChange={e => update('endDate', e.target.value)} required /></label>
          </div>
          <div className="currency-row">
            <label className="field currency-field"><span>Currency</span><select value={form.defaultCurrency} onChange={e => update('defaultCurrency', e.target.value)}><option>TRY</option><option>EUR</option><option>USD</option><option>GBP</option></select></label>
            <label className="field description-field"><span>A little note <i>optional</i></span><input value={form.description} onChange={e => update('description', e.target.value)} placeholder="Our summer escape" maxLength={1000} /></label>
          </div>
          {error && <p className="form-error" role="alert"><span>!</span>{error}</p>}
          <footer className="dialog-actions"><button type="button" className="text-button" onClick={onClose}>Maybe later</button><button className="primary-button" type="submit" disabled={submitting}><span>{submitting ? 'Creating your trip...' : 'Create trip'}</span><b>→</b></button></footer>
        </form>
      </section>
    </div>
  )
}
