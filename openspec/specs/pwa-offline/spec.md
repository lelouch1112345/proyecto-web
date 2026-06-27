# PWA Offline Specification

## Purpose

Make the app installable and fully functional without internet after initial load.

## Requirements

| # | Requirement | Scenarios |
|---|-------------|-----------|
| R1 | MUST register a service worker on app load via vite-plugin-pwa | H1 |
| R2 | MUST prompt the user to install the app (browser beforeinstallprompt) | H1 |
| R3 | MUST serve a valid Web App Manifest (name, icons, theme_color, display: standalone) | H1 |
| R4 | MUST pre-cache all static assets on first visit for offline use | H1 |
| R5 | MUST show an offline fallback page when the network is unavailable and resource is uncached | E1 |
| R6 | MUST handle service worker update flow (skip-waiting + user prompt to reload) | H2 |
| R7 | SHOULD declare `display: standalone` and the app's color scheme in the manifest | H1 |

### Scenarios

#### H1: Happy path — fresh install, full offline

- GIVEN a user visits the app for the first time online
- WHEN the page loads
- THEN service worker registers and pre-caches all assets (HTML, JS, CSS, icons)
- WHEN the browser fires `beforeinstallprompt`
- THEN the app shows an install button
- AFTER install and going offline
- WHEN the user opens the app
- THEN all pages load from cache with full functionality

#### H2: Service worker update available

- GIVEN user has the app installed with an older cache
- WHEN a new version is deployed and detected by the SW
- THEN a toast appears: "Update available — reload to get the latest version"

#### E1: Offline with uncached navigation

- GIVEN the user navigates to a route not in the pre-cache while offline
- WHEN the SW intercepts the request
- THEN it serves a minimal offline fallback page
