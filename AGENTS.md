# Engineering Guidelines for Agents

This file is the default instruction set for every change in this repository. Apply it together with the nearest more-specific `AGENTS.md`, if one is added later. Preserve existing behavior unless the task explicitly requires a change.

## Before changing code

1. Read the relevant README and documentation under `docs/` before modifying a subsystem.
2. Inspect neighboring files and follow the conventions of the package being changed. The storefront and CMS intentionally have separate dependencies, TypeScript configurations, lint rules, and formatting styles.
3. Check `git status` and preserve unrelated or pre-existing work. Do not rewrite, delete, or revert changes outside the task.
4. Define the smallest coherent change that satisfies the request. Avoid opportunistic refactors, dependency upgrades, or repository-wide formatting.

## Repository architecture

The repository contains two applications:

- The root application is the localized Next.js storefront.
- `apps/cms` is the Payload CMS and ecommerce backend.

Keep their runtime code and dependencies separate. A storefront dependency belongs in the root `package.json`; a CMS-only dependency belongs in `apps/cms/package.json`.

### Storefront layers

Use these boundaries when adding or changing storefront code:

1. `src/app` is the routing and composition layer. Route files should parse framework inputs, invoke feature or domain APIs, and assemble views. Do not place reusable business logic in pages, layouts, or route handlers.
2. `src/features/<feature>` owns feature workflows, feature-specific components, and feature-facing APIs. A feature may depend on shared components and `src/lib`, but shared code must not depend on a feature.
3. `src/components` contains reusable, domain-light presentation primitives. Keep business rules, provider calls, and route-specific data loading out of shared components.
4. `src/lib` contains integrations and domain services. External SDKs and wire formats stay behind this boundary.
5. `src/types` contains shared domain contracts. Prefer domain models over leaking provider response shapes through the application.
6. `src/config`, `src/i18n`, `messages`, and `src/styles` own application configuration, localization, and design tokens respectively.

Dependencies should flow inward:

```text
app routes -> features -> domain services/provider interfaces -> provider adapters
                  |                    |
                  v                    v
          shared components       shared domain types
```

Do not introduce imports in the opposite direction. If two features need the same behavior, extract a genuinely shared component or domain service rather than importing one feature from another.

### Provider and integration pattern

- Storefront feature code must access commerce through `@/lib/commerce`, never through Shopify, Payload, or another vendor SDK directly.
- Checkout flows must access payments through `@/lib/checkout`, never call Mercado Pago or commerce-native checkout directly from UI code.
- New providers implement the existing provider contract and perform all transport-to-domain mapping inside their provider directory.
- Keep credentials, provider configuration, request construction, and raw response handling in the adapter layer.
- Normalize provider errors at the boundary. User-facing components should receive predictable domain results, not vendor error objects.
- CMS content access belongs behind `@/lib/cms`; do not scatter CMS fetch calls across route components.

### Server and client components

- Prefer Server Components and server-side data loading. Add `"use client"` only when browser APIs, local interactive state, effects, or event handlers require it.
- Keep client boundaries narrow. Pass serializable, minimal props from server components instead of moving an entire page to the client.
- Never import server-only modules, secrets, privileged SDKs, or database code into client components.
- Route handlers validate untrusted input, enforce authorization where applicable, and return intentional status codes and stable response shapes.
- Run independent remote calls concurrently when their ordering does not matter.

### CMS patterns

- Keep Payload collections, globals, fields, hooks, access rules, and migrations in their corresponding `apps/cms/src` directories.
- Treat access control as server-side policy. UI visibility is not authorization.
- Preserve localization behavior (`en` and `es`, with the configured fallback) when changing CMS schemas or content mapping.
- `apps/cms/src/payload-types.ts` and the Payload admin import map are generated artifacts. Do not hand-edit them; use the CMS generation scripts after schema changes.
- Schema changes that affect persisted data require an explicit migration and a rollback/data-compatibility assessment.

## Coding standards

### TypeScript and React

- Keep TypeScript strict. Do not use `any`, non-null assertions, or type suppression comments unless the reason is unavoidable and documented beside the exception.
- Validate data at trust boundaries; a type assertion does not validate runtime input.
- Prefer small, explicit types and discriminated unions over boolean combinations and loosely shaped objects.
- Use `import type` for type-only imports and the configured `@/` alias for storefront imports across directories.
- Keep components focused. Extract logic when a component mixes data access, business rules, and substantial rendering.
- Derive values during rendering when possible. Do not use effects to synchronize state that can be computed from props or existing state.
- Preserve accessibility: semantic elements, associated labels, keyboard support, visible focus, sensible heading order, and descriptive alternative text.
- Use the existing design tokens and UI primitives before adding one-off colors, spacing, typography, or controls.

### Design system and single sources of truth

Treat the existing design system as application architecture, not optional styling guidance. A visual or interaction pattern must have one authoritative definition and all consumers must reuse it.

