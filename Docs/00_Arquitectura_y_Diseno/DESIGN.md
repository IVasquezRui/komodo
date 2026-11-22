---
name: Komodo Travel System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#464555'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#795900'
  on-secondary: '#ffffff'
  secondary-container: '#ffbf00'
  on-secondary-container: '#6d5000'
  tertiary: '#00524b'
  on-tertiary: '#ffffff'
  tertiary-container: '#006c63'
  on-tertiary-container: '#81eddf'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#ffdfa0'
  secondary-fixed-dim: '#fbbc00'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#89f5e7'
  tertiary-fixed-dim: '#6bd8cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#005049'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  stack-gap: 16px
  inline-gap: 12px
  gutter: 16px
---

## Brand & Style

The design system is anchored in a **Modern Minimalist** aesthetic, specifically tailored for the high-frequency, high-reliability context of bus travel. The brand personality is professional yet inviting, prioritizing clarity and ease of navigation to reduce the "travel anxiety" often associated with transit apps.

The interface utilizes generous white space and a "content-first" hierarchy. By stripping away unnecessary decorative elements, the system directs the user’s focus toward critical travel data: departure times, gate numbers, and ticket QR codes. The visual language balances precision (through structured grids) with friendliness (through soft geometry).

**Key Principles:**
- **Clarity over Decoration:** Every element must serve a functional purpose.
- **High Intent:** Use of high-contrast accents to guide users through the booking funnel.
- **Trustworthy Sophistication:** A refined color palette that feels premium yet accessible.

## Colors

The palette is designed to create a clear functional hierarchy. The **Indigo Primary** establishes brand authority, while the **Amber Gold** is reserved strictly for high-priority interactive accents and brand highlights.

- **Surface:** Pure White (#FFFFFF) is used for the base layer to maintain a clean, expansive feel.
- **Primary (Indigo):** #4F46E5. Used for navigation headers, active states, and brand-level iconography.
- **Accent (Amber Gold):** #FFBF00. Used for "Book Now" buttons, loyalty status, and important call-outs.
- **Success/Action (Teal):** #0D9488. Specifically reserved for the "Search Routes" flow and final purchase confirmations.
- **Functional Neutrals:** A range of Slate Grays (from #1E293B for text to #F1F5F9 for backgrounds) provides soft contrast without the harshness of pure black.

## Typography

This design system uses **Inter** exclusively to leverage its exceptional legibility and systematic feel. The type scale is optimized for "glanceability"—the ability for a user to extract information while on the move.

- **Weight Usage:** Bold (700) is used for primary headings and price points. Semibold (600) is used for buttons and navigation labels. Regular (400) is used for all body copy and secondary metadata.
- **Accessibility:** Ensure a minimum contrast ratio of 4.5:1 for all body text. Secondary labels should use a medium-gray (#64748B) to maintain hierarchy while remaining legible.
- **Numerical Data:** For bus times and seat numbers, ensure tabular lining is enabled to keep columns aligned.

## Layout & Spacing

The layout follows an **8px grid system** for consistent spatial relationships. 

- **Mobile First:** A fluid 4-column grid for mobile devices with 24px side margins to ensure the interface feels airy and uncrowded.
- **Desktop/Tablet:** A 12-column centered grid with a maximum content width of 1200px.
- **Rhythm:** Use 16px (stack-gap) for related elements within a card and 32px to separate distinct sections of the page.
- **Safe Areas:** Adhere to platform-specific safe areas (Dynamic Island/Notch) to ensure critical trip information is never obscured.

## Elevation & Depth

This design system avoids heavy shadows in favor of **Tonal Layers** and **Soft Ambient Occlusion**.

- **Level 0 (Base):** White (#FFFFFF) for the primary background.
- **Level 1 (Cards):** Use a subtle 1px border (#F1F5F9) or an extremely soft shadow (Y: 4px, Blur: 20px, 4% Opacity Black) to lift cards off the background.
- **Level 2 (Floating/Modals):** A more pronounced shadow (Y: 10px, Blur: 30px, 8% Opacity Black) used for bottom sheets and snackbars.
- **Interactive Depth:** Buttons use a subtle "pressed" state where they scale down to 98% and lose their shadow, simulating a physical push.

## Shapes

The shape language is defined by **Rounded-XL (16px)** corners. This high level of roundedness creates a friendly, approachable atmosphere that counteracts the industrial nature of bus travel.

- **Primary Cards:** 24px (rounded-2xl) to create distinct "buckets" of information.
- **Buttons & Inputs:** 12px to 16px (rounded-xl) for a comfortable touch target.
- **Small Elements (Chips/Tags):** Fully rounded (pill-shaped) to distinguish them from interactive buttons.
- **Visual Continuity:** Ensure that nested elements have a smaller radius than their parent container to maintain visual harmony.

## Components

### Buttons
- **Primary (Search/Action):** Teal (#0D9488) background with White text. Bold, 16px text. 
- **Accent (Promotional):** Amber Gold (#FFBF00) background with dark Slate text.
- **Ghost/Secondary:** Transparent background with Indigo (#4F46E5) border and text.

### Input Fields
- **Search Inputs:** Large, 56px height fields with 16px internal padding. Use icons for "From" (hollow circle) and "To" (solid pin).
- **State States:** On focus, the border transitions to Primary Indigo with a 2px stroke.

### Cards (Ticket/Route)
- White background with a 1px Slate-100 border.
- Use a dashed divider line to represent a "tear-off" ticket aesthetic for booked trips.

### Feedback Indicators (Icons)
- **Success:** A teal checkmark circle.
- **Error:** A high-contrast red "X" circle for failed payments or sold-out routes.
- **Warning:** An amber triangle for "Delayed" or "Platform Change" alerts.

### Navigation
- **Bottom Bar:** Simple, 4-tab navigation (Home, My Trips, Rewards, Profile) using 24px line icons. Active state uses Primary Indigo.