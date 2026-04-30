ANTIGRAVITY UI STYLE RULES — DARK DASHBOARD (v1)

PURPOSE
These rules define the visual and interaction style for a single-page dashboard interface.
They are intended to be attached to an Antigravity project to ensure visual consistency,
practical UX, and production-ready design decisions.

==================================================
1. GENERAL DESIGN PRINCIPLES
==================================================
- Single-page dashboard layout (no multi-page navigation).
- Dark mode by default.
- Minimalist, data-first design.
- Prioritize readability, hierarchy, and scanability.
- Avoid decorative elements that do not convey information.
- Everything should feel fast, dense, and professional.

==================================================
2. COLOR SYSTEM
==================================================
Backgrounds:
- Primary background: very dark gray / near-black (#0E0F13 – #12131A range).
- Card background: slightly lighter dark gray (#161821 – #1C1F2A).
- Elevated elements use subtle gradients or overlays.

Text: 
- Primary text: white or near-white (#FFFFFF / #EDEDED).
- Secondary text: muted gray (#9CA3AF – #B0B3C0).
- Disabled text: darker muted gray.

Accent Colors:
- Blue: primary action & positive charts.
- Green: positive change / success / increase.
- Red: negative change / decrease.
- Yellow / Orange: warnings or pending states.
- Accent colors must be saturated but not neon.

Rules:
- Never use pure black (#000000).
- Never use bright white backgrounds.
- Accent colors only for meaning, not decoration.

==================================================
3. TYPOGRAPHY
==================================================
- Font style: modern sans-serif (Inter, SF Pro, or similar).
- Font weights:
  - Regular: body text
  - Medium: labels, secondary emphasis
  - Semibold/Bold: key metrics
- Hierarchy:
  - Page title: large, bold
  - Section titles: medium
  - Card numbers: large and bold
  - Labels: small and muted

Rules:
- Avoid long paragraphs.
- Numbers should stand out more than labels.
- Use consistent font sizes across cards.

==================================================
4. LAYOUT & GRID
==================================================
- Dashboard grid-based layout.
- Cards aligned in rows and columns.
- Consistent spacing:
  - Card padding: 16–24px
  - Gap between cards: 16–20px
- Sidebar on the left with icons only.
- Main content scrolls vertically.

Rules:
- No floating elements without alignment.
- Avoid full-width components unless they show charts or tables.

==================================================
5. CARDS & CONTAINERS
==================================================
- Rounded corners (12–16px radius).
- Subtle shadow or soft glow for elevation.
- Each card represents ONE clear concept.
- Cards must be visually separated from background.

Card Types:
- Metric cards (numbers + % change).
- Chart cards (bar, pie, line).
- Table containers.

Rules:
- No overcrowded cards.
- Avoid mixing unrelated data in one card.

==================================================
6. ICONS & ACTIONS
==================================================
- Icons are minimal, line-based.
- Icon buttons are circular or softly rounded.
- Actions are subtle, never loud.

Rules:
- Icons must always have a clear meaning.
- No decorative icons.
- Use hover states instead of labels when possible.

==================================================
7. DATA VISUALIZATION
==================================================
Charts:
- Bar charts: primary quantitative comparison.
- Pie charts: proportional distribution only.
- Line charts: trends over time.

Chart Rules:
- Dark background, bright data.
- Minimal grid lines.
- Labels are optional but tooltips are preferred.
- One main color per chart, variations for contrast.

Never:
- Overuse colors.
- Show unnecessary axes or borders.

==================================================
8. TABLES & LISTS
==================================================
- Dark table background with subtle row separation.
- Sticky headers.
- Clear column alignment.
- Status shown as colored pill/badge.

Rules:
- Avoid heavy borders.
- Use spacing and color for separation.
- Tables must be scannable at a glance.

==================================================
9. STATES & FEEDBACK
==================================================
Status Indicators:
- Success: green pill.
- Pending: yellow/orange pill.
- Error: red pill.
- Neutral: gray.

Interactions:
- Hover: slight background lightening.
- Active: subtle press-in effect.
- Transitions: fast and smooth (150–250ms).

==================================================
10. UX RULES (NON-NEGOTIABLE)
==================================================
- Everything must be usable with one glance.
- Key numbers visible without scrolling.
- No modal-heavy flows.
- No unnecessary confirmations.
- Prefer inline actions over popups.

==================================================
11. WHAT TO AVOID
==================================================
- Bright backgrounds.
- Over-animated UI.
- Decorative gradients without purpose.
- Inconsistent spacing.
- Multiple visual styles mixed together.

==================================================
END OF STYLE RULES
==================================================
