# Amardeep School – Live Bus Tracker (OSRM testing prototype)

## Files
- index.html, style.css, app.js: GitHub Pages website
- server.js: Node.js backend (must run on a Node.js host, not GitHub Pages)

## Deploy
1. Upload index.html, style.css, app.js to the ROOT of your GitHub repository. Replace existing files.
2. Enable GitHub Pages: Settings > Pages > Deploy from main branch / (root).
3. Deploy server.js on a Node.js host (start command: `node server.js`).
4. Edit `const API_URL=''` in app.js to the HTTPS base URL of your running backend, and commit.
5. Test with sample/non-sensitive GPS data.

Demo driver PIN: 1234. Demo management PIN: 4321. Both are client-side only, not secure.

## OSRM
The Parent dashboard uses the public OSRM demo for road distance and driving time (approximate, no live traffic). Parent coordinates are transmitted to OSRM for the routing request. This public service is for limited testing, not dependable production traffic.

## IMPORTANT
Do NOT use this prototype for real school bus tracking or student data. The backend has NO authentication: anyone with its URL can read, forge, or delete bus locations. The parent dashboard is public. The backend stores positions in memory, which resets on restart. Browser geolocation may stop in the background. A secure backend, access controls, and production-grade routing are required before live school deployment.
