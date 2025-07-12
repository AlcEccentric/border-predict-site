# LocalStorage Keys Reference

This document describes all localStorage keys used in the ミリシタ・ボーダー予想 application for persisting user preferences.

## Keys Used

### Theme Preferences
- **`theme`** - Current theme selection (e.g., 'nord', 'cupcake', 'dim', 'aqua', 'sunset')
  - Used in: `App.tsx`, `ThemeSelector.tsx` (via themeStorage.ts)
  - Default: 'cupcake'

### Type 5 Event Preferences (Anniversary Events)
- **`selectedIdol`** - Currently selected idol ID (1-52)
  - Used in: `Type5EventPage.tsx`
  - Default: 1
  - Validation: Must be between 1-52 and have available prediction data

- **`showNeighbors`** - Whether to show neighbor comparison section
  - Used in: `Type5EventPage.tsx`
  - Default: false

### Normal Event Preferences (Event Types 3, 4, 11, 13)
- **`activeTab`** - Active border tab ('100' or '2500')
  - Used in: `App.tsx` → `BorderTabs.tsx`
  - Default: '100'

- **`normalEventShowNeighbors`** - Whether to show neighbor comparison section for normal events
  - Used in: `App.tsx` → `BorderTabs.tsx`
  - Default: false
  - Note: Uses different key from Type 5 events to avoid conflicts

## Implementation Notes

1. **Error Handling**: All localStorage access is wrapped in try-catch blocks to handle cases where localStorage is not available or quota exceeded.

2. **Validation**: 
   - Theme values are validated against available themes
   - Idol IDs are validated to be within range (1-52) and have available data
   - Boolean values are explicitly checked for 'true' string

3. **Fallback Values**: All keys have sensible defaults when localStorage is empty or unavailable.

4. **Separation**: Normal event and Type 5 event preferences use different keys to avoid conflicts when switching between event types.
