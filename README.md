# LeadFlow — Mini CRM Lead Assignment System

Production-oriented CRM for capturing, deduplicating, assigning, and tracking sales leads. It implements separate Admin and Sales roles, an immutable activity trail, concurrency-safe assignment, reporting, email jobs, and real-time notifications.

## Live application

- Frontend: https://crm.sandipandas.website
- API health: https://api.sandipandas.website/api/v1/health
- Interactive API documentation: https://api.sandipandas.website/api-docs
- Raw OpenAPI specification: https://api.sandipandas.website/openapi.yaml
- OpenAPI source: [`server/v1/docs/openapi.yaml`](server/v1/docs/openapi.yaml)
- Deployment guide: [`DEPLOYMENT.md`](DEPLOYMENT.md)

Credentials are intentionally not committed. The initial admin is created from private production environment variables. Admins create sales accounts from the application.

![LeadFlow social preview](client/public/og-leadflow.png)

## Architecture

```text
Browser / React + Vite + Tailwind
             |
       HTTPS / Socket.IO
             |
Host Nginx --+--> static React build
             +--> Express API container
                       |-- MySQL 8.4 (authoritative data)
                       |-- Redis 7.4 (rate limits, cache, BullMQ)
                       +-- Worker container (transactional email)
```

The backend follows route -> controller -> service -> repository layers. Services own business rules and transactions; repositories contain SQL; policies enforce ownership and status transitions.

## Features

### Admin

- Create, list, view, activate, and deactivate sales users.
- Create, search, filter, view, and update leads.
- Assign and reassign leads to active salespeople.
- Approve or reject salesperson reassignment requests.
- View organization-wide dashboard statistics and complete activity history.

### Sales

- View only personally assigned leads.
- Update permitted lead fields and lifecycle status.
- Add notes and view lead history.
- Request reassignment; direct reassignment is admin-only.
- View a dashboard scoped to personally assigned leads.

### Reliability and operations

- Normalized phone/email duplicate detection plus database unique constraints.
- Idempotent lead creation using `Idempotency-Key`.
- Optimistic `version` checks and row locking for concurrent changes.
- MySQL transactions keep the lead, assignment, and activity history consistent.
- Append-only assignment and activity history.
- Redis-backed login rate limiting and dashboard caching.
- BullMQ/Nodemailer email delivery with retry.
- Persistent authenticated Socket.IO notifications with unread state.
- Cursor pagination and indexed filtering.
- OpenAPI documentation, Docker production topology, HTTPS, and health checks.

## Important business decisions

- A matching normalized phone **or** email is a duplicate. If phone and email point to different leads, the API returns `409 CONTACT_CONFLICT`; it never merges silently.
- Phone/email are nullable individually, but at least one is mandatory. Unique indexes allow multiple `NULL` values while preventing races.
- `converted` and `lost` are terminal states.
- Salespeople cannot access another owner's lead by changing an ID; ownership is included in repository queries.
- A user with assigned leads cannot be deactivated until those leads are explicitly reassigned. Historical ownership is never rewritten.
- Lead deletion is intentionally not exposed because auditability is a core requirement.
- Important multi-write operations use one transaction. Failure rolls back every related write.

More detail is in [`server/v1/docs/decisions.md`](server/v1/docs/decisions.md).

## Repository layout

```text
client/                  React frontend
server/v1/controller/    HTTP translation
server/v1/services/      Business rules and transactions
server/v1/repositories/  MySQL queries
server/v1/policies/      Ownership and status rules
server/v1/db/            Migrations, seed, connection helpers
server/v1/realtime/      Authenticated Socket.IO server
server/v1/email/         Responsive email templates
server/v1/workers/       BullMQ email worker
server/v1/docs/          OpenAPI and technical decisions
server/v1/tests/         Fast and database-backed tests
deploy/nginx/            Production virtual hosts
```

## Local development

Requirements: Node.js 20+, Docker Engine with Compose.

```bash
git clone https://github.com/sandipan-das-sd/Mini-CRM-Lead-Assignment-System.git
cd Mini-CRM-Lead-Assignment-System/server/v1
cp .env.example .env
docker compose up -d mysql redis
npm ci
npm run db:migrate
npm run db:seed
npm start
```

In a second terminal:

```bash
cd server/v1
npm run worker:notifications
```

In a third terminal:

```bash
cd client
npm ci
npm run dev
```

Local URLs:

- Frontend: http://localhost:5173
- API: http://localhost:4000/api/v1
- Health: http://localhost:4000/api/v1/health

Never commit `.env`, `.env.production`, SMTP credentials, database passwords, or JWT secrets.

## Tests

Fast unit/security tests require no Docker:

```bash
cd server/v1
npm ci
npm test
```

Real integration tests use disposable MySQL and Redis containers. The database uses `tmpfs`, is isolated from development/production, and is removed afterward:

```bash
npm run test:docker
npm run test:docker:down
```

The database suite covers lead creation plus activity, normalized duplicates, idempotent replay, assignment/reassignment history, competing assignments, and rollback after a simulated failure.

Frontend verification:

```bash
cd client
npm ci
npm run format:check
npm run lint
npm run build
npm audit
```

## Production deployment on the current VPS

Production uses host Nginx and Docker Compose for API, worker, MySQL, and Redis. PM2 is not used. MySQL and Redis have no public ports.

```bash
ssh root@YOUR_VPS_IP
cd ~/Mini-CRM-Lead-Assignment-System
git pull

cd server/v1
docker compose --env-file .env.production -f compose.production.yaml config --quiet
docker compose --env-file .env.production -f compose.production.yaml up -d mysql redis
docker compose --env-file .env.production -f compose.production.yaml --profile tools run --rm migrate
docker compose --env-file .env.production -f compose.production.yaml up -d --build api worker
docker compose --env-file .env.production -f compose.production.yaml ps
curl http://127.0.0.1:4000/api/v1/health
```

Build and publish the frontend:

```bash
cd ~/Mini-CRM-Lead-Assignment-System
docker run --rm -v "$PWD/client:/app" -w /app node:20-alpine sh -c "npm ci && npm run build"
rm -rf /var/www/leadflow/client/dist
mkdir -p /var/www/leadflow/client
cp -r client/dist /var/www/leadflow/client/dist
nginx -t
systemctl reload nginx
```

The API Nginx `location /` must preserve WebSocket upgrade headers:

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

Run the isolated database tests on the VPS before final submission:

```bash
cd ~/Mini-CRM-Lead-Assignment-System/server/v1
npm run test:docker
npm run test:docker:down
```

This creates disposable test containers only. It does not connect to `.env.production` or production volumes.

## Production verification

```bash
curl -fsS https://api.sandipandas.website/api/v1/health
curl -I https://crm.sandipandas.website
curl -I https://crm.sandipandas.website/og-leadflow.png
docker compose --env-file .env.production -f compose.production.yaml ps
docker compose --env-file .env.production -f compose.production.yaml logs --tail=100 api worker
certbot renew --dry-run
```

Expected health response:

```json
{"data":{"status":"ok"}}
```

## Security notes

- Passwords are bcrypt hashes and are never returned by APIs.
- JWTs are short lived and contain `sub`, role, and token version.
- Deactivation or password reset increments token version and revokes old tokens.
- Login errors intentionally do not reveal whether an email exists.
- Validation uses strict schemas, prepared SQL parameters, Helmet, restricted CORS, and role/ownership policies.
- Rotate any credential ever pasted into chat, terminal recordings, tickets, or screenshots.
