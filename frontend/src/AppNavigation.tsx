export type AppPage = 'home' | 'trips'

type Props = {
  activePage: AppPage
  onNavigate: (page: AppPage) => void
  onCreateTrip: () => void
  onLogout: () => Promise<void>
}

const items: Array<{ label: string; icon: string; page?: AppPage }> = [
  { label: 'Home', icon: '⌂', page: 'home' as const },
  { label: 'Trips', icon: '▢', page: 'trips' as const },
  { label: 'Itinerary', icon: '⌁' },
  { label: 'Expenses', icon: '▤' },
  { label: 'Balances', icon: '▥' },
]

export function AppNavigation({ activePage, onNavigate, onCreateTrip, onLogout }: Props) {
  return (
    <>
      <aside className="side-nav">
        <button className="dashboard-brand" type="button" onClick={() => onNavigate('home')}><span className="brand-symbol">S</span><strong>SplitTrip</strong></button>
        <nav aria-label="Main navigation">
          {items.map(item => (
            <button key={item.label} className={item.page === activePage ? 'active' : ''} type="button" onClick={() => item.page && onNavigate(item.page)}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="side-note"><span>✦</span><p>Better trips.<br />Together.</p></div>
        <button className="logout-button" type="button" onClick={() => void onLogout()}>Log out <span>↗</span></button>
      </aside>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <button type="button" className={activePage === 'trips' ? 'active' : ''} onClick={() => onNavigate('trips')}><span>T</span><small>Trips</small></button>
        <button type="button"><span>I</span><small>Itinerary</small></button>
        <button type="button" className="mobile-create" onClick={onCreateTrip}><span>+</span><small>Create</small></button>
        <button type="button"><span>E</span><small>Expenses</small></button>
        <button type="button"><span>B</span><small>Balances</small></button>
      </nav>
    </>
  )
}
