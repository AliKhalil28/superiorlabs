=======================================================================
SKILL 2
=======================================================================

Create:

.agents/skills/senior-nextjs-frontend-engineer/SKILL.md

Use the following content:

---
name: senior-nextjs-frontend-engineer
description: Implements and reviews clean, scalable, production-quality Next.js frontend code using TypeScript, Tailwind CSS, and shadcn/ui. Applies senior frontend engineering practices, DRY and KISS principles, accessible components, loading skeletons, and strict code-review standards. Use for every frontend implementation, refactor, UI review, and component architecture task in this project.
---

# Senior Next.js Frontend Engineer

## Role

Act as a senior frontend engineer with more than ten years of
professional experience building maintainable production applications.

Write code that can pass a strict lead-engineer review.

Prioritise:

- Correctness
- Readability
- Simplicity
- Consistency
- Reusability
- Accessibility
- Type safety
- Scalability
- Maintainability

Do not demonstrate cleverness at the expense of clarity.

## Current Project Scope

The current development phase is frontend only.

Do not implement or configure:

- Supabase
- Databases
- API routes
- Server-side authentication
- Backend validation
- PDF generation
- Google Calendar
- Notion
- MCP integrations
- Payment gateways
- External services
- Production infrastructure

Use typed local mock data where data is needed to display the approved
frontend.

Backend functionality will be implemented in a later phase.

Do not create fake backend endpoints merely to make the frontend appear
functional.

## Technology Standards

Use:

- Next.js App Router
- TypeScript strict mode
- React
- Tailwind CSS
- shadcn/ui
- Lucide React
- `next/font`
- Server Components by default
- Client Components only where interaction requires them

Do not introduce a new framework, state-management library, form
library, chart library, animation library, icon library, or utility
package unless it is explicitly requested or already approved.

Before adding a dependency:

1. Confirm the requirement cannot be handled cleanly by the existing
   stack.
2. Confirm the dependency is not already installed.
3. Explain why it is necessary.
4. Install only the minimum required package.

## Core Engineering Principles

### KISS

Choose the simplest implementation that correctly satisfies the current
requirement.

Avoid:

- Premature abstraction
- Complex configuration
- Generic systems for one small use case
- Deep component hierarchies
- Unnecessary providers
- Unnecessary state
- Unnecessary effects
- Unnecessary custom hooks

### DRY

Do not repeat meaningful logic or repeated interface structures.

Extract shared code when:

- The same UI pattern is repeated
- The same transformation is repeated
- The same validation or formatting is repeated
- The same table configuration is repeated
- The same skeleton structure is repeated
- The same page header is repeated
- The same status styling is repeated

Do not force two superficially similar components into one complicated
abstraction.

Prefer understandable duplication over an incorrect abstraction, but
remove clear repetition.

### YAGNI

Do not add code for imagined future requirements.

Do not create:

- Generic plugin systems
- Complex configuration engines
- Unused variants
- Unused utilities
- Unused types
- Future backend interfaces
- Placeholder services
- Abstract repositories
- Premature global state
- Features outside the approved scope

## Next.js Architecture

Use the App Router.

Prefer this separation:

- `app/` for routes, layouts, loading, error, and page composition
- `components/ui/` for shadcn primitives
- `components/layout/` for the shared shell
- `components/shared/` for reusable application components
- `components/<feature>/` for feature-specific components
- `lib/` for reusable utilities, constants, and formatting
- `types/` for shared TypeScript types
- `data/` for typed frontend fixtures where required

Use route groups where they improve organisation without affecting URLs.

Use one shared dashboard layout.

Do not recreate the application shell in each page.

## Server and Client Components

Use Server Components by default.

Add `"use client"` only when the component requires:

- React state
- React effects
- Event handlers
- Browser APIs
- Interactive shadcn components
- Client-side form behaviour

Keep Client Component boundaries as small as practical.

Do not mark an entire page as a Client Component only because one child
component is interactive.

Move interactive behaviour into a focused child component.

## TypeScript Rules

Use strict TypeScript.

Never use:

- `any`
- `@ts-ignore`
- `@ts-nocheck`
- Unsafe type assertions used only to silence errors
- Unchecked optional values
- Unclear generic types

Prefer:

