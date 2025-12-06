# 🎨 Fina App - Complete Color System

## Primary Colors

### Background Layers
```css
/* Level 1 - Base */
--app-bg: #0A0A0A
Use for: Main app background, deepest layer
RGB: 10, 10, 10
Example: body, main container

/* Level 2 - Cards */
--card-bg: #0F0F0F
Use for: Card backgrounds, panels, modals
RGB: 15, 15, 15
Example: metric-card, table-card, card-dark

/* Level 3 - Hover */
--card-hover: #141414
Use for: Hover states, active elements
RGB: 20, 20, 20
Example: card-dark:hover

/* Level 4 - Elevated */
#1a1a1b
Use for: Raised elements, dropdowns
RGB: 26, 26, 27
Example: control-btn:hover
```

### Borders & Lines
```css
--border: #1f2937
Use for: Default borders, dividers
RGB: 31, 41, 55

#374151 (Hover state)
Use for: Hover border effects
RGB: 55, 65, 81

#4b5563 (Active state)
Use for: Active/focused borders
RGB: 75, 85, 99
```

## Accent Colors

### Green - Success & Primary Actions
```css
--accent-green: #10b981
Use for: Primary buttons, success states, positive values
RGB: 16, 185, 129
Shades:
  Light: #34d399
  Dark:  #059669
  Glow:  rgba(16, 185, 129, 0.3)
```

### Blue - Information & Secondary
```css
--accent-blue: #3b82f6
Use for: Info badges, links, secondary actions
RGB: 59, 130, 246
Shades:
  Light: #60a5fa
  Dark:  #2563eb
  Glow:  rgba(59, 130, 246, 0.3)
```

### Purple - Special Features
```css
--accent-purple: #8b5cf6
Use for: Premium features, special highlights
RGB: 139, 92, 246
Shades:
  Light: #a78bfa
  Dark:  #7c3aed
  Glow:  rgba(139, 92, 246, 0.3)
```

### Red - Errors & Warnings
```css
#ef4444
Use for: Error states, delete actions, warnings
RGB: 239, 68, 68
Shades:
  Light: #f87171
  Dark:  #dc2626
```

### Yellow - Caution & Pending
```css
#f59e0b
Use for: Warning badges, pending states
RGB: 245, 158, 11
Shades:
  Light: #fbbf24
  Dark:  #d97706
```

## Text Colors

### Primary Text
```css
--text-primary: #e6eef8
Use for: Headings, important text
RGB: 230, 238, 248
Example: h1, h2, h3, important labels
```

### Secondary Text
```css
--text-secondary: #cbd5e1
Use for: Body text, descriptions
RGB: 203, 213, 225
Example: p, span, regular content
```

### Muted Text
```css
--text-muted: #94a3b8
Use for: Helper text, placeholders, secondary info
RGB: 148, 163, 184
Example: .text-muted, placeholders, hints
```

### Disabled Text
```css
#6b7280
Use for: Disabled elements, inactive states
RGB: 107, 114, 128
```

## Gradient Combinations

### Primary Gradient (Green to Blue)
```css
background: linear-gradient(135deg, #10b981, #3b82f6);
Use for: Primary action buttons, hero sections
```

### Secondary Gradient (Purple to Blue)
```css
background: linear-gradient(135deg, #8b5cf6, #3b82f6);
Use for: Premium features, special cards
```

### Dark Card Gradient
```css
background: linear-gradient(135deg, #1a1a1b 0%, #0f0f10 100%);
Use for: Elevated cards, interactive elements
```

### Subtle Card Gradient
```css
background: linear-gradient(135deg, rgba(20, 20, 20, 0.8) 0%, rgba(15, 15, 15, 0.9) 100%);
Use for: Metric cards, dashboard cards
```

### Button Gradient
```css
background: linear-gradient(135deg, #0f0f10 0%, #0a0a0b 100%);
Use for: Control buttons, secondary actions
```

## Shadow System

### Light Shadow
```css
box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
Use for: Cards at rest
```

### Medium Shadow
```css
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
Use for: Elevated cards, hover states
```

### Heavy Shadow
```css
box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
Use for: Modals, popovers
```

### Accent Shadow (Green)
```css
box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
Use for: Primary buttons, glowing effects
```

### Accent Shadow (Blue)
```css
box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
Use for: Info elements, secondary glows
```

## Opacity Variations

### Background Overlays
```css
rgba(0, 0, 0, 0.3)  - Light overlay
rgba(0, 0, 0, 0.5)  - Medium overlay
rgba(0, 0, 0, 0.75) - Heavy overlay
```

