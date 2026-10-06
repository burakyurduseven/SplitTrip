import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TripMatch } from './TripMatch'
import type { ActivityIdea, ActivityVoteValue } from './types'

afterEach(cleanup)

const boatTour: ActivityIdea = {
  id: 'idea-1', createdById: 'user-1', createdByName: 'Ada', title: 'Boat tour', description: 'Catch the sunset',
  location: 'Old harbour', estimatedDurationMinutes: 120, status: 'PROPOSED', likes: 0, maybes: 0,
  dislikes: 0, voteCount: 0, memberCount: 1, score: 0, perfectMatch: false, currentUserVote: null,
  createdAt: '2026-10-01T00:00:00Z',
}

function MatchHarness({ vote }: { vote: (value: ActivityVoteValue) => void }) {
  const [ideas, setIdeas] = useState([boatTour])
  return <TripMatch ideas={ideas} onClose={() => undefined} onSchedule={() => undefined} onVote={async (id, value) => {
    vote(value)
    setIdeas(current => current.map(idea => idea.id === id ? {
      ...idea, currentUserVote: value, likes: value === 'LIKE' ? 1 : 0, maybes: value === 'MAYBE' ? 1 : 0,
      dislikes: value === 'DISLIKE' ? 1 : 0, voteCount: 1, score: value === 'LIKE' ? 2 : value === 'MAYBE' ? 1 : -1,
      perfectMatch: value === 'LIKE',
    } : idea))
  }} />
}

describe('Trip Match', () => {
  it('records a playful vote and reveals the crew result', async () => {
    const vote = vi.fn()
    render(<MatchHarness vote={vote} />)

    expect(screen.getByRole('heading', { name: 'Choose the adventures.' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Boat tour' })).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: /Love it/ }))

    expect(await screen.findByRole('heading', { name: 'Your crew has 1 match!' })).toBeDefined()
    expect(vote).toHaveBeenCalledWith('LIKE')
    expect(screen.getByText('PERFECT MATCH')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Add to itinerary' })).toBeDefined()
  })
})
