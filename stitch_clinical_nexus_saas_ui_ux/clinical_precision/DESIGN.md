---
name: Clinical Precision
colors:
  surface: '#031427'
  surface-dim: '#031427'
  surface-bright: '#2a3a4f'
  surface-container-lowest: '#000f21'
  surface-container-low: '#0b1c30'
  surface-container: '#102034'
  surface-container-high: '#1b2b3f'
  surface-container-highest: '#26364a'
  on-surface: '#d3e4fe'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#d3e4fe'
  inverse-on-surface: '#213145'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#bec6e0'
  on-secondary: '#283044'
  secondary-container: '#3f465c'
  on-secondary-container: '#adb4ce'
  tertiary: '#ffb873'
  on-tertiary: '#4b2800'
  tertiary-container: '#e89337'
  on-tertiary-container: '#5b3200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdcbf'
  tertiary-fixed-dim: '#ffb873'
  on-tertiary-fixed: '#2d1600'
  on-tertiary-fixed-variant: '#6a3b00'
  background: '#031427'
  on-background: '#d3e4fe'
  surface-variant: '#26364a'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  gutter: 24px
  margin: 24px
---

## Brand & Style
The design system is engineered for high-stakes medical environments, balancing clinical reliability with cutting-edge technological sophistication. It serves a dual-persona audience: healthcare practitioners requiring focus and reduced visual fatigue, and administrative stakeholders demanding data density and professional clarity.

The aesthetic follows a **Modern Corporate** foundation infused with **Glassmorphism** for depth. The "Deep Dark" mode minimizes ocular strain during night shifts or low-light diagnostic settings, utilizing cyan-glow accents to guide the eye toward critical actions. The "Clinical Clean" light mode emphasizes hygiene and order through generous whitespace and subtle elevation. Both modes prioritize **Cognitive Ergonomics**, ensuring that information hierarchy is unmistakable and interface friction is non-existent.

## Colors
This design system utilizes a dual-theme strategy optimized for long-term use in medical contexts.

### Dark Mode (Deep Dark & Cyan Glow)
- **Background:** Slate-950 (#020617) for the base layer to maximize contrast with glowing elements.
- **Surface:** Zinc-950 with 70% opacity and a 12px backdrop blur for container depth.
- **Accents:** Cyan-400 (#22d3ee) for interactive states, progress indicators, and critical data points.
- **Borders:** Thin Cyan-500/20 (#06b6d4 at 20% opacity) to define boundaries without visual clutter.

### Light Mode (Clinical Clean)
- **Background:** Slate-50 (#f8fafc) to provide a soft, non-glaring workspace.
- **Surface:** Pure White (#ffffff) for primary cards and data tables to signify "sterile" precision.
- **Typography:** Slate-900 (#0f172a) for maximum legibility.
- **Accents:** Cyan-600 (#0891b2) to maintain corporate identity while passing AAA accessibility contrast ratios.

## Typography
The typography system uses a combination of **Geist** for structural elements and **Inter** for long-form data. 

- **Geist** is reserved for headlines, labels, and monospaced technical data. Its geometric precision conveys a modern, tech-forward medical approach.
- **Inter** is the workhorse for body text and patient records, chosen for its exceptional legibility and high x-height, which reduces reading fatigue during extended data entry.

In Dark Mode, font weights for body text should be slightly reduced (e.g., 400 to 300) to prevent "ink bleed" visual effects on high-brightness screens. In Light Mode, emphasize contrast by using heavier weights for section headers.

## Layout & Spacing
The layout adheres to a **12-column Fluid Grid** system. Medical dashboards often require high density; therefore, the system utilizes a base-4 spacing scale to allow for tight but organized information clusters.

### Adaptive Behavior
- **Desktop (1280px+):** 24px gutters, 32px margins. Sidebars are persistent for quick navigation.
- **Tablet (768px - 1279px):** 16px gutters. Sidebars collapse into an icon-only "rail" or a hamburger menu.
- **Mobile (< 767px):** 12px gutters, 16px margins. Complex data tables must reflow into "card stacks" to maintain touch-target accessibility.

Spacing should favor vertical rhythm. Between distinct patient modules, use `2xl` (48px); within a module's internal sections, use `md` (16px).

## Elevation & Depth
Depth in this design system is used to communicate "Safe Zones" for data.

### Dark Mode (Depth via Light)
Instead of traditional drop shadows, use **Tonal Layers** and **Cyan Glows**.
- **Level 0 (Base):** Slate-950.
- **Level 1 (Cards/Panels):** Zinc-950 with a 1px inner border of Cyan-500/10.
- **Level 2 (Modals/Popovers):** Zinc-900 with a subtle Cyan-400/20 outer glow (blur: 20px, spread: -5px) to simulate "floating" over the interface.

### Light Mode (Depth via Shadow)
- **Level 0 (Base):** Slate-50.
- **Level 1 (Cards):** Pure White with a `shadow-sm` (1px y-offset, 2px blur, Slate-900/05).
- **Level 2 (Modals):** Pure White with a `shadow-lg` to create a clear physical separation from the clinical background.

## Shapes
The design system uses a **Soft (0.25rem)** roundedness philosophy. This "medical-industrial" radius strikes a balance between the friendliness of rounded corners and the professional authority of sharp edges.

- **Standard Elements (Buttons, Inputs):** 4px (0.25rem) radius.
- **Large Elements (Cards, Modals):** 8px (0.5rem) radius.
- **System Indicators (Status Badges/Chips):** 12px (0.75rem) to differentiate "tags" from "actions."

## Components

### Buttons
- **Primary:** Solid Cyan-600 (Light) or Cyan-500 (Dark). No gradients. In dark mode, primary buttons feature a soft 4px cyan outer glow on hover.
- **Secondary:** Transparent background with a 1px Slate-300 border (Light) or Cyan-500/30 border (Dark).
- **Destructive:** Solid Red-600. Reserved exclusively for "Delete Patient Record" or "Stop Treatment" actions.

### Inputs & Form Fields
- **Default State:** Subtle border, Geist font for labels.
- **Focus State:** 1px Cyan-500 border with a 2px Cyan-500/20 outer rings (halo).
- **Validation:** Use "Success" green or "Error" red text labels immediately below the input. Never rely on color alone; always include an icon (e.g., Lucide `AlertCircle`).

### Cards & Modules
Cards are the primary container for patient data. In Dark Mode, use the 70% opacity + backdrop blur. In Light Mode, use pure white with a 1px Slate-200 border. Header sections within cards should have a 1px bottom divider to separate metadata from content.

### Status Chips
Utilize a "Dot + Label" pattern. A 6px circular dot (e.g., Green for "Stable", Yellow for "Observation", Red for "Critical") followed by a Geist Label-MD font.

### Data Tables
Tables are the heart of the SaaS.
- **Rows:** 48px height for readability.
- **Alternating Rows:** Use Slate-100 (Light) or Zinc-900 (Dark) for zebra-striping in dense datasets to prevent horizontal line skipping.