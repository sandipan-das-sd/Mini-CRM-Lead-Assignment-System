# Mini CRM API (authentication foundation)

This folder currently implements the authentication foundation and the database schema for the Lead Assignment System. The empty lead, assignment, activity and dashboard files are extension points; their endpoints are not registered yet.

## Run locally

Requirements: Node.js 20+, Docker (or MySQL 8.0+).

```bash
cp .env.example .env
docker compose up -d mysql
npm install
npm run db:migrate
npm run db:seed
npm start
```

Change `JWT_SECRET`, `ADMIN_PASSWORD`, and database passwords before any deployment. The API base URL is `http://localhost:4000/api/v1`.

## Authentication API

- `POST /auth/login` — body: `{ "email": "admin@example.com", "password": "..." }`
- `GET /auth/me` — header: `Authorization: Bearer <accessToken>`
- `GET /health` — public health response

There is deliberately no public registration endpoint. Admin creation is a deployment/bootstrap action (`npm run db:seed`); future sales-user creation belongs behind an admin-only endpoint.

## User-management API

All user routes require an admin Bearer token.

- `POST /users` — create a sales user with `name`, `email`, and a strong `password`.
- `GET /users?role=sales&isActive=true&limit=25&cursor=10` — cursor-paginated users.
- `GET /users/:id` — retrieve one user.
- `PATCH /users/:id/status` — body: `{ "isActive": false }`.

An admin cannot deactivate their own account. A salesperson with currently assigned leads cannot be deactivated until an admin reassigns those leads. Deactivation increments `token_version`, immediately invalidating that user's existing access tokens. Historical records are never reassigned or deleted.

## Lead-management API

- `POST /leads` — admin only; requires an `Idempotency-Key` header and `name`, `source`, plus at least one of `phone` or `email`.
- `GET /leads` — admin sees all leads; sales users see only assigned leads.
- `GET /leads/:id` — sales users receive `404` for leads not assigned to them.
- `PATCH /leads/:id` — update `name`, `phone`, `email`, or `source`; include the current numeric `version`.

List filters are `search`, `status`, `source`, `assignedUserId`, `createdFrom`, `createdTo`, `limit`, and `cursor`. `search` uses a name-prefix lookup and exact normalized email/phone matching. A sales user's supplied `assignedUserId` is ignored in favor of their authenticated user ID.

Example lead creation:

```http
POST /api/v1/leads
Authorization: Bearer <admin-token>
Idempotency-Key: 6763f80d-7171-4f18-ac82-55644ed08f1d
Content-Type: application/json

{
  "name": "Rahul Das",
  "phone": "+91 98765-43210",
  "email": "Rahul@example.com",
  "source": "website"
}
```

Lead updates use optimistic concurrency. If two clients read version `1`, only the first update succeeds and changes the version to `2`; the second receives `409 STALE_LEAD_VERSION` and must reload before retrying.

Access tokens expire after 15 minutes by default. Every protected request also loads the user from MySQL and compares `token_version`. Deactivation (`is_active = false`) therefore blocks access immediately. Incrementing `token_version` revokes all issued tokens for a user.

## Using role authorization

```js
const authenticate = require('./middleware/authenticate');
const authorize = require('./middleware/authorize');
const { ROLES } = require('./constants/roles');

router.post('/users', authenticate, authorize(ROLES.ADMIN), createSalesUser);
```

Authentication establishes identity and authorization decides whether that identity may act. Lead endpoints must additionally enforce ownership in the SQL query (for example `WHERE id = ? AND assigned_user_id = ?`) so a sales user cannot access another user's lead by changing a URL ID.

## `db/transaction.js`

`withTransaction` keeps related writes atomic. Lead assignment should update the current owner, close the previous assignment, create the new assignment, and write activity history on the same supplied connection:

```js
await withTransaction(async (db) => {
  const lead = await leadRepository.findByIdForUpdate(leadId, db); // SELECT ... FOR UPDATE
  await assignmentRepository.closeCurrent(lead.id, db);
  await leadRepository.assign(lead.id, salesUserId, lead.version, db);
  await assignmentRepository.create(
    { leadId, fromUserId: lead.assigned_user_id, toUserId: salesUserId, actorId },
    db,
  );
  await activityRepository.create({ leadId, actorId, type: 'reassigned' }, db);
});
```

If any statement fails, all are rolled back. `FOR UPDATE` plus the lead `version` supports safe concurrent assignment; a stale version should produce HTTP 409.

## `idempotency.service.js`

Idempotency prevents a client retry from creating the same mutation twice. For create-lead/assignment APIs, require `Idempotency-Key`, reserve it inside the business transaction, then store the response:

```js
await withTransaction(async (db) => {
  const state = await idempotency.reserve(
    { userId, operation: 'create-lead', key, payload: req.body },
    db,
  );
  if (state.replay) return state;
  const lead = await leadRepository.create(req.body, db);
  const body = { data: { lead } };
  await idempotency.complete(
    { userId, operation: 'create-lead', key, statusCode: 201, responseBody: body },
    db,
  );
  return { statusCode: 201, body };
});
```

The unique constraint `(user_id, operation, idempotency_key)` is the final concurrency guard. Reusing a key with a different request hash returns 409. Completed responses can be replayed. A scheduled cleanup should delete expired rows.

## Database decisions

- Normalized phone and lowercase email are unique when present. MySQL permits multiple `NULL` values, so leads may have only one contact field. A collision on either field means the enquiry attaches to the existing lead; if phone and email point to two different existing leads, return 409 for manual resolution rather than merging silently.
- Users and leads use soft deletion. Foreign keys use `RESTRICT` for auditable actors/history; activities may retain a deleted actor as `NULL` while their display snapshot can later be included in `changes`.
- Assignment history is append-only. Deactivating a salesperson does not rewrite history; affected current leads should be explicitly bulk-reassigned by an admin transaction.
- Composite indexes match common cursor-pagination and dashboard filters. `%term%` name search will eventually need MySQL full-text or a search service; ordinary B-tree indexes do not optimize leading-wildcard search.
- `converted` and `lost` should be terminal statuses unless an admin performs a separately audited reopen operation.
