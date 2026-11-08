# Amardeep School Bus Tracking — GitHub Pages + Supabase

This version replaces Firebase with Supabase. GitHub Pages hosts the website; Supabase Auth, Postgres and Realtime share bus locations.

## A. Create and configure Supabase (one-time)
1. Create a project at https://supabase.com/.
2. Open **SQL Editor → New query**, paste all of `supabase-setup.sql`, and run it.
3. Open **Project Settings → API** (or API Keys) and copy the Project URL and `anon` / publishable key.
4. Paste them into `supabase-config.js`:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
5. Replace `SCHOOL_LOCATION` with the exact school latitude and longitude.

The browser key is designed to be public. Never put a `service_role` or secret key in this website. Row Level Security (RLS) is enabled in the supplied SQL; do not disable it.

## B. Create user accounts and profiles
In Supabase **Authentication → Users**, create each driver, parent and management account with email and password. Copy each user's UUID.

Then add one row per user in **Table Editor → profiles** (or SQL Editor):
- Driver: `id` = Auth UUID, `role` = `driver`, `name` = driver name, `bus_id` = `Bus 01` (through `Bus 10`).
- Parent: `id` = Auth UUID, `role` = `parent`, `name` = parent name, `bus_ids` = array such as `{"Bus 01"}`.
- Management: `id` = Auth UUID, `role` = `management`, `name` = staff name, leave `bus_id` blank and `bus_ids` empty.

Example SQL (replace UUIDs and names):
```sql
insert into public.profiles (id, role, name, bus_id)
values ('DRIVER-AUTH-UUID', 'driver', 'Driver One', 'Bus 01');

insert into public.profiles (id, role, name, bus_ids)
values ('PARENT-AUTH-UUID', 'parent', 'Parent One', array['Bus 01']);

insert into public.profiles (id, role, name)
values ('MANAGEMENT-AUTH-UUID', 'management', 'Transport Admin');
```

## C. Publish on GitHub Pages
1. Upload the contents of this folder to the root of your repository (not the enclosing folder).
2. Commit and push to the `main` branch.
3. In GitHub repository **Settings → Pages**, select **GitHub Actions** as the build/deployment source.
4. The included `.github/workflows/deploy.yml` deploys the site after a push to `main`.

Your portal links will be:
- Home: `https://parminder-lab.github.io/School_Tracking_System/`
- Driver: `https://parminder-lab.github.io/School_Tracking_System/driver.html`
- Parent: `https://parminder-lab.github.io/School_Tracking_System/parents.html`
- Management: `https://parminder-lab.github.io/School_Tracking_System/management.html`

## D. Test before sharing
1. Sign in as a driver, start tracking, and check that a row appears in `bus_locations`.
2. Sign in as a parent assigned to that bus and check the map and location update.
3. Sign in as management and check all ten buses.
4. Test that a parent cannot read a bus that is not assigned to them.

## Important limitations
- GPS requires HTTPS, browser permission, and the driver page to remain open. Mobile browsers may pause tracking in the background.
- Parent distance is straight-line distance and ETA is a rough estimate, not a road-route prediction.
- Obtain consent for driver location tracking, explain when tracking is active, restrict access and define a retention policy before production use.
- Frontend pages are public. Data access is protected by Supabase Auth and RLS, not by GitHub Pages.
