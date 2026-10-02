import { useState } from 'react'
import type { BalanceSummary, Settlement, SettlementInput, TransferSuggestion, Trip } from './types'

type Props = {
  trip: Trip
  summary: BalanceSummary | null
  currentUserId: string
  settlements: Settlement[]
  onRecord: (input: SettlementInput) => Promise<void>
  onVoid: (settlementId: string) => Promise<void>
}

const initials = (name: string) => name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()

export function BalanceWorkspace({ trip, summary, currentUserId, settlements, onRecord, onVoid }: Props) {
  const [selected, setSelected] = useState<TransferSuggestion | null>(null)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const money = (amount: number) => new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(amount))
  const current = summary?.members.find(member => member.userId === currentUserId)
  const net = Number(current?.netBalance ?? 0)
  const state = net > 0 ? 'credit' : net < 0 ? 'debt' : 'settled'
  const openPayment = (transfer: TransferSuggestion) => { setSelected(transfer); setAmount(Number(transfer.amount).toFixed(2)); setDate(''); setNote(''); setError('') }
  const recordPayment = async () => {
    if (!selected) return
    setSaving(true); setError('')
    try { await onRecord({ fromUserId: selected.fromUserId, toUserId: selected.toUserId, amount: Number(amount), settlementDate: date, note }); setSelected(null) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'We could not record this payment.') }
    finally { setSaving(false) }
  }

  return (
    <div className="balance-workspace">
      <section className={`balance-spotlight ${state}`}>
        <div className="balance-orbit" aria-hidden="true"><i /><i /><i /></div>
        <p>YOUR POSITION</p>
        <span>{state === 'credit' ? 'You get back' : state === 'debt' ? 'You owe' : 'All settled'}</span>
        <h2>{trip.defaultCurrency} {money(net)}</h2>
        <small>{state === 'credit' ? 'The group owes you.' : state === 'debt' ? 'Suggested payments are ready.' : 'You are even with the group.'}</small>
      </section>

      <section className="balance-board">
        <header>
          <div><p>GROUP LEDGER</p><h2>Where everyone stands</h2></div>
          <span>{trip.defaultCurrency} {money(Number(summary?.totalSpent ?? 0))} spent</span>
        </header>
        <div className="balance-member-grid">
          {(summary?.members ?? []).map(member => {
            const memberNet = Number(member.netBalance)
            return <article key={member.userId} className={memberNet > 0 ? 'positive' : memberNet < 0 ? 'negative' : 'neutral'}>
              <div className="balance-member-head"><span>{initials(member.displayName)}</span><div><strong>{member.displayName}{member.userId === currentUserId ? ' (you)' : ''}</strong><small>{memberNet > 0 ? 'gets back' : memberNet < 0 ? 'owes' : 'settled'}</small></div></div>
              <dl><div><dt>Paid</dt><dd>{trip.defaultCurrency} {money(Number(member.paid))}</dd></div><div><dt>Share</dt><dd>{trip.defaultCurrency} {money(Number(member.owed))}</dd></div></dl>
              <footer><span>NET BALANCE</span><strong>{memberNet > 0 ? '+' : memberNet < 0 ? '−' : ''}{trip.defaultCurrency} {money(memberNet)}</strong></footer>
            </article>
          })}
        </div>

        <section className="settlement-plan">
          <header><div><p>SMART SETTLEMENT</p><h2>Suggested transfers</h2></div><span>{summary?.suggestedTransfers.length ?? 0} payments</span></header>
          {summary?.suggestedTransfers.length ? <div className="transfer-list">
            {summary.suggestedTransfers.map((transfer, index) => <article key={`${transfer.fromUserId}-${transfer.toUserId}-${index}`}>
              <div className="transfer-person"><span>{initials(transfer.fromName)}</span><div><small>FROM</small><strong>{transfer.fromName}</strong></div></div>
              <div className="transfer-route"><i /><b>→</b><i /></div>
              <div className="transfer-person receiver"><span>{initials(transfer.toName)}</span><div><small>TO</small><strong>{transfer.toName}</strong></div></div>
              <div className="transfer-action"><strong className="transfer-amount">{trip.defaultCurrency} {money(Number(transfer.amount))}</strong><button type="button" onClick={() => openPayment(transfer)}>Settle up</button></div>
            </article>)}
          </div> : <div className="settlement-empty"><span>✓</span><div><strong>No payments needed.</strong><small>Everyone is even based on the expenses recorded so far.</small></div></div>}
          <footer>SplitTrip combines the group’s debts into a shorter payment plan. Record full or partial payments as the group settles up.</footer>
        </section>

        <section className="payment-history">
          <header><div><p>PAYMENT HISTORY</p><h2>Recorded payments</h2></div><span>{settlements.filter(item => item.status === 'ACTIVE').length} active</span></header>
          {settlements.length ? <div>{settlements.map(payment => <article key={payment.id} className={payment.status === 'VOIDED' ? 'voided' : ''}>
            <span className="history-mark">{payment.status === 'ACTIVE' ? '✓' : '×'}</span><div><strong>{payment.fromName} paid {payment.toName}</strong><small>{new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(`${payment.settlementDate}T00:00:00`))} · recorded by {payment.createdByName}{payment.note ? ` · ${payment.note}` : ''}</small></div><b>{trip.defaultCurrency} {money(Number(payment.amount))}</b>{payment.status === 'ACTIVE' ? <button type="button" onClick={() => void onVoid(payment.id)}>Void</button> : <em>VOIDED</em>}
          </article>)}</div> : <div className="history-empty">No payments have been recorded yet.</div>}
        </section>
      </section>
      {selected && <div className="dialog-backdrop" role="presentation"><section className="settlement-dialog" role="dialog" aria-modal="true" aria-labelledby="settlement-title"><button className="dialog-close" type="button" aria-label="Close payment" onClick={() => setSelected(null)}>×</button><p>SETTLE UP</p><h2 id="settlement-title">Record a payment.</h2><div className="settlement-people"><span>{initials(selected.fromName)}</span><strong>{selected.fromName}</strong><b>→</b><span>{initials(selected.toName)}</span><strong>{selected.toName}</strong></div><label>Amount<div className="amount-input"><span>{trip.defaultCurrency}</span><input aria-label="Payment amount" type="number" min="0.01" step="0.01" max={selected.amount} value={amount} onChange={event => setAmount(event.target.value)} /></div><small>Full suggestion: {trip.defaultCurrency} {money(Number(selected.amount))}. You can record a partial payment.</small></label><label>Payment date<input aria-label="Payment date" type="date" value={date} onChange={event => setDate(event.target.value)} /></label><label>Note <span>optional</span><textarea aria-label="Payment note" value={note} onChange={event => setNote(event.target.value)} placeholder="Bank transfer, cash..." /></label>{error && <p className="form-error" role="alert"><span>!</span>{error}</p>}<button className="activity-submit" type="button" disabled={saving || !amount || Number(amount) <= 0 || !date} onClick={() => void recordPayment()}>{saving ? 'Recording...' : 'Record payment'}</button></section></div>}
    </div>
  )
}
