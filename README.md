# Amardeep School · Live Bus Tracker (branded prototype)

Includes the school's uploaded logo, forest-green/gold branding, a simpler parent/driver/management UI, and 6 selectable buses. Bus 7–10 remain recognized by the backend but are reserved and hidden from the UI.

## Deployment to your existing GitHub Pages + Render

1. Extract the ZIP.
2. In `Parminder-lab/School-Tracking-System`, upload and replace **index.html**, **style.css**, **app.js**, **server.js**, **README.md** and the `assets/school-logo.png` file. Ensure `assets/school-logo.png` exists in that exact directory.
3. Commit to `main`. GitHub Pages will publish automatically.
4. If Render is connected to this repository and auto-deploy is enabled, it will redeploy `server.js`. The API URL is already set to `https://amardeep-bus-api.onrender.com` in `app.js`.
5. Hard-refresh the website. Test with a non-sensitive simulated/test GPS location.

Site: https://parminder-lab.github.io/School-Tracking-System/
Backend health: https://amardeep-bus-api.onrender.com/api/health
Backend locations: https://amardeep-bus-api.onrender.com/api/locations

Demo PINs (for testing only): Driver `1234`; Management `4321`.

## Features

- Parent: select Bus 1–6; GPS permission or manual coordinates; school/bus/parent pins; road distance and driving ETA via OSRM public demo (30s refresh, no route line).
- Driver: Bus 1–6; location permission; start/stop sharing; speed and upload feedback.
- Management: school and active bus markers; six bus cards; moving/stopped/offline; straight-line distance to campus; reserved buses listed separately.
- Backend API compatible with the earlier starter; in-memory state only.

## Important limitations

**This is not a production-ready school transportation system.** Client-side PINs are visible to anyone inspecting JavaScript. The API is unauthenticated, publicly readable, and publicly writable. Do not share real school bus locations with it. Before real use, implement server-side authentication, authorization, abuse protection, private location access, a data-retention policy, and appropriate consent and security review.

Render Free instances may sleep and reset in-memory locations; mobile browsers may suspend GPS when locked. The OSRM public demo is for light testing and has no uptime guarantees. Road ETA is not traffic-aware, and is not a guaranteed arrival time. Parent GPS coordinates are sent to OSRM for the route calculation. OpenStreetMap tile use is subject to the tile server's usage policy.

School coordinates: 31.56812830756984, 75.60527693091984.


## November 2026 improvements
- Dedicated links `#/driver/1` through `#/driver/6` lock the driver interface to one bus. Share only the corresponding link with each driver. The generic `#/driver` no longer allows starting a bus.
- The warning banner on the PIN entry screens has been removed as requested; this does **not** add security. The backend is still unauthenticated. Do not use with real student transportation data until secured.
- Map: changed to canonical OpenStreetMap tile hostname, added tile error handling and map resize handling, and prevented repeated automatic zoom changes. Public tile availability is not guaranteed.
- Wake Lock is requested during tracking when supported; browsers still suspend background GPS and locked-screen GPS. For reliable background tracking use a native mobile app or dedicated GPS device.
- Existing Render URL is retained. No backend redeployment is required unless you also replace server.js.
