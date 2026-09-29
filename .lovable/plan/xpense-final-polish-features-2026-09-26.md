# Xpense — Final Polish & Features

## What I'll add

### 1. Small useful features
- **Quick add today**: a button on the dashboard that opens today's entry dialog directly — no need to open the sheet first.
- **Undo last entry**: after saving a day, a toast with an "Undo" button restores the previous amounts for a few seconds.
- **Daily streak / spending-free days**: small dashboard card showing no-spend days this month (a light motivational touch).

### 2. Dark mode
- A sun/moon toggle in the top menu, next to the sign-out button.
- Remembers your choice on the device; defaults to your system setting.
- All pages (dashboard, sheet, dialogs, charts) get proper dark colors using the existing theme tokens — no hardcoded colors.

### 3. Mobile app feel (installable)
- Add an app manifest with the Xpense logo, name, and theme color so you can "Add to Home Screen" on your phone and open it like a real app (full screen, own icon).
- Manifest-only: no offline mode, no service worker — safe for the preview.

### 4. Smoother animations
- Gentle fade/slide-in when pages and cards load.
- Subtle hover lift on cards and buttons.
- Smooth dialog open/close transitions.

## Technical notes
- Dark mode: add a `.dark` class toggle on the root element, persisted in localStorage; define dark values for the existing CSS tokens in `src/styles.css` (background, card, primary, category colors, chart colors).
- PWA: `public/manifest.webmanifest` + icon files + head tags in `src/routes/__root.tsx` (manifest link, theme-color, apple-touch-icon). No service worker.
- Animations: use the existing `animate-fade-in`, `scale-in`, `hover-scale` utility classes; add staggered entrance on dashboard cards.
- Quick add reuses the existing `DayEntryDialog`; undo keeps a snapshot of the day's previous values in memory and re-saves via the existing `saveDay` server function.
- No database changes needed.

## Verification
- Typecheck + build clean.
- Playwright check on desktop and mobile widths: dark mode toggle works and persists, quick add saves, undo restores, manifest served, no console errors.
