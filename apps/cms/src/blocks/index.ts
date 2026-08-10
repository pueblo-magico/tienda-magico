import type { Block } from 'payload'

import { CTA } from './CTA'
import { FAQ } from './FAQ'
import { FeaturedProducts } from './FeaturedProducts'
import { Gallery } from './Gallery'
import { Hero } from './Hero'
import { ImpactStats } from './ImpactStats'
import { InfoSection } from './InfoSection'
import { Newsletter } from './Newsletter'
import { Testimonials } from './Testimonials'

/** Layout blocks available on Pages (and reusable elsewhere). */
export const layoutBlocks: Block[] = [
  Hero,
  CTA,
  InfoSection,
  Gallery,
  Testimonials,
  FAQ,
  Newsletter,
  FeaturedProducts,
  ImpactStats,
]

export {
  CTA,
  FAQ,
  FeaturedProducts,
  Gallery,
  Hero,
  ImpactStats,
  InfoSection,
  Newsletter,
  Testimonials,
}
