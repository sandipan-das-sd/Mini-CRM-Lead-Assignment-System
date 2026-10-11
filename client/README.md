# LeadFlow CRM client

React 19, Vite, Tailwind CSS, and React Router frontend for the Lead Assignment System.

## Run

```bash
cp .env.example .env
npm install
npm run dev
```

The client runs at `http://localhost:5173` and calls `http://localhost:4000/api/v1` by default.

## Implemented screens

- Secure login with API errors, password visibility, and loading state.
- Protected dashboard with token restoration, role-aware metrics, status distribution, ownership totals, responsive navigation, refresh, error, empty, and skeleton states.

WebSockets are intentionally omitted. Login and dashboard are request/response workflows, and the dashboard already has explicit refresh plus short Redis caching. A socket server would add operational complexity without a real-time requirement.
