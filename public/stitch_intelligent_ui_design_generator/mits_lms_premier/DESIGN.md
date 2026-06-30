---
name: MITS LMS Premier
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
  on-surface-variant: '#434654'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#0c56d0'
  primary: '#003d9b'
  on-primary: '#ffffff'
  primary-container: '#0052cc'
  on-primary-container: '#c4d2ff'
  inverse-primary: '#b2c5ff'
  secondary: '#6b38d4'
  on-secondary: '#ffffff'
  secondary-container: '#8455ef'
  on-secondary-container: '#fffbff'
  tertiary: '#004e33'
  on-tertiary: '#ffffff'
  tertiary-container: '#006846'
  on-tertiary-container: '#5debaf'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  success: '#10b981'
  warning: '#f59e0b'
  danger: '#ef4444'
  info: '#0052cc'
  accent-purple: '#8b5cf6'
  slate-500: '#64748b'
  slate-900: '#0f172a'
  border-subtle: '#e2e8f0'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1440px
  sidebar-width: 280px
  gutter: 1.5rem
  margin-page: 2rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style

The design system for this LMS focuses on a **Corporate / Modern** aesthetic that bridges the gap between a high-stakes professional environment and a focused academic workspace. It is designed for students and administrators who require a high-performance, desktop-optimized dashboard that feels robust, trustworthy, and technologically advanced.

The visual narrative is "Instructional Engineering"—where the precision of code meets the clarity of premium education. This is achieved through:
- **Cleanliness:** Ample whitespace and a rigorous grid system to manage complex data like attendance logs and code submissions.
- **Subtle Tech Cues:** Use of monospaced numbers for data grids and micro-interactions that provide immediate feedback for actions like check-ins or status updates.
- **Co-Branding:** A visual architecture that allows MITS Madanapalle and Ethnotech Academy logos to sit side-by-side with equal weight in the sidebar.
- **Professional Polish:** Subtle shadows and soft borders create a "layered canvas" effect, making the interface feel like a sophisticated desktop application rather than a simple website.

## Colors

The palette is anchored by a high-trust **Primary Blue**, used for core navigation and primary actions. It is supported by a functional spectrum of status colors that are vital for the platform's operational logic (Attendance, Leave, Grading).

- **Functional Tones:** Success Green, Warning Amber, and Danger Red are used for badges and status indicators. Every functional color must be paired with its light-fill variant (10% opacity) for background containers to ensure high legibility and a soft, premium feel.
- **Academic Accent:** A specific Purple is reserved for Exams, Quizzes, and Gamification elements (like total scores) to distinguish "Testing" activities from "Routine" activities.
- **Canvas:** The primary background is a cool Slate 50, providing a crisp contrast for white cards and sidebars.

## Typography

This design system uses a dual-font strategy to balance character with utility. 

- **Outfit** is used for all headings and large display text. Its geometric yet friendly structure gives the LMS a modern "Tech Startup" feel.
- **Inter** is the workhorse for all body copy, forms, and UI labels. It is chosen for its exceptional legibility in data-dense environments like student rosters and grading grids.
- **Data Display:** For attendance durations and LeetCode scores, use medium-weight Inter with tabular figures to ensure numbers align perfectly in columns. 
- **Code Snippets:** While not the primary font, JetBrains Mono should be used for any code-viewing panes or technical submission previews.

## Layout & Spacing

The layout is **Desktop-Optimized**, specifically targeting viewports of 1024px and above. The platform utilizes a **fixed-sidebar and fluid-canvas** model.

- **Grid System:** Use a 12-column grid for the main canvas area. Dashboard widgets should typically span 3, 4, or 6 columns depending on the data density.
- **The Sidebar:** Fixed to the left at 280px. It contains the co-branded header (MITS + Ethnotech) and primary navigation.
- **Standard Spacing:** A base unit of 8px (0.5rem) governs all spacing. Page margins are set to 32px (2rem) to give the content "breathing room," reinforcing the premium feel.
- **Responsiveness:** Viewports below 1024px are restricted via a system-level overlay. Content should reflow within the 1024px—1920px range using fluid widths for cards while maintaining fixed gutters.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and **Ambient Shadows**.

- **Surface Levels:** 
  1. **Background (Slate 50):** The lowest layer, representing the canvas.
  2. **Cards & Sidebar (White):** These sit one level above the background with a subtle border (#e2e8f0).
  3. **Hover States:** Elements like interactive list items use a slight lift—increasing shadow depth and changing the background to a faint blue tint (#f1f5f9).
- **Shadow Profile:** Shadows must be extremely diffused and low-opacity. Use `0 10px 30px rgba(15, 23, 42, 0.04)` for standard cards. Higher elevation (like modals or popovers) uses a slightly more aggressive `0 20px 40px rgba(15, 23, 42, 0.08)`.
- **Flat Borders:** Use 1px solid borders for input fields and static containers to maintain a structured, engineering-led appearance.

## Shapes

The design system employs a **Rounded** shape language to soften the "industrial" feel of a data-heavy application.

- **Components:** Standard UI components (buttons, inputs, cards) use a 0.5rem (8px) radius. 
- **Large Containers:** Dashboard widgets and main modal containers should use `rounded-lg` (1rem / 16px).
- **Interactive Elements:** Use the "Pill" shape (9999px) exclusively for **Status Badges** (Present, Absent, Pending) and **Avatar Wrappers**. This distinction helps users instantly identify status-related information versus action-oriented buttons.

## Components

### Buttons
- **Primary:** Solid #0052cc with white text. 0.5rem radius. Subtle scale-down effect (0.98) on click.
- **Secondary:** Outline variant with #e2e8f0 border and primary blue text.
- **Check-in Action:** High-prominence button for students; use a pulsing green glow animation when the user is "Waiting for Check-in."

### Status Badges
- **Anatomy:** Soft background (10% opacity of the functional color) and high-contrast bold text.
- **Present (Green):** #10b981 background, #065f46 text.
- **Pending (Amber):** #f59e0b background, #92400e text.
- **Absent (Red):** #ef4444 background, #991b1b text.

### Cards
- White background, 1px border (#e2e8f0), and subtle ambient shadow.
- Dashboard cards should include a 4px colored top-border (Primary, Success, or Purple) to categorize the metric type.

### Input Fields
- Use Inter font. Borders turn Primary Blue on focus with a 3px soft focus-ring (Primary Blue at 10% opacity).
- **Admin Review Box:** Use a shaded background for feedback text areas to differentiate trainer notes from student submissions.

### Navigation Sidebar
- Navigation items should have a "Vertical Indicator" (4px wide Primary Blue line) on the left when active.
- Incorporate a small badge for "Chat" and "Notifications" items showing unread counts in Danger Red.

### Data Tables
- Header row with Slate 50 background and Label-SM typography.
- Alternating row highlights on hover for long rosters (Attendance/LeetCode logs).