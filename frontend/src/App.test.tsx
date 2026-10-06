import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'

beforeEach(() => vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false })))
afterEach(() => { cleanup(); window.history.replaceState({}, '', '/'); vi.unstubAllGlobals() })

describe('App', () => {
  it('renders the registration experience', async () => {
    render(<App />)

    expect((await screen.findAllByText('SplitTrip')).length).toBeGreaterThan(0)
    expect(await screen.findByRole('heading', { name: 'Join your travel crew.' })).toBeDefined()
  })

  it('switches to sign in mode', async () => {
    render(<App />)

    fireEvent.click(await screen.findByRole('tab', { name: 'Log in' }))

    expect(screen.getByRole('heading', { name: 'Pick up where you left off.' })).toBeDefined()
    expect(screen.queryByLabelText('Your name')).toBeNull()
  })

  it('shows only future trips on the dashboard in nearest-first order', async () => {
    const trip = (id: string, title: string, startDate: string, endDate: string) => ({ id, ownerId: 'user-1', title, destination: 'Türkiye', description: null, startDate, endDate, defaultCurrency: 'TRY', status: 'ACTIVE', currentUserRole: 'OWNER', createdAt: '2026-01-01T00:00:00Z' })
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: 'token' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'user-1', displayName: 'Burak', email: 'burak@example.com', createdAt: '2026-01-01T00:00:00Z' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [
        trip('later', 'Later Journey', '2099-08-10', '2099-08-15'),
        trip('past', 'Past Journey', '2000-05-01', '2000-05-05'),
        trip('nearest', 'Nearest Journey', '2098-03-10', '2098-03-14'),
      ] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ total: 7, completed: 4, overdue: 2, assignedToCurrentUser: 3 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ total: 3, completed: 3, overdue: 0, assignedToCurrentUser: 1 }) }))

    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Nearest Journey' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Later Journey' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Past Journey' })).toBeNull()
    expect(screen.getByRole('heading', { name: '4 of 7 completed' })).toBeDefined()
    expect(screen.getByText('2 tasks need attention')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Next trip' }))
    expect(screen.getByRole('heading', { name: 'Later Journey' })).toBeDefined()
    expect(await screen.findByRole('heading', { name: '3 of 3 completed' })).toBeDefined()

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('button', { name: /Trips/ }))
    fireEvent.click(screen.getByRole('tab', { name: /Past/ }))

    expect(screen.getByRole('heading', { name: 'Past Journey' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Nearest Journey' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Later Journey' })).toBeNull()
  })

  it('restores a session and renders real trips', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: 'token' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'user-1', displayName: 'Burak Yurduseven', email: 'burak@example.com', createdAt: '2026-10-02T00:00:00Z' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ([{ id: 'trip-1', ownerId: 'user-1', title: 'Aegean Summer', destination: 'Kaş, Türkiye', description: null, startDate: '2027-07-12', endDate: '2027-07-18', defaultCurrency: 'TRY', status: 'ACTIVE', currentUserRole: 'OWNER', createdAt: '2026-10-02T00:00:00Z' }]) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ total: 0, completed: 0, overdue: 0, assignedToCurrentUser: 0 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'trip-1', ownerId: 'user-1', title: 'Aegean Summer', destination: 'Kaş, Türkiye', description: null, startDate: '2027-07-12', endDate: '2027-07-18', defaultCurrency: 'TRY', status: 'ACTIVE', currentUserRole: 'OWNER', createdAt: '2026-10-02T00:00:00Z' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ([{ userId: 'user-1', displayName: 'Burak Yurduseven', email: 'burak@example.com', role: 'OWNER', joinedAt: '2026-10-02T00:00:00Z' }]) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ totalSpent: 0, members: [], suggestedTransfers: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'trip-1', ownerId: 'user-1', title: 'Aegean Autumn', destination: 'Kaş, Türkiye', description: null, startDate: '2027-07-12', endDate: '2027-07-18', defaultCurrency: 'TRY', status: 'ACTIVE', currentUserRole: 'OWNER', createdAt: '2026-10-02T00:00:00Z' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'secure-invite-token', expiresAt: '2026-10-09T00:00:00Z' }) }))

    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Good morning, Burak.' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Aegean Summer' })).toBeDefined()

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('button', { name: /Trips/ }))
    expect(screen.getByRole('heading', { name: 'Your trips' })).toBeDefined()
    expect(screen.getByRole('tab', { name: /Upcoming/ })).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Open Aegean Summer' }))
    expect(await screen.findByText('YOUR TRIP')).toBeDefined()
    expect(window.location.pathname).toBe('/trips/trip-1')

    fireEvent.click(screen.getByRole('button', { name: 'Edit trip' }))
    const editDialog = screen.getByRole('dialog', { name: 'Shape the journey.' })
    fireEvent.change(within(editDialog).getByLabelText('Trip name'), { target: { value: 'Aegean Autumn' } })
    fireEvent.click(within(editDialog).getByRole('button', { name: /Save changes/ }))
    expect(await screen.findByRole('heading', { name: 'Aegean Autumn' })).toBeDefined()

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('button', { name: /Itinerary/ }))
    expect(screen.getByRole('heading', { name: 'Idea pool' })).toBeDefined()

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('button', { name: /Checklist/ }))
    expect(screen.getByRole('heading', { name: 'Trip checklist' })).toBeDefined()

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('button', { name: /Expenses/ }))
    expect(screen.getByRole('heading', { name: 'Money on the move' })).toBeDefined()

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('button', { name: /Balances/ }))
    expect(screen.getByRole('heading', { name: 'Where everyone stands' })).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Invite people ＋' }))
    expect(await screen.findByDisplayValue('http://localhost:3000/invitations/secure-invite-token')).toBeDefined()
  })

  it('refreshes an expired access token and retries trip creation', async () => {
    const createdTrip = { id: 'trip-2', ownerId: 'user-1', title: 'Balkan Escape', destination: 'Üsküp', description: '', startDate: '2026-10-29', endDate: '2026-11-01', defaultCurrency: 'TRY', status: 'ACTIVE', currentUserRole: 'OWNER', createdAt: '2026-10-02T00:00:00Z' }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: 'expired-token' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'user-1', displayName: 'Burak', email: 'burak@example.com', createdAt: '2026-10-02T00:00:00Z' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => { throw new Error('empty body') } })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: 'fresh-token' }) })
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => createdTrip })
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)
    fireEvent.click((await screen.findAllByRole('button', { name: /Create trip/ }))[0])

    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Trip name'), { target: { value: 'Balkan Escape' } })
    fireEvent.change(within(dialog).getByLabelText('Destination'), { target: { value: 'Üsküp' } })
    fireEvent.change(within(dialog).getByLabelText('Starts'), { target: { value: '2026-10-29' } })
    fireEvent.change(within(dialog).getByLabelText('Ends'), { target: { value: '2026-11-01' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /Create trip/ }))

    expect(await screen.findByRole('heading', { name: 'Balkan Escape' })).toBeDefined()
    const retryHeaders = fetchMock.mock.calls[5][1]?.headers as Headers
    expect(retryHeaders.get('Authorization')).toBe('Bearer fresh-token')
  })

  it('shows a recoverable error when trip details cannot be loaded', async () => {
    const trip = { id: 'trip-1', ownerId: 'user-1', title: 'Aegean Summer', destination: 'Kaş, Türkiye', description: null, startDate: '2027-07-12', endDate: '2027-07-18', defaultCurrency: 'TRY', status: 'ACTIVE', currentUserRole: 'OWNER', createdAt: '2026-10-02T00:00:00Z' }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: 'token' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'user-1', displayName: 'Burak', email: 'burak@example.com', createdAt: '2026-10-02T00:00:00Z' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [trip] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ total: 0, completed: 0, overdue: 0, assignedToCurrentUser: 0 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => trip })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ totalSpent: 0, members: [], suggestedTransfers: [] }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ detail: 'Settlement history is temporarily unavailable.' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] }))

    render(<App />)
    fireEvent.click(within(await screen.findByRole('navigation', { name: 'Main navigation' })).getByRole('button', { name: /Trips/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Open Aegean Summer' }))

    expect(await screen.findByRole('heading', { name: 'We hit a detour.' })).toBeDefined()
    expect(screen.getByText('Settlement history is temporarily unavailable.')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeDefined()
  })
})
