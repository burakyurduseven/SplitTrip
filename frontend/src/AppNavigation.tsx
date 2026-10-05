export type AppPage = 'home' | 'trips'
export type TripSection = 'overview' | 'itinerary' | 'expenses' | 'balances' | 'members'

type Props = {
  activePage: AppPage
  onNavigate: (page: AppPage) => void
  onCreateTrip: () => void
  onOpenSection: (section: TripSection) => void
  activeSection?: TripSection
  onLogout: () => Promise<void>
}

const items: Array<{ label: string; icon: string; page?: AppPage; section?: TripSection }> = [
  { label: 'Home', icon: '⌂', page: 'home' as const },
  { label: 'Trips', icon: '▢', page: 'trips' as const },
  { label: 'Itinerary', icon: '⌁', section: 'itinerary' },
  { label: 'Expenses', icon: '▤', section: 'expenses' },
  { label: 'Balances', icon: '▥', section: 'balances' },
]

export function AppNavigation({ activePage, activeSection, onNavigate, onCreateTrip, onOpenSection, onLogout }: Props) {
  return (
    <>
      <aside className="side-nav">
        <button className="dashboard-brand" type="button" onClick={() => onNavigate('home')}><span className="brand-symbol">S</span><strong>SplitTrip</strong></button>
        <nav aria-label="Main navigation">
          {items.map(item => (
            <button key={item.label} className={(item.page === activePage && !activeSection) || item.section === activeSection ? 'active' : ''} type="button" onClick={() => item.page ? onNavigate(item.page) : item.section && onOpenSection(item.section)}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="side-note"><span>✦</span><p>Better trips.<br />Together.</p></div>
        <button className="logout-button" type="button" onClick={() => void onLogout()}>Log out <span>↗</span></button>
      </aside>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <button type="button" className={activePage === 'trips' && !activeSection ? 'active' : ''} onClick={() => onNavigate('trips')}><span>T</span><small>Trips</small></button>
        <button type="button" className={activeSection === 'itinerary' ? 'active' : ''} onClick={() => onOpenSection('itinerary')}><span>I</span><small>Itinerary</small></button>
        <button type="button" className="mobile-create" onClick={onCreateTrip}><span>+</span><small>Create</small></button>
        <button type="button" className={activeSection === 'expenses' ? 'active' : ''} onClick={() => onOpenSection('expenses')}><span>E</span><small>Expenses</small></button>
        <button type="button" className={activeSection === 'balances' ? 'active' : ''} onClick={() => onOpenSection('balances')}><span>B</span><small>Balances</small></button>
      </nav>
    </>
  )
}
