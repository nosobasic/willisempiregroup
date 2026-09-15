import { useEffect, useState } from 'react'
import {
  ROADMAP_PROGRESS,
  ROADMAP_URL,
  currentPhase,
} from '../data/roadmapProgress'

export default function RoadmapTimeline() {
  const [progress, setProgress] = useState(ROADMAP_PROGRESS)

  useEffect(() => {
    let cancelled = false

    fetch(`${ROADMAP_URL}/progress.json`, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data?.phases) return
        setProgress({
          ...ROADMAP_PROGRESS,
          ...data,
        })
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  const focus = currentPhase(progress)

  return (
    <div className="roadmap-timeline">
      <p className="roadmap-timeline-status">
        Phase {focus.number} · {focus.shortLabel} · {progress.percent}%
      </p>
      <ol className="roadmap-timeline-track" aria-label="Cloud engineering roadmap phases">
        {progress.phases.map((phase, index) => (
          <li
            key={phase.id}
            className={`roadmap-timeline-step is-${phase.status}`}
          >
            {index > 0 && (
              <span
                className={`roadmap-timeline-connector${
                  progress.phases[index - 1].status === 'complete' ? ' is-complete' : ''
                }`}
                aria-hidden="true"
              />
            )}
            <span className="roadmap-timeline-dot" aria-hidden="true" />
            <span className="roadmap-timeline-label">{phase.shortLabel}</span>
          </li>
        ))}
      </ol>
      <a
        className="roadmap-timeline-link"
        href={ROADMAP_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        {progress.done}/{progress.total} skills published
      </a>
    </div>
  )
}
