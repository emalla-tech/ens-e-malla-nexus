# ENs - E-Malla Nexus

ENs is an Executive Operating System for managers, founders, and business owners to manage daily work, tasks, projects, customers, meetings, notes, reminders, goals, and company follow-ups.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React icons

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Mobile Install

ENs includes a PWA manifest, phone icons, service worker, and local persistence for tasks and CRM follow-ups.

To install it on a phone, deploy ENs to an HTTPS URL first, then:

- Android Chrome: open the URL, tap the menu, then tap "Add to Home screen" or "Install app".
- iPhone Safari: open the URL, tap Share, then tap "Add to Home Screen".

## Deployment

This project is ready for static Vite hosting.

Recommended options:

- Netlify: uses `netlify.toml`
- Vercel: uses `vercel.json`
- GitHub Pages: uses `.github/workflows/deploy.yml`

All options build from:

```bash
npm run build
```

and publish the `dist` folder.

## Supabase Setup

ENs is prepared for Supabase authentication and cloud sync.

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local`.
4. Add your project values:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. Restart the development server.

Until those keys are configured, ENs continues using local browser storage.

If tasks or CRM follow-ups save locally but do not appear on another device, run
`supabase/fix-task-sync.sql` in the Supabase SQL editor. It relaxes early MVP
foreign-key assumptions so ENs can sync mock project and customer identifiers.

## Project Structure

```text
src/
  components/
  data/
  hooks/
  layouts/
  pages/
  services/
  types/
  utils/
```

## MVP Features

- Executive dashboard with greeting, current date, metrics, meetings, follow-ups, quick notes, and project progress
- Task module with create, edit, delete, complete, priority, status, due date, project assignment, assignee, description, schedule, search, and filters
- Projects module with cards, progress, task counts, due dates, and project detail pages
- Customers module with CRM account cards, pipeline value, customer health, follow-up creation, completion, search, and filters
- Calendar, notes, goals, notifications, and settings pages
- Installable mobile PWA foundation with app manifest, service worker, theme metadata, and local task/follow-up persistence
- Responsive sidebar navigation for desktop, tablet, and mobile
- Supabase-ready auth, schema, row-level security, and cloud sync service layer

## Roadmap

1. Add Supabase authentication, database tables, row-level security, and typed clients.
2. Persist tasks, projects, notes, reminders, and customer follow-ups.
3. Add customer CRM views and meeting note workflows.
4. Add recurring reminders, notifications, and calendar integrations.
5. Add executive reporting, analytics, and exportable weekly summaries.