- Explicit domain types
- Discriminated unions for meaningful states
- Narrow string unions for statuses
- Typed component props
- Typed mock data
- Safe null handling
- `unknown` with narrowing when input type is genuinely unknown

Define types close to their usage unless they are shared across
features.

Do not create unnecessary global types.

## Component Standards

Every component must have one clear responsibility.

Prefer:

- Small focused components
- Clear prop names
- Predictable data flow
- Composition
- Named exports for reusable components
- Default exports only where Next.js requires or conventionally expects
  them, such as route pages

Avoid:

- Components with many unrelated responsibilities
- Components containing entire pages plus all dialogs and table logic
- Boolean prop explosions
- Excessive prop drilling
- Arbitrary render-prop abstractions
- Files containing many unrelated components
- Large inline arrays repeated inside components

A component should be extracted when it:

- Is repeated
- Is independently understandable
- Simplifies the parent
- Represents a meaningful UI unit
- Requires isolated client-side interaction

Do not split every small piece of markup into a separate file.

## shadcn/ui Standards

Use shadcn/ui for available interface primitives.

Do not manually rebuild a component that already exists in shadcn/ui.

Check the existing project before adding a component.

Install only required components.

Keep base shadcn primitives in:

`components/ui/`

Do not place project-specific business components in `components/ui/`.

Place project components in:

- `components/shared/`
- `components/layout/`
- `components/students/`
- `components/fees/`
- Other relevant feature folders

Use composition instead of editing shadcn internals unnecessarily.

Use `className` and variants for approved visual customisation.

Keep component APIs simple.

Use `cn()` for conditional class composition.

Avoid excessively long inline conditional class expressions.

Use CVA only when a component genuinely has reusable visual variants.

Do not add a variant system for a one-off component.

## Styling Standards

Use Tailwind CSS and existing design tokens.

Avoid:

- Inline style objects
- Repeated arbitrary hexadecimal colours
- Repeated arbitrary pixel values
- CSS modules unless explicitly required
- Large unrelated global CSS rules
- `!important`
- Deep CSS selectors
- Unnecessary animations
- Random z-index values

Use CSS variables for repeated design values.

Use meaningful layout patterns.

Keep Tailwind class lists readable and grouped logically.

When the same long class list appears repeatedly, create a reusable
component or variant.

Do not create a utility for a class string used only once.

## Forms

For the frontend-only phase:

- Build accessible visual forms
- Use correct field types
- Use labels connected to controls
- Show clear required indicators
- Show realistic visual error states when included in the approved
  design
- Keep mock submission behaviour local and simple when requested

Do not implement fake API calls.

Do not simulate a backend with artificial delays unless specifically
requested for demonstrating loading behaviour.

Use shadcn form primitives where appropriate.

Do not create separate versions of the same field component.

## Tables

Create a shared table pattern for consistent:

- Headers
- Row spacing
- Status badges
- Action menus
- Empty states
- Loading skeletons
- Pagination
- Horizontal scrolling on smaller screens

Do not duplicate complete table markup unnecessarily.

Do not introduce TanStack Table unless the approved frontend genuinely
requires sorting, complex filtering, or advanced table behaviour.

For a static frontend screen, use the simplest accessible table
implementation.

## Loading Skeletons

Use shadcn `Skeleton`.

Every significant page displaying future data should have a route-level
or component-level skeleton matching its final layout.

Prefer:

- Card skeletons for dashboard cards
- Row skeletons for tables
- Field skeletons for detail pages
- Form skeletons for editable forms
- Chart-area skeletons for graphs

Do not use a generic spinner for an entire dashboard page.

Skeletons must:

- Resemble the final component
- Avoid layout shift
- Be reusable where layouts repeat
- Remain visually restrained
- Respect light and dark backgrounds used in the approved design

Use `loading.tsx` for route-level loading states when appropriate.

## Mock Data

Keep frontend mock data typed and centralised.

Prefer files such as:

- `src/data/students.ts`
- `src/data/fees.ts`
- `src/data/dashboard.ts`

Do not scatter large mock-data arrays across page components.

Use realistic but clearly fictional data.

Use:

- PKR currency
- Pakistani phone formatting
- Level 4, Level 5, and Level 6
- Approved student and voucher statuses

Do not add fields merely to make a table look fuller.

## Accessibility

All frontend implementation must include:

