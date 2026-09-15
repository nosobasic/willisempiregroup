// Fallback if CloudFront /progress.json cannot be fetched.
// Live card data comes from ROADMAP_URL/progress.json (IAM publish only).

export const ROADMAP_URL = 'https://d2gapjlfb5j1wy.cloudfront.net'

export const ROADMAP_PROGRESS = {
  done: 6,
  total: 30,
  percent: 20,
  currentPhaseId: 'phase-2',
  phases: [
    { id: 'phase-1', number: '01', shortLabel: 'SAA', status: 'complete' },
    { id: 'phase-2', number: '02', shortLabel: 'Terraform', status: 'current' },
    { id: 'phase-3', number: '03', shortLabel: 'CloudOps', status: 'upcoming' },
    { id: 'phase-4', number: '04', shortLabel: 'SAP', status: 'upcoming' },
    { id: 'phase-5', number: '05', shortLabel: 'Security', status: 'upcoming' },
  ],
}

export function currentPhase(progress = ROADMAP_PROGRESS) {
  return (
    progress.phases.find((phase) => phase.id === progress.currentPhaseId) ??
    progress.phases[0]
  )
}
