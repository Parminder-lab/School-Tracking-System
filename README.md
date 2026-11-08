# Amardeep School – Live Bus Tracker (prototype)

Three pages are available via URL fragments: `#/parent`, `#/driver`, and `#/management`.

## Local demo
1. Install Node.js 18+.
2. Run `node server.js` in this folder.
3. Set `API_URL='http://localhost:3000'` near the top of `app.js`.
4. Serve the frontend with a local web server, e.g. `python -m http.server 8000`, and visit `http://localhost:8000/#/parent`.
5. Demo driver PIN: `1234`; management PIN: `4321`.

## GitHub Pages
Upload `index.html`, `style.css`, and `app.js` to a GitHub repository and enable Pages from the main branch/root. GitHub Pages serves the frontend only. For live tracking across devices, deploy `server.js` on a Node.js host with HTTPS and set `API_URL` in `app.js` to that host's URL. An HTTPS frontend cannot call an HTTP backend. No third-party login is needed for this demo.

## Critical safety limitations
- This is a **prototype**, not suitable for real student transportation data. The frontend PINs are public and the API is entirely unauthenticated. Anyone who discovers the API can overwrite or delete bus positions or read all live positions. Add server-side authorization, private access for parents, rate limits and transport security before real deployment.
- The backend stores locations **in memory**, so they disappear on server restart and will not synchronize across multiple backend instances.
- Phone browsers often pause geolocation when the screen locks or the app goes into the background. Continuous reliable tracking requires a dedicated mobile app or GPS hardware.
- ETA uses straight-line distance divided by current speed, not road routing; it may be inaccurate or unavailable when stationary.
- The parent location input accepts **latitude, longitude** rather than street addresses. Address lookup would need a geocoding service.
- Geolocation generally requires HTTPS or localhost.
- Drivers should not interact with the phone while driving.
