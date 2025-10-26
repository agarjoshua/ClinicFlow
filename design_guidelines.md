# Hospital Management System Design Guidelines

## Design Approach

**Selected Approach:** Medical Dashboard Design System  
**Justification:** Healthcare applications prioritize clarity, efficiency, and data-dense interfaces. This system draws from established medical software patterns (Epic, Cerner) combined with modern dashboard best practices (Linear, Notion) to create a professional, trustworthy interface optimized for clinical workflows.

**Core Principles:**
1. **Clinical Clarity:** Information hierarchy optimized for quick scanning and decision-making
2. **Calm Professionalism:** Reduced visual noise to minimize cognitive load during high-stress medical scenarios
3. **Data Density with Breathing Room:** Maximum information per screen without overwhelming users
4. **Trustworthy Aesthetics:** Modern but conservative design that inspires confidence in medical staff

---

## Typography System

**Font Stack:** 
- Primary: Inter or Work Sans (clinical, readable)
- Monospace: JetBrains Mono (for patient IDs, medical codes)

**Hierarchy:**
- **Page Titles:** 2xl font, semibold weight - section headers like "Patient Records"
- **Card Headers:** xl font, medium weight - individual patient names, diagnosis titles
- **Form Labels:** sm font, medium weight, uppercase tracking - field labels
- **Body Text:** base font, regular weight - descriptions, notes, medical history
- **Metadata:** sm font, regular weight - timestamps, patient IDs, status badges
- **Data Tables:** sm font, medium weight for headers, regular for cells

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8 as primary spacing rhythm
- Component padding: p-4 to p-6
- Card spacing: p-6 for content, gap-4 between elements
- Section margins: mb-6 to mb-8 between major sections
- Form field spacing: gap-4 vertically, gap-6 for groups

**Grid Structure:**
- **Dashboard Layout:** Sidebar (16rem fixed width) + Main content area (flex-1)
- **Stats Cards:** 4-column grid on desktop (grid-cols-4), 2 on tablet, 1 on mobile
- **Patient List:** Single column with full-width cards for scanning efficiency
- **Forms:** 2-column grid for input fields (grid-cols-2), full-width for text areas
- **Diagnosis History:** Timeline-style single column with left-aligned markers

**Container Strategy:**
- Main content: max-w-7xl with px-6 to px-8 horizontal padding
- Forms and modals: max-w-4xl for focused data entry
- Patient details: max-w-6xl for comprehensive information display

---

## Component Library

### Navigation & Layout

**Sidebar Navigation:**
- Fixed left sidebar with icon + label navigation items
- Active state: Subtle background fill with left border accent
- Icons: 20px (w-5 h-5) using lucide-react
- Sections: Dashboard, Patients, Diagnoses, Discharged, Settings
- User profile card at bottom with avatar, name, role

**Top Bar:**
- Sticky header with search bar (centered, max-w-md)
- Quick action buttons on right: Add Patient, Notifications, User menu
- Breadcrumb navigation below for deep pages

### Dashboard Components

**Statistics Cards:**
- Glass-morphic cards with subtle backdrop blur
- Large number display (3xl, bold) for primary metric
- Supporting text (sm) for metric label
- Icon in corner (32px) with subtle opacity
- Trend indicator (up/down arrow with percentage change)
- Grid layout: 4 cards showing Total Patients, Active Today, Pending Diagnoses, Discharged This Week

**Recent Activity Feed:**
- Timeline-style vertical list with dot markers on left
- Each entry: Avatar + Action description + Timestamp
- Grouped by date with subtle date dividers
- Shows last 10 activities (new admissions, discharges, diagnoses)

**Quick Actions Panel:**
- Horizontal row of prominent action buttons
- Primary actions: "New Patient", "New Diagnosis", "Search Records"
- Large touch targets (h-12 minimum) with icons and labels

### Patient Management

**Patient List Cards:**
- Full-width cards in vertical stack
- Left section: Avatar (circular, 48px) + Name (lg, semibold) + Patient ID (monospace, sm)
- Center section: Age, Gender, Last Visit metadata in compact grid
- Right section: Status badge + Quick action icons (View, Edit, Delete)
- Hover state: Subtle elevation increase and background lightening
- Search bar above with filters (Status, Age Range, Recent First)