### Accent Backgrounds
```css
rgba(16, 185, 129, 0.1)  - Success background
rgba(59, 130, 246, 0.1)  - Info background
rgba(239, 68, 68, 0.1)   - Error background
rgba(245, 158, 11, 0.1)  - Warning background
```

### Hover Overlays
```css
rgba(255, 255, 255, 0.05) - Subtle highlight
rgba(255, 255, 255, 0.1)  - Medium highlight
```

## Usage Examples

### Metric Card
```jsx
<div style={{
  background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.8) 0%, rgba(15, 15, 15, 0.9) 100%)',
  border: '1px solid #1f2937',
  borderRadius: '12px',
  padding: '20px'
}}>
  <h3 style={{ color: '#e6eef8' }}>Total Balance</h3>
  <p style={{ color: '#10b981', fontSize: '28px', fontWeight: '700' }}>
    ₹12,345
  </p>
  <span style={{ color: '#94a3b8', fontSize: '13px' }}>
    Updated just now
  </span>
</div>
```

### Primary Button
```jsx
<button style={{
  background: 'linear-gradient(135deg, #10b981, #059669)',
  color: 'white',
  padding: '10px 20px',
  borderRadius: '8px',
  border: 'none',
  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
}}>
  Save Changes
</button>
```

### Status Badge
```jsx
<span style={{
  background: 'rgba(16, 185, 129, 0.1)',
  border: '1px solid rgba(16, 185, 129, 0.3)',
  color: '#10b981',
  padding: '6px 12px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '600'
}}>
  Active
</span>
```

## Component Color Mapping

### Dashboard
- Background: `#0A0A0A`
- Metric Cards: `linear-gradient(135deg, rgba(20, 20, 20, 0.8), rgba(15, 15, 15, 0.9))`
- Chart Colors: `#10b981`, `#3b82f6`, `#8b5cf6`
- Text: `#e6eef8` (headers), `#cbd5e1` (body)

### Accounts
- Card Background: `#0F0F0F`
- Hover State: `#141414`
- Border: `#1f2937`
- Positive Values: `#10b981`
- Negative Values: `#ef4444`

### Tables
- Header Background: `#0A0A0A`
- Row Background: `#07070733` (zebra stripes)
- Border: `#1f2937`
- Hover: `#0f1113`

### Buttons
- Primary: `linear-gradient(135deg, #10b981, #059669)`
- Secondary: `linear-gradient(135deg, #1f2937, #111827)`
- Ghost: `transparent` with `rgba(255, 255, 255, 0.05)` hover

### Forms
- Input Background: `linear-gradient(135deg, #0f0f10, #0a0a0b)`
- Input Border: `#1f2937`
- Input Focus: `#10b981` with `rgba(16, 185, 129, 0.1)` glow
- Placeholder: `#94a3b8`

## Accessibility Notes

### Contrast Ratios (WCAG AA compliant)
- `#e6eef8` on `#0A0A0A`: ✅ 18.5:1
- `#cbd5e1` on `#0F0F0F`: ✅ 13.2:1
- `#10b981` on `#0A0A0A`: ✅ 4.8:1
- `#3b82f6` on `#0A0A0A`: ✅ 5.2:1

### Recommendations
- Use `#e6eef8` for important text
- Pair `#10b981` with dark backgrounds only
- Add bold weight for smaller accent-colored text
- Ensure 3px+ borders for focus states

## Quick Reference Card

```
┌─────────────────────────────────────────────┐
│ FINA COLOR SYSTEM - QUICK REFERENCE        │
├─────────────────────────────────────────────┤
│ BACKGROUNDS                                  │
│ ████ #0A0A0A  Base                          │
│ ████ #0F0F0F  Cards                         │
│ ████ #141414  Hover                         │
├─────────────────────────────────────────────┤
│ ACCENTS                                      │
│ ████ #10b981  Green (Primary)               │
│ ████ #3b82f6  Blue (Info)                   │
│ ████ #8b5cf6  Purple (Special)              │
│ ████ #ef4444  Red (Error)                   │
│ ████ #f59e0b  Yellow (Warning)              │
├─────────────────────────────────────────────┤
│ TEXT                                         │
│ ████ #e6eef8  Primary                       │
│ ████ #cbd5e1  Secondary                     │
│ ████ #94a3b8  Muted                         │
├─────────────────────────────────────────────┤
│ BORDERS                                      │
│ ████ #1f2937  Default                       │
│ ████ #374151  Hover                         │
└─────────────────────────────────────────────┘
```

---

**Copy this file to your design system documentation!**
