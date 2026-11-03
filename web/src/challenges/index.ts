import { htmlCssChallenges } from './html-css'
import { jsChallenges } from './js'
import { reactChallenges } from './react'
import type { Category, Challenge } from './types'

export const CATEGORIES: { id: Category; title: string; description: string }[] = [
  {
    id: 'html_css',
    title: 'HTML & CSS',
    description: 'Vom ersten Tag bis zum pixelgenauen Layout – die Grundlage jeder Website.',
  },
  {
    id: 'js',
    title: 'JavaScript',
    description: 'Interaktivität mit dem DOM, Events und Daten aus APIs.',
  },
  {
    id: 'react',
    title: 'React',
    description: 'Komponenten, State und Hooks – moderne Oberflächen bauen.',
  },
]

export const CHALLENGES: Challenge[] = [...htmlCssChallenges, ...jsChallenges, ...reactChallenges]

export function findChallenge(category: string, slug: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.category === category && c.slug === slug)
}

export function challengesOf(category: Category): Challenge[] {
  return CHALLENGES.filter((c) => c.category === category)
}

/** The challenge after `challenge` in the recommended order. */
export function nextChallenge(challenge: Challenge): Challenge | undefined {
  return CHALLENGES[CHALLENGES.indexOf(challenge) + 1]
}