**Patient Detail View:**
- Header section: Large avatar + Name (2xl) + Patient ID + Status badge
- Tab navigation: Overview, Medical History, Diagnoses, Documents
- Overview tab grid: 2 columns on desktop
  - Left: Demographics card (contact info, emergency contact)
  - Right: Medical summary card (allergies, conditions, medications)
- Action buttons in header: Edit, Discharge, Print

### Diagnosis Module

**Diagnosis Entry Form:**
- Multi-step form with progress indicator at top
- Step 1: Vital Signs - 4-column grid for Temperature, BP, Heart Rate, O2 Saturation with unit labels
- Step 2: Symptoms - Tag-style input for multiple symptoms, auto-complete suggestions
- Step 3: Diagnosis - Rich text area for notes (h-32 minimum)
- Step 4: Treatment - Medication table builder + treatment plan text area
- Sticky footer with Previous/Next/Submit buttons
- Validation errors inline with red text and icon

**Diagnosis History Timeline:**
- Vertical timeline with connecting lines
- Each entry: Date badge (circular, on timeline) + Diagnosis card
- Cards expand/collapse to show full details
- Latest diagnosis highlighted with subtle accent
- Filter by date range at top

### Discharge System

**Discharge Modal:**
- Large centered modal (max-w-3xl)
- Header: "Discharge Patient: [Name]"
- Form sections: Discharge Summary (textarea), Medications (table), Follow-up Instructions (textarea), Discharge Date (date picker)
- Preview section showing formatted discharge report
- Footer: Cancel, Generate PDF, Complete Discharge buttons
- Success state: Confetti animation + success message

### Data Display

**Tables:**
- Sticky header row with medium weight labels
- Alternating row backgrounds for readability
- Row height: h-12 minimum for comfortable scanning
- Action column (right-aligned) with icon buttons
- Pagination controls at bottom (compact, showing 10/20/50 per page)
- Empty state: Centered illustration + message + CTA button

**Forms:**
- Input fields: h-10 with rounded corners (rounded-md)
- Labels above inputs with required asterisk indicator
- Helper text below inputs (text-sm) for guidance
- Error states: Red border, red text, error icon
- Success states: Green border briefly after valid input
- Disabled state: Reduced opacity with not-allowed cursor

### Interactive Elements

**Buttons:**
- Primary: Solid background, white text, h-10, px-6, rounded-md
- Secondary: Outline style with transparent background
- Danger: Red variant for delete/destructive actions
- Icon-only: Square (h-10 w-10) for compact actions
- Loading state: Spinner icon replacing button content

**Badges:**
- Compact pill shape (rounded-full, px-3, py-1)
- Status variants: Active (green), Pending (yellow), Discharged (gray), Critical (red)
- Text size: xs with medium weight

**Modals:**
- Backdrop: Semi-transparent overlay with backdrop blur
- Container: Centered, white background, rounded-lg, max-w-2xl default
- Header: pb-4 with border-b, close button (top-right)
- Content: p-6 with proper spacing
- Footer: pt-4 with border-t, buttons right-aligned

**Toast Notifications:**
- Fixed position top-right (top-4 right-4)
- Slide-in animation from right
- Auto-dismiss after 4 seconds
- Variants: Success (green), Error (red), Info (blue), Warning (yellow)
- Icon + Message + Close button

---

## Animations & Interactions

**Minimal Animation Strategy:**
- Page transitions: Subtle 150ms fade-in for content
- Modal entry/exit: Scale + fade (scale-95 to scale-100)
- Card hover: Elevation change only (shadow transition)
- Form validation: Quick shake on error (animate-shake)
- Success actions: Single confetti burst for major completions
- Loading states: Subtle pulse on skeleton loaders

**No animations for:**
- Table sorting/filtering (instant)
- Tab switching (immediate)
- Form field focus states

---

## Images

**Hero/Landing:** Not applicable - this is a dashboard application without marketing pages

**Application Images:**
- **Patient Avatars:** Circular placeholders with initials, 48px in lists, 96px in detail views
- **Empty States:** Simple medical-themed illustrations (clipboard, stethoscope) in muted colors, max 200px height
- **Document Previews:** Thumbnail grid (96px squares) with file type icons overlay