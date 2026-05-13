# Soccer Attendance Tracker ⚽

A simple, browser-based web app to track soccer player attendance. No backend or database required — data is stored in the browser's `localStorage`.

## Features

- **Player dropdown** — select from a pre-loaded roster or add your own players
- **Date & session picker** — log attendance for any date and optional session/event name
- **Present / Absent marking** — one click to record status
- **Attendance records table** — filterable by player, sortable by date
- **Attendance summary** — per-player totals and a visual percentage bar
- **CSV export** — download all records as a spreadsheet
- **Persistent storage** — data survives page refreshes via `localStorage`

## Getting Started

### Option 1 — GitHub Pages (recommended)

1. Fork or clone this repository.
2. Go to **Settings → Pages** in your GitHub repo.
3. Set **Source** to the `main` branch, root folder (`/`).
4. Visit `https://<your-username>.github.io/<repo-name>/`.

### Option 2 — Run locally

Just open `index.html` in any modern browser — no server needed.

## File Structure

```
soccer-attendance/
├── index.html   # App markup
├── style.css    # Dark-theme styles
├── app.js       # All app logic + localStorage persistence
└── README.md
```

## Customising the Default Player List

Edit the `DEFAULT_PLAYERS` array at the top of `app.js`:

```js
const DEFAULT_PLAYERS = [
  'Alex Johnson', 'Maria Garcia', ...
];
```

This list is only used on the very first load (when no saved data exists).
