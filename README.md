# Amardeep School – Live Bus Tracker (School Pin + OSRM)

## What changed
- Permanent 🏫 campus marker at 31.56812830756984, 75.60527693091984 on **Parent** and **Management** maps only.
- Parent map also shows the selected active bus and optional parent location.
- Management map shows all currently active buses.
- Driver dashboard has no school marker or map.
- Parent OSRM road-distance calculation is preserved.
- `app.js` uses your existing Render backend: https://amardeep-bus-api.onrender.com

## Update GitHub Pages
1. Extract this ZIP.
2. Upload `index.html`, `style.css`, `app.js`, `server.js`, and `README.md` to the **root** of the `Parminder-lab/School-Tracking-System` repository, replacing existing files.
3. Commit to the `main` branch.
4. Wait for GitHub Pages deployment, then hard-refresh the website.
5. Test `#/parent` and `#/management`.

`server.js` is included for completeness. Your already-deployed Render service should not need redeployment unless you change it.

## Important safety limitations
This is a prototype only. Demo PINs are visible in browser source; the backend accepts unauthenticated location writes and reads. Do not use real school-bus tracking with students until access controls, privacy safeguards, and reliable hosting are added. The OSRM public demo is only for light testing. Free Render services may sleep or restart and this backend stores positions only in memory.