- `src/styles/tokens.css` is the source of truth for brand colors, semantic colors, radii, shared dimensions, and other global CSS values. Do not redefine those values in components, feature styles, route styles, or configuration files.
- `src/styles/globals.css` maps tokens into Tailwind theme utilities and owns only truly global element behavior. Prefer the canonical semantic utilities: `bg-background-primary` and `bg-background-secondary` for page sections; `bg-card` and `hover:bg-card-hover` for cards; `text-text-black`, `text-text-primary`, `text-text-secondary`, `text-text-highlight`, and `text-text-accent` for copy hierarchy. Use `border-border` for shared borders. Do not introduce raw hex, RGB, HSL, or duplicated CSS variables in components.
- Global typography families must be loaded once in `src/app/layout.tsx` and exposed through named font tokens in `src/styles/globals.css`. Components use the corresponding utility; they must not import fonts independently or repeat font-family stacks inline.
- Jost is the canonical sans-serif family: use weight 300 for body copy and general interface labels, and weight 700 for sans-serif titles and buttons. Georgia remains the editorial serif at weight 400, while Marcellus remains reserved for the mobile navigation pattern.
- `src/components/ui` is the source of truth for reusable controls and interaction primitives. Extend an existing component with a typed prop or variant when the requested behavior belongs to the same primitive; do not create a visually similar button, input, modal, drawer, tab, badge, or accordion in a feature directory.
- `src/components/typography`, `src/components/layout`, and `src/components/cards` own their respective reusable patterns. Compose these components before introducing new wrappers with duplicated markup and classes.
- `src/app/ui-system` is the visual reference for supported tokens and reusable components. When adding or materially changing a shared token, component, state, or variant, update its UI-system example in the same change.
- Shared application configuration, including navigation destinations and external-site URLs, belongs in the relevant module under `src/config`. Components consume configuration; they do not embed their own copy.
- Before creating a component or style, search for an existing equivalent and inspect its supported variants. If a new abstraction is needed, place it at the narrowest shared layer that owns the pattern and migrate all in-scope duplicates to it.
- Do not create multiple components with different names for the same visual role. Prefer one canonical component with explicit, constrained variants. Variants should express product intent such as `primary`, `secondary`, or `danger`, not isolated page names.
- Avoid arbitrary Tailwind values such as `text-[...]`, `tracking-[...]`, and custom color expressions when an existing theme value fits. If an exact brand value is intentional and reusable, define a named token or documented component variant instead of copying the arbitrary value between call sites.
- Keep state styling complete and consistent: default, hover, focus-visible, active, disabled, loading, validation/error, and responsive behavior should come from the canonical component whenever applicable.
- Do not duplicate constants between TypeScript, CSS, CMS configuration, and documentation. Select one runtime source of truth and have other layers consume it when technically possible; when separate applications require mirrored values, document the relationship and update every mirror atomically.
- Any deliberate exception must include a nearby comment explaining why the existing token or component cannot represent the requirement and whether the exception should later become a shared pattern.

### Naming and organization

- Name functions and variables for the domain intent, not the implementation mechanism.
- React components and their files use `PascalCase`; utilities and non-component modules use the convention already established in their directory.
- Boolean names should read as predicates, such as `isConfigured`, `hasNextPage`, or `canCheckout`.
- Keep public exports deliberate. Use a feature or library `index.ts` as its public boundary and avoid broad barrel exports that create cycles.
- Prefer pure functions for mapping, parsing, formatting, and validation.

### Error handling and observability

- Fail explicitly at system boundaries. Do not silently swallow errors or return ambiguous empty data unless an empty state is part of the documented contract.
- Preserve the original error as a cause when wrapping it, while ensuring secrets and personal data never reach client responses or logs.
- User-facing failures should be actionable and localized. Operational logs should include useful context without credentials, tokens, payment details, or full personal records.
- Define timeout, retry, and idempotency behavior deliberately for network calls and payment/webhook flows. Do not retry non-idempotent operations blindly.

### Localization

- All customer-visible storefront copy must use `next-intl`; do not hard-code English or Spanish text in reusable storefront components.
- Add corresponding keys to both `messages/en.json` and `messages/es.json` in the same change.
- Preserve the locale in internal links and pass it through commerce/CMS queries where localized content is expected.
- Format money, dates, and numbers with locale-aware utilities. Do not assemble currency strings manually.

### Security and configuration

