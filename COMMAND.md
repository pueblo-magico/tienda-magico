# Project Goal

Build a multilingual headless ecommerce platform for Pueblo Mágico.

Tech Stack
Next.js 15
React 19
TypeScript
Tailwind CSS 4
Payload CMS 3
PostgreSQL

Shopify Storefront API

next-intl

Requirements
- Mobile first
- SEO optimized
- Multi language (EN / ES)
- Headless Shopify checkout
- Payload CMS content management
- Component-driven architecture
- Accessible
- High Lighthouse score

Phase 0 — Foundation
Task 0.1

Create project structure.

src/
├── app/
├── components/
├── features/
├── lib/
├── payload/
├── config/
├── styles/
├── hooks/
├── providers/
└── types/

Task 0.2

Setup:

Next.js 15
TypeScript strict
Tailwind 4
ESLint
Prettier

Task 0.3

Create design tokens.

forest
earth
sand
cream
clay


Typography:

Cormorant Garamond
Inter

Phase 1 — Global Layout
Task 1.1

Create:

Header
Footer
Container
Section


Requirements:

sticky navigation
responsive
language switcher
cart button

Task 1.2

Navigation data configuration

src/config/navigation.ts


Navigation:

Shop
Rituals
Journal
Experiences
Impact
About

Task 1.3

Mobile menu drawer.

Requirements:

fullscreen
animated
accessible

Phase 2 — Design System

Create reusable components.

Task 2.1

Buttons

Primary
Secondary
Ghost
Link

Task 2.2

Typography

PageTitle
SectionTitle
Eyebrow
Body
Caption

Task 2.3

Cards

ProductCard
ArticleCard
ImpactCard

Task 2.4

UI Components

Badge
Input
Select
Textarea
Modal
Drawer
Accordion
Tabs

Phase 3 — Localization
Task 3.1

Install:

next-intl

Task 3.2

Create locale structure.

/en
/es

Task 3.3

Create translation dictionaries.

messages/en.json
messages/es.json

Phase 4 — Shopify Integration
Task 4.1

Create Shopify client.

src/lib/shopify

Task 4.2

Implement queries.

Get Products
Get Product
Get Collections
Get Cart
Create Cart
Update Cart

Task 4.3

Strong TypeScript types.

types/shopify.ts

Phase 5 — Cart System
Task 5.1

Cart provider.

CartContext

Task 5.2

Cart drawer.

Features:

open/close
quantity update
remove
subtotal

Task 5.3

Cart page.

/cart

Task 5.4

Checkout button.

Redirect to Shopify checkout URL.

Phase 6 — CMS
Task 6.1

Install Payload CMS.

Task 6.2

Collections.

Pages
Posts
Media
Testimonials
FAQs

Task 6.3

Globals.

Header
Footer
SiteSettings
SEO

Task 6.4

Block Builder.

Create blocks:

Hero
CTA
InfoSection
Gallery
Testimonials
FAQ
Newsletter
FeaturedProducts
ImpactStats

Phase 7 — Homepage

Route:

/


Sections:

Hero
Featured Categories
Best Sellers
Story
Impact
Newsletter


All content CMS-driven.

Phase 8 — Shop Listing

Route:

/shop


Features:

products
filters
sorting
pagination
search

Phase 9 — Product Page

Route:

/shop/[handle]


Sections:

gallery
details
variants
add to cart
story
impact
related products

Phase 10 — Journal

Routes:

/journal
/journal/[slug]


CMS-powered.

Features:

categories
search
SEO
related articles

Phase 11 — Experiences

Routes:

/experiences
/experiences/[slug]


CMS powered landing pages.

Phase 12 — Impact

Route:

/impact


CMS editable.

Sections:

Mission
Tree Planting
Community
Partners
Statistics

Phase 13 — SEO
Implement
Metadata API
OpenGraph
Twitter Cards
Schema.org
Sitemap
Robots

Phase 14 — Performance

Requirements:

SSR where needed
RSC by default
Image optimization
Code splitting
Caching


Targets:

Lighthouse 90+

Phase 15 — Production Readiness
Task 15.1

Error boundaries.

Task 15.2

Not Found pages.

404
500

Task 15.3

Analytics.

Google Analytics
Microsoft Clarity

Task 15.4

Security

security headers
rate limiting
CSP

Final Deliverables
✅ Next.js Application
✅ Payload CMS
✅ Shopify Headless Integration
✅ Cart System
✅ Multilingual
✅ SEO
✅ Responsive Design
✅ CMS Block Builder
✅ Production Deployment Ready
✅ Documentation


The development order should always be:

Foundation
→ Layout
→ Design System
→ Localization
→ CMS
→ Shopify
→ Cart
→ Homepage
→ Shop
→ Product Pages
→ Journal
→ SEO
→ Production Hardening


This minimizes refactoring and keeps the codebase modular and extensible.