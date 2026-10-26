=======================================================================
SKILL 1
=======================================================================

Create:

.agents/skills/stitch-local-pixel-perfect/SKILL.md

Use the following content:

---
name: stitch-local-pixel-perfect
description: Implements approved Google Stitch designs as pixel-accurate Next.js interfaces using only locally downloaded Stitch screenshots, HTML, CSS, assets, and design references. Use this skill whenever creating, correcting, comparing, or reviewing UI screens from design-reference/stitch/.
---

# Local Stitch Pixel-Perfect Implementation

## Purpose

This skill converts the locally downloaded and approved Google Stitch
design materials into accurate, production-quality Next.js frontend
code.

It must reproduce the approved design as closely as technically
possible without redesigning, inventing, simplifying, or adding
unrequested elements.

The local files inside `design-reference/stitch/` are the only Stitch
design source.

Never connect to Stitch MCP.
Never request a Stitch API key.
Never use an external Stitch integration.
Never browse for alternative templates.
Never generate a new visual direction.

## When to Use This Skill

Use this skill whenever the task involves:

- Implementing a screen downloaded from Google Stitch
- Matching an existing Stitch screenshot
- Translating downloaded Stitch HTML or CSS into Next.js
- Correcting differences between the application and Stitch design
- Reviewing visual accuracy
- Building shared design tokens from the Stitch export
- Fixing spacing, typography, alignment, sizing, or responsiveness
- Creating responsive versions of existing approved screens
- Auditing an implemented page against its reference screenshot

## Required Local Design Location

The expected local design directory is:

`design-reference/stitch/`

Before implementing a screen:

1. Inspect all relevant files in this directory.
2. Identify the screenshot for the requested screen.
3. Inspect any corresponding HTML, CSS, JSON, SVG, image, or asset
   files.
4. Record the screenshot dimensions and intended viewport.
5. Identify repeated visual patterns shared with other screens.
6. Inspect the existing application before creating components.

Do not start implementation until the relevant local design reference
has been inspected.

If the requested screen does not exist in the local design directory,
report that the reference is missing. Do not invent the screen.

## Source-of-Truth Priority

When sources conflict, follow this priority:

1. Final approved project requirements or PRD
2. Approved Stitch screenshot
3. Approved local Stitch assets
4. Existing shared design system
5. Downloaded Stitch HTML and CSS
6. Existing implementation

The Stitch screenshot controls visual appearance.

The PRD controls required fields, content, screens, and functionality.

Downloaded HTML and CSS are reference material only. They must not be
copied blindly into the Next.js application.

## Approved Project Design Tokens

Use these approved project tokens unless an explicitly approved local
reference overrides a screen-specific measurement.

### Colours

- Primary navy: `#0D1B3D`
- Secondary navy: `#1C2D5A`
- Warm ivory: `#F5F1E8`
- Light beige: `#EAE3D7`
- Gold accent: `#B89A5D`
- White: `#FFFFFF`
- Light neutral background: `#F8F8F8`
- Border: `#E3E3E3`

### Typography

Use:

- Source Serif 4 for page titles and major section headings
- Inter for body text, forms, navigation, tables, buttons, badges, and
  application UI

If the downloaded Stitch files use an outdated or inconsistent font,
normalise them to Source Serif 4 and Inter.

Configure fonts through `next/font`.

Do not use Times New Roman.
Do not introduce additional font families.

### Visual Style

- Premium
- Minimal
- Professional
- Legal-institution identity
- Modern SaaS layout
- Subtle shadows
- Restrained gold accents
- Clean white space
- Clear hierarchy

Do not use:

- Gradients unless present in an explicitly approved reference
- Glassmorphism
- Neumorphism
- Heavy shadows
- Colourful admin-template styling
- Decorative elements not present in the reference
- Profile photographs
- Initials avatars
- Random illustrations

## Pixel-Accurate Implementation Process

For every screen, follow this sequence.

### Step 1: Inspect

Inspect:

- Screenshot dimensions
- Overall page grid
- Sidebar width
- Header height
- Main content width
- Outer page padding
- Section spacing
- Card dimensions
- Table dimensions
- Form alignment
- Typography
- Icons
- Borders
- Shadows
- Radius values
- Responsive behaviour
- Empty, loading, error, and populated states

### Step 2: Reuse Existing Components

Before creating a component:

1. Search the repository for an existing equivalent.
2. Check `components/ui`.
3. Check shared layout components.
4. Check feature-specific components.
5. Extend or compose an existing component where appropriate.

Never create duplicate versions of:

- Buttons
- Inputs
- Selects
- Textareas
- Cards
- Dialogs
- Tables
- Badges
- Pagination
- Search bars
- Filters
- Page headers
- Sidebar items
- Form fields
- Empty states
- Loading skeletons

### Step 3: Establish Shared Tokens

Repeated design values must be represented using:

- CSS variables
- Tailwind theme tokens
- Shared component variants
- Reusable layout constants

Do not repeatedly hard-code the same colours, shadows, radii, widths, or
spacing values across unrelated files.

A unique, screen-specific measurement may remain local when creating a
shared abstraction would make the code harder to understand.

### Step 4: Use shadcn/ui

Use shadcn/ui as the foundation for available interface primitives.

Use shadcn/ui for:

- Button
- Input
- Label
- Select
- Textarea
- Card
- Table
- Badge
- Dialog
- Sheet
- Dropdown Menu
- Popover
- Calendar
- Breadcrumb
- Pagination
- Tooltip
- Skeleton
- Separator
- Tabs when genuinely required

Before adding a shadcn component:

1. Check whether it is already installed.
2. Reuse the installed component.
3. Add only the component required for the current screen.

Do not install the complete shadcn library.
Do not recreate a shadcn component manually.
Do not maintain multiple versions of the same primitive.

Customise shadcn components through:

- Tailwind classes
- Existing component variants
- `className`
- Composition
- Controlled extension

Do not rewrite their underlying behaviour without a clear requirement.

### Step 5: Build the Shared Shell First

Use one shared application shell for:

- Sidebar
- Header
- Mobile navigation
- Main content container
- Breadcrumbs where included
- Page title area

Do not duplicate sidebar or header markup inside individual pages.

Use one dashboard layout for all protected frontend pages.

### Step 6: Implement the Screen

Match the approved reference for:

- Width
- Height
- Spacing
- Alignment
- Typography
- Line height
- Font weight
- Colour
- Border
- Radius
- Shadow
- Icon size
- Button height
- Input height
- Table row height
- Badge size
- Empty space
- Responsive behaviour

Do not change the design because another layout seems more attractive.

Do not add fields, cards, statistics, menu items, icons, charts, tables,
actions, filters, or text not included in the approved reference or
project requirements.

### Step 7: Responsive Behaviour

Implement each screen at these minimum viewport widths:

- Desktop: 1440px
- Laptop: 1280px
- Tablet: 1024px
- Mobile: 390px

Responsive behaviour must preserve the design hierarchy.

Desktop:

- Fixed or stable sidebar where approved
- No clipped content
- No hidden buttons
- No unnecessary horizontal scrolling

Tablet:

- Collapsible sidebar
- Appropriate grid reduction
- Tables may use controlled horizontal scrolling

Mobile:

- Sidebar becomes a Sheet or drawer
- Forms become one column
- Cards stack vertically
- Tables retain usable controlled horizontal scrolling
- Primary actions remain accessible
- Text must not overlap or become clipped

Do not hide essential functionality merely to make the design fit.

### Step 8: Loading Skeletons

Every data-based page must have a matching loading skeleton.

Use the shadcn `Skeleton` component.

The skeleton must approximate the final layout:

- Same card arrangement
- Similar table rows
- Similar content widths
- Similar form structure
- Similar page height

Do not use a generic central spinner as the primary page-loading state.

Avoid layout shift between the skeleton and loaded interface.

Create shared skeleton components when multiple screens use the same
loading pattern.

Do not duplicate identical skeleton markup across routes.

### Step 9: Browser Verification

After implementation:

1. Run the application locally.
2. Open the page in the integrated browser.
3. Capture the same viewport dimensions as the approved screenshot.
4. Compare the implementation against the reference.
5. Correct visible differences.
6. Repeat until the page is visually consistent.

Check specifically:

- Sidebar dimensions
- Header dimensions
- Content starting position
- Page padding
- Typography
- Wrapping
- Cards
- Form controls
- Tables
- Icons
- Buttons
- Alignment
- White space
- Borders
- Shadows
- Overflow
- Responsive states

Do not declare a screen complete after only verifying that it compiles.

## Image and Asset Rules

Use assets from:

`design-reference/stitch/`

or the approved project public assets directory.

For raster images, use the Next.js `Image` component when appropriate.

Preserve:

- Aspect ratio
- Transparency
- Intended crop
- Visual sharpness

Use SVG assets when provided.

Do not replace the Lawyers Nexus logo with:

- Text
- A Lucide icon
- A generated logo
- A temporary placeholder

Do not embed large base64 images directly in components.

## Icon Rules

Use the icons shown in the approved reference.

Use Lucide React where the reference uses a common interface icon.

Keep consistent:

- Icon family
- Size
- Stroke width
- Alignment
- Colour

Do not mix multiple icon libraries.

Do not add decorative icons that do not serve a purpose.

## Content Rules

Do not invent:

- Student data fields
- Dashboard metrics
- Reports
- Statuses
- Financial categories
- Navigation sections
- Profile images
- Notifications
- Calendar tools
- Additional actions

Use PKR for currency.

Use only:

- Level 4
- Level 5
- Level 6

Use approved roll-number examples such as:

- L4-2026-001
- L5-2026-001
- L6-2026-001

## Completion Checklist

A design task is complete only when:

- The correct local Stitch files were inspected
- The existing architecture was inspected
- Shared components were reused
- No duplicate primitive was created
- The approved fonts are used
- Colours match the approved design
- Layout proportions match
- Content matches the PRD
- Desktop layout is verified
- Tablet layout is verified
- Mobile layout is verified
- Loading skeleton is implemented
- No text overlaps
- No page content is cropped
- No unexpected horizontal overflow exists
- No unnecessary element was added
- Lint passes
- Type checking passes
- Production build passes

