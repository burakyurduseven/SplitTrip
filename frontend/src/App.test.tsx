import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from './App'

afterEach(cleanup)

describe('App', () => {
  it('renders the registration experience', () => {
    render(<App />)

    expect(screen.getAllByText('SplitTrip').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Join your travel crew.' })).toBeDefined()
  })

  it('switches to sign in mode', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('tab', { name: 'Log in' }))

    expect(screen.getByRole('heading', { name: 'Pick up where you left off.' })).toBeDefined()
    expect(screen.queryByLabelText('Your name')).toBeNull()
  })
})
