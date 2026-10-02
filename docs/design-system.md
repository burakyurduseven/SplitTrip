# Design system baseline

## Design character

SplitTrip should feel warm, social, and trustworthy. It should resemble a polished consumer travel product rather than a traditional administration dashboard.

Selected initial direction: **Warm and social**.

## Colors

Initial tokens:

| Token | Light theme | Usage |
|---|---:|---|
| Canvas | `#F7F8F4` | Main background |
| Surface | `#FFFFFF` | Cards and forms |
| Ink | `#15251F` | Primary text |
| Muted ink | `#64716B` | Secondary text |
| Brand | `#0F766E` | Primary actions |
| Brand soft | `#DDF4EF` | Selected and highlighted areas |
| Positive | `#15803D` | Credit and success |
| Negative | `#DC5A4A` | Debt and errors |
| Warning | `#B7791F` | Conflicts and warnings |
| Border | `#E1E7E3` | Dividers |

Status must never depend on color alone. Signs, icons, and text accompany color.

## Typography

- Primary font: Inter or the system sans-serif stack
- Monetary values use tabular numerals
- Page headings are strong but compact
- Body text is at least 16 px on mobile
- Supporting text is at least 12 px with sufficient contrast

## Layout

- Design starts at a 320–430 px mobile width.
- Mobile page gutters are 16–20 px.
- Desktop content is constrained to approximately 1120 px.
- Primary mobile navigation sits at the bottom: Overview, Itinerary, Expenses, and Balances.
- Each screen has one dominant primary action.
- Touch targets are approximately 44×44 px or larger.

## Components

- Trip card: dates, member avatars, upcoming activity, and balance summary
- Timeline row: time, activity, location, and conflict state
- Expense row: category, payer, amount, and the current user's share
- Balance row: member, positive or negative amount, and explanatory text
- Bottom sheet: mobile expense creation and filters
- Empty state: short explanation and one clear action
- Skeleton: preserves the shape of the final layout
- Toast: brief operation feedback; critical errors remain in the page or form

## Content style

- Short, direct language
- Prefer “Amount to pay” over accusatory wording
- Use “Suggested payment plan,” not “Optimal payment plan”
- Error messages explain both what happened and what the user can do next

## Accessibility

- Text contrast targets WCAG AA.
- Form controls have visible labels.
- Errors are not communicated by color alone.
- Keyboard focus is visible.
- Reduced-motion preferences are respected.
- Icon-only buttons have accessible names.