- Never commit credentials or real customer data. Document new variables in the relevant `.env.example` and deployment documentation.
- Only variables intentionally safe for the browser may use the `NEXT_PUBLIC_` prefix.
- Store authentication secrets, OAuth client secrets, signing/encryption keys, database credentials, and provider tokens only in environment variables or the deployment platform's secret manager. Never place real values in source code, fixtures, examples, generated assets, browser storage, or build arguments.
- `.env.example` files must contain descriptive placeholders, never working credentials. Local secret files such as `.env`, `.env.local`, certificates, and private keys must remain ignored by Git.
- Access secrets only from server-only modules. Keep secret-reading modules out of client-component dependency graphs and fail startup or the affected server operation with a clear configuration error when a required secret is absent.
- Assume any `NEXT_PUBLIC_` value and any value included in a client bundle, rendered HTML, source map, URL, or API response is publicly visible. Public identifiers are acceptable only when the provider explicitly classifies them as publishable.
- Treat route parameters, query strings, headers, webhooks, CMS content, and provider responses as untrusted input.
- Perform authentication and authorization on the server for every protected action and resource. Authentication establishes identity; authorization must separately verify that the identity may perform the requested operation or access the requested record.
- Default protected resources to denied. Prevent insecure direct object references by scoping database/provider queries to the authorized user, tenant, or role instead of trusting an ID supplied by the client.
- Use established authentication libraries and provider SDKs. Do not design custom password hashing, token formats, session encryption, or cryptographic protocols.
- Passwords must be processed only by the selected authentication system and stored with its approved adaptive password hash. Never log, return, cache, or store plaintext passwords or password-equivalent recovery codes.
- Prefer server-managed sessions in `HttpOnly`, `Secure`, and appropriate `SameSite` cookies. Do not store session tokens, refresh tokens, or other bearer credentials in `localStorage`, `sessionStorage`, client-readable cookies, or URL parameters.
- Rotate the session identifier after login and privilege changes. Enforce expiration and invalidate sessions on logout, password reset, account disablement, and other security-sensitive changes.
- Protect cookie-authenticated state-changing requests against CSRF. Validate OAuth/OIDC `state` and `nonce`, use PKCE where supported, and require exact allowlisted callback and post-login redirect URLs to prevent login CSRF and open redirects.
- Apply rate limiting and abuse controls to login, signup, password reset, verification, MFA, and token endpoints. Use generic responses where account-specific detail would enable user enumeration.
- Recovery and verification tokens must be random, short-lived, single-use, stored in a non-reversible form when feasible, and invalidated after use. Do not put credentials or sensitive personal data in JWT claims because JWT contents are usually readable.
- Request the minimum OAuth scopes and application permissions required. Document key ownership and rotation expectations, and support rotation without requiring source changes.
- Verify webhook signatures before processing events. Make webhook and checkout side effects idempotent.
- Avoid rendering unsanitized HTML. Keep rich-text rendering restricted to the supported CMS node mapping.
- Do not weaken access checks, CORS, CSRF, or validation to make a failing flow pass.
- Redact authorization headers, cookies, tokens, secrets, password fields, payment data, and sensitive personal data from logs, errors, analytics, traces, and monitoring metadata. Do not send authentication failures containing internals or stack traces to clients.
- Before completing authentication work, test anonymous access, wrong-user/wrong-role access, expired or revoked sessions, CSRF and redirect validation, logout invalidation, missing configuration, and confirm that production builds and logs do not expose secrets.

## Testing and verification

Test behavior at the narrowest useful layer and include regression coverage when fixing a bug. Prefer tests that assert public behavior over implementation details. Mock at external boundaries, not inside the unit under test.

Run checks proportional to the files changed:

- Storefront lint: `npm run lint`
- Storefront production build/type validation: `npm run build`
- CMS lint: `npm run lint:cms`
- CMS production build/type validation: `npm run build:cms`
- Formatting check for touched files: `npx prettier --check <files>`

When a relevant automated test suite exists, run it. For customer-facing UI changes, also verify the affected route at representative desktop and mobile widths, both locales, loading/empty/error states, and keyboard interaction. For integration changes, exercise configured and unconfigured behavior without using production credentials.

If a check cannot run because a service, credential, or environment dependency is unavailable, report that plainly. Do not claim a check passed when it was skipped.

## Documentation and generated artifacts

- Update documentation when changing setup, environment variables, architecture, operational procedures, provider behavior, or editor workflows.
- Comments should explain constraints and decisions, not restate the code. Remove stale comments as behavior changes.
- Do not hand-edit generated files, lockfiles, or snapshots except through their generating tool. Commit a lockfile change only when dependencies changed intentionally.
- Keep API and schema changes backward-compatible unless the task explicitly authorizes a breaking change; document migration steps when compatibility cannot be preserved.

## Agent completion checklist

Before declaring work complete:

1. Re-read the diff for correctness, scope, accidental formatting, secrets, debug code, and unrelated changes.
2. Confirm architectural boundaries and localization requirements are preserved.
3. Run the relevant lint, type/build, formatting, and test checks.
4. Verify the changed behavior, including at least one failure or edge case when applicable.
5. Summarize what changed, list the checks actually run, and disclose remaining risks or skipped verification.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
