import type { BalanceSummary, Trip } from './types'

type Props = {
  trip: Trip
  summary: BalanceSummary | null
  currentUserId: string
}

const initials = (name: string) => name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()

export function BalanceWorkspace({ trip, summary, currentUserId }: Props) {
  const money = (amount: number) => new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(amount))
  const current = summary?.members.find(member => member.userId === currentUserId)
  const net = Number(current?.netBalance ?? 0)
  const state = net > 0 ? 'credit' : net < 0 ? 'debt' : 'settled'

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
              <strong className="transfer-amount">{trip.defaultCurrency} {money(Number(transfer.amount))}</strong>
            </article>)}
          </div> : <div className="settlement-empty"><span>✓</span><div><strong>No payments needed.</strong><small>Everyone is even based on the expenses recorded so far.</small></div></div>}
          <footer>SplitTrip combines the group’s debts into a shorter payment plan. Payments are suggestions until settlement tracking is added.</footer>
        </section>
      </section>
    </div>
  )
}
