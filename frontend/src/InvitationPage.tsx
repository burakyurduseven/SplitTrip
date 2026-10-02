import type { InvitationPreview } from './types'

type Props = {
  invitation: InvitationPreview
  userName: string
  joining: boolean
  error: string
  onAccept: () => Promise<void>
  onCancel: () => void
}

export function InvitationPage({ invitation, userName, joining, error, onAccept, onCancel }: Props) {
  return <main className="invitation-page"><section className="invitation-card"><div className="invitation-art" aria-hidden="true"><span>✦</span><i /><i /><svg viewBox="0 0 600 160"><path d="M-20 120C91 29 185 168 290 75s198-15 335 61" /></svg></div><div className="invitation-copy"><p>YOU’RE INVITED</p><h1>{invitation.tripTitle}</h1><span>⌖ {invitation.destination}</span><blockquote>Trips are better when the right people come along.</blockquote><div className="invitation-user"><span>{userName[0]}</span><div><small>JOINING AS</small><strong>{userName}</strong></div></div>{error && <p className="form-error" role="alert"><span>!</span>{error}</p>}<footer><button type="button" onClick={onCancel}>Not now</button><button type="button" disabled={joining} onClick={() => void onAccept()}>{joining ? 'Joining trip...' : 'Join this trip →'}</button></footer></div></section></main>
}
