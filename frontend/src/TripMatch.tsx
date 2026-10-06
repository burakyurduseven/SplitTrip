import { useEffect, useMemo, useState } from 'react'

import type { ActivityIdea, ActivityVoteValue } from './types'

type Props = {
  ideas: ActivityIdea[]
  onClose: () => void
  onVote: (ideaId: string, vote: ActivityVoteValue) => Promise<void>
  onSchedule: (idea: ActivityIdea) => void
}

const choiceCopy: Record<ActivityVoteValue, { label: string; icon: string }> = {
  DISLIKE: { label: 'Skip', icon: '←' },
  MAYBE: { label: 'Maybe', icon: '◆' },
  LIKE: { label: 'Love it', icon: '♥' },
}

export function TripMatch({ ideas, onClose, onVote, onSchedule }: Props) {
  const matchIdeas = useMemo(() => ideas.filter(idea => idea.status === 'PROPOSED'), [ideas])
  const initialQueue = useMemo(() => matchIdeas.filter(idea => idea.currentUserVote === null).map(idea => idea.id), [matchIdeas])
  const [queue, setQueue] = useState(initialQueue)
  const [completed, setCompleted] = useState(initialQueue.length === 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [sessionVotes, setSessionVotes] = useState<Record<string, ActivityVoteValue>>({})
  const [dragStart, setDragStart] = useState<number | null>(null)
  const current = matchIdeas.find(idea => idea.id === queue[0])
  const total = initialQueue.length
  const done = total - queue.length

  const results = useMemo(() => [...matchIdeas].sort((left, right) => Number(right.perfectMatch) - Number(left.perfectMatch) || right.score - left.score || right.likes - left.likes), [matchIdeas])
  const perfectMatches = results.filter(idea => idea.perfectMatch)
  const sessionCounts = (['LIKE', 'MAYBE', 'DISLIKE'] as ActivityVoteValue[]).map(value => Object.values(sessionVotes).filter(vote => vote === value).length)

  const choose = async (value: ActivityVoteValue) => {
    if (!current || saving) return
    setSaving(true)
    setError('')
    try {
      await onVote(current.id, value)
      setSessionVotes(previous => ({ ...previous, [current.id]: value }))
      const remaining = queue.slice(1)
      setQueue(remaining)
      if (remaining.length === 0) setCompleted(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your vote could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (completed || saving) return
      if (event.key === 'ArrowLeft') void choose('DISLIKE')
      if (event.key === 'ArrowDown') void choose('MAYBE')
      if (event.key === 'ArrowRight') void choose('LIKE')
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const replay = () => {
    setQueue(matchIdeas.map(idea => idea.id))
    setSessionVotes({})
    setCompleted(matchIdeas.length === 0)
  }

  return <div className="trip-match-backdrop">
    <section className="trip-match" role="dialog" aria-modal="true" aria-labelledby="trip-match-title">
      <button className="match-close" type="button" aria-label="Close Trip Match" onClick={onClose}>×</button>
      {!completed && current && <>
        <header className="match-header"><div><p>TRIP MATCH</p><h2 id="trip-match-title">Choose the adventures.</h2></div><span>{done + 1} / {total}</span></header>
        <div className="match-progress"><i style={{ width: `${total ? done / total * 100 : 0}%` }} /></div>
        <div className="match-deck"><i /><i /><article onPointerDown={event => setDragStart(event.clientX)} onPointerUp={event => { if (dragStart === null) return; const distance = event.clientX - dragStart; setDragStart(null); if (Math.abs(distance) > 70) void choose(distance > 0 ? 'LIKE' : 'DISLIKE') }}>
          <div className="match-postcard"><span>{current.location ? `⌖ ${current.location}` : 'A CREW IDEA'}</span><b>{current.estimatedDurationMinutes} min</b></div>
          <div className="match-card-copy"><small>SUGGESTED BY {current.createdByName.toUpperCase()}</small><h3>{current.title}</h3><p>{current.description || 'Would this make the trip better? You decide.'}</p><div><span>{current.voteCount} of {current.memberCount} voted</span><span>{current.likes} love this</span></div></div>
        </article></div>
        {error && <p className="match-error" role="alert">{error}</p>}
        <div className="match-choices">{(['DISLIKE', 'MAYBE', 'LIKE'] as ActivityVoteValue[]).map(value => <button className={value.toLowerCase()} type="button" disabled={saving} onClick={() => void choose(value)} key={value}><i>{choiceCopy[value].icon}</i><span>{choiceCopy[value].label}</span><small>{value === 'DISLIKE' ? '← key' : value === 'MAYBE' ? '↓ key' : '→ key'}</small></button>)}</div>
      </>}

      {completed && <div className="match-results">
        <header><p>THE VERDICT</p><h2 id="trip-match-title">{perfectMatches.length ? `Your crew has ${perfectMatches.length} ${perfectMatches.length === 1 ? 'match' : 'matches'}!` : 'Your picks are in.'}</h2><span>{matchIdeas.length ? 'See what the group is feeling.' : 'Add some activity ideas to start matching.'}</span></header>
        {total > 0 && <div className="match-session-stats"><span><b>{sessionCounts[0]}</b>Loved</span><span><b>{sessionCounts[1]}</b>Maybe</span><span><b>{sessionCounts[2]}</b>Skipped</span></div>}
        <div className="match-ranking">{results.slice(0, 5).map((idea, index) => <article key={idea.id}><span>{idea.perfectMatch ? '♥' : index + 1}</span><div><small>{idea.perfectMatch ? 'PERFECT MATCH' : 'CREW FAVOURITE'}</small><strong>{idea.title}</strong><p>{idea.likes} love · {idea.maybes} maybe · {idea.voteCount} of {idea.memberCount} voted</p></div><b>{idea.score > 0 ? '+' : ''}{idea.score}</b>{idea.status === 'PROPOSED' && <button type="button" onClick={() => onSchedule(idea)}>Add to itinerary</button>}</article>)}</div>
        <footer><button type="button" onClick={replay} disabled={!matchIdeas.length}>Review all votes</button><button type="button" onClick={onClose}>Back to itinerary →</button></footer>
      </div>}
    </section>
  </div>
}