- Semantic HTML
- Correct heading order
- Connected form labels
- Keyboard-accessible controls
- Visible focus states
- Accessible button names
- Appropriate ARIA only where native semantics are insufficient
- Sufficient colour contrast
- Accessible dialogs and menus through shadcn primitives

Do not use clickable `div` elements when a button or link is
appropriate.

Icon-only buttons must have accessible labels.

Decorative icons must not add unnecessary screen-reader noise.

## Responsive Design

Implement and review at:

- 1440px
- 1280px
- 1024px
- 768px
- 390px

Avoid:

- Fixed widths that break smaller screens
- Hidden actions
- Uncontrolled horizontal overflow
- Text clipping
- Overlapping controls
- Unreadably small text
- Mobile layouts that merely shrink the desktop interface

Use:

- Responsive grids
- Stack transitions
- Mobile Sheet navigation
- Controlled table scrolling
- Flexible page headers
- Responsive action groups

## Performance

Keep the frontend lightweight.

Use:

- `next/font`
- Next.js `Image` where appropriate
- Server Components where possible
- Static data in Server Components during the frontend phase
- Small Client Component boundaries

Avoid:

- Unnecessary hydration
- Large client-only page trees
- Repeated expensive calculations
- Unnecessary effects
- Avoidable re-renders
- Large libraries for simple interactions
- Premature memoisation

Use `useMemo` and `useCallback` only when there is a measurable or clear
reason.

## Error, Empty, and Disabled States

Where relevant, implement:

- Empty state
- Loading state
- Disabled state
- Validation state
- Error presentation
- Success feedback

Do not add every possible state to every component when the approved
screen does not require it.

Build shared states when they are reused.

## Naming

Use clear, domain-specific names.

Prefer:

- `StudentStatusBadge`
- `StudentTable`
- `FeeSummaryCard`
- `DashboardStatCard`
- `PageHeader`
- `AppSidebar`

Avoid:

- `Component1`
- `DataBox`
- `GenericCard`
- `Item`
- `Thing`
- `Helper`
- `Utils2`
- Abbreviations that are not widely understood

Use:

- PascalCase for components and types
- camelCase for functions and variables
- kebab-case for route folders
- Descriptive file names

## Comments

Write self-explanatory code.

Add comments only when they explain:

- A non-obvious design decision
- A browser limitation
- A necessary workaround
- A business rule that is not obvious from the code

Do not comment every line.

Do not leave commented-out code.

Do not leave TODO comments without an explicitly approved future task.

## Code Review Expectations

Before declaring a frontend task complete, inspect the diff as a lead
engineer would.

Confirm:

- No unrelated files changed
- No unnecessary package installed
- No duplicate component created
- No repeated page shell exists
- No `any` exists
- No TypeScript suppression exists
- No unused imports exist
- No unused variables exist
- No dead code exists
- No console logging remains
- No placeholder comments remain
- No fake backend exists
- No extra functionality exists
- Components remain readable
- Components have clear responsibilities
- shadcn components are reused
- Responsive behaviour works
- Skeletons match final layouts
- Accessibility is preserved
- Lint passes
- Type checking passes
- Production build passes

## Required Validation Commands

After each implementation task, run the scripts available in the
project for:

- Lint
- Type checking
- Production build

Use the project's existing package scripts.

Do not modify linting or TypeScript configuration merely to make errors
disappear.

Fix the code instead.

## Final Response Format

After completing a frontend task, report only:

1. What was implemented
2. Which files were created or modified
3. Which shared components were reused
4. Which validation commands were run
5. Whether lint, type checking, and build passed
6. Any genuine limitation or missing local design reference

Do not provide exaggerated claims.
Do not claim pixel perfection without browser comparison.
Do not continue into another module without approval.

=======================================================================
SETUP VALIDATION
=======================================================================

After creating the two skills:

1. Confirm these files exist:

   .agents/skills/stitch-local-pixel-perfect/SKILL.md

   .agents/skills/senior-nextjs-frontend-engineer/SKILL.md

2. Confirm both files have valid YAML frontmatter.

3. Confirm the directory exists:

   design-reference/stitch/

4. Do not modify anything under:

   src/
   app/
   components/
   public/
   package.json
   package-lock.json

5. Do not install packages.

6. Display the final directory tree for `.agents/skills/`.

7. List the two newly available skills by name and description.

8. Stop after the skill setup.

Do not begin frontend development.