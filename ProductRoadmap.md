# Product Roadmap — College Real-Time Communication Platform

| | |
| :--- | :--- |
| **Document version** | 2.0 |
| **Date** | 13 November 2026 |
| **Scope** | Entire repository at commit `67e6759` (backend, frontend, database, Docker, tests, docs) |
| **Estimation unit** | Ideal engineering hours; development and testing are estimated separately |

---

## 1. Executive Summary

The platform is a working multi-college chat and notification system built on Node.js, Express, Socket.IO, MySQL/Sequelize and a vanilla-JS Bootstrap frontend. The code has a clean layered architecture and a good relational model, and real-time messaging works end to end.

The repository review found that **the product is not yet safe to put in front of real students**. Any visitor can register as a `super_admin`. Any logged-in user can read and post in another college's department and batch channels. College admins can edit or delete users and colleges that belong to other institutions. Secrets and `node_modules` are committed to git. The automated tests mock the data layer, so none of these defects are caught.

The roadmap is therefore sequenced as follows:

1. **Phase 0 — Security & Tenant Isolation** (blocking; must ship before any pilot)
2. **Phase 1 — Engineering Foundation** (real tests, CI, migrations, observability)
3. **Phase 2 — Core Messaging Completeness** (finish features whose data model already exists but are unfinished or unused)
4. **Phase 3 — Scale & Reliability** (multi-instance sockets, presence, push, backups)
5. **Phase 4 — Administration, Identity & Trust** (onboarding, SSO, moderation, compliance)
6. **Phase 5 — AI-Assisted Features** (summaries, drafting, campus knowledge assistant, assisted moderation)

AI features come last on purpose. They depend on tenant isolation (Phase 0), file uploads (Phase 2), background jobs (Phase 3) and moderation workflows (Phase 4). Shipping them earlier would put an LLM on top of a data layer that currently leaks across colleges.

**Total estimated effort:** 738 development hours + 359 testing hours = **1,097 hours** across 47 work items.

---

## 2. Current State Assessment

### 2.1 What exists today

| Area | Capability |
| :--- | :--- |
| **Tenancy model** | Colleges → Departments → Courses → Batches; users linked by `college_id` and student/faculty profiles |
| **Roles** | `super_admin`, `college_admin`, `faculty`, `student`, enforced by the [roleMiddleware.js](backend/src/middlewares/roleMiddleware.js) role check |
| **Real-time** | JWT-authenticated Socket.IO; auto-join of `user:`, `college:`, `department:`, `batch:` and `room:` channels; typing indicators; online/offline presence; sent/delivered/read receipts |
| **Chat** | College, department, batch, group and direct rooms; cursor pagination API (`before_id`); `parent_message_id` and `media_url` columns |
| **Notifications** | Persisted per-user notifications with unread counts; announcements table with department/course/batch/role/expiry columns |
| **Frontend** | Single-page dashboard: chat, announcements, notifications, admin directories (colleges, departments, students, faculty) |
| **Ops & docs** | Docker Compose (MySQL, backend, Nginx), auto-seeding, Swagger UI, API/socket reference docs |

### 2.2 Strengths to preserve

- **Clean layering** (routes → controllers → services → repositories → models), which makes the authorization fixes in Phase 0 localized.
- **A normalized schema** with foreign keys, unique constraints and sensible indexes ([init.sql](backend/database/init.sql)).
- **Output escaping** is applied consistently when rendering messages and directory data ([ui.js:69](frontend/js/ui.js#L69)).
- **Graceful shutdown** and DB connection retry are already implemented ([server.js](backend/src/server.js), [database.js](backend/src/config/database.js)).

### 2.3 Critical findings (drive Phase 0)

| # | Finding | Evidence |
| :--- | :--- | :--- |
| 1 | Public registration accepts `role_id` and `college_id` from the request body. Anyone can self-register as `super_admin` (role 1). | [authController.js:18](backend/src/controllers/authController.js#L18), [authService.js:18](backend/src/services/authService.js#L18) |
| 2 | REST chat endpoints check membership only for `direct` and `group` rooms. Any user can read message history and post into **any college's** college, department or batch room by ID. | [chatService.js:18](backend/src/services/chatService.js#L18), [chatService.js:61](backend/src/services/chatService.js#L61) |
| 3 | `college_admin` can update or delete any user and update any college. There is no same-college check, and `updateCollege` passes `req.body` straight to the ORM (mass assignment). Department, course and batch creation accept arbitrary parent IDs. | [collegeController.js:45](backend/src/controllers/collegeController.js#L45), [userController.js:55](backend/src/controllers/userController.js#L55) |
| 4 | Socket `message:read`, `message:delivered` and `user:typing` events don't verify room access. `notification:send` with `targetUserId` can reach users in other colleges. Role-targeted notifications are pushed live to the **whole** college room. | [socketEvents.js:143-248](backend/src/sockets/socketEvents.js#L143-L248) |
| 5 | `backend/.env` and `backend/node_modules` are committed. The JWT secret has a hard-coded fallback. Compose files embed DB and JWT credentials and expose MySQL on host port 3306. | [jwtHelper.js:3](backend/src/utils/jwtHelper.js#L3), [docker-compose.yml](docker-compose.yml) |
| 6 | CORS allows `*` with credentials, CSP is disabled, demo quick-login chips with real passwords ship in the production UI, and CDN scripts load without Subresource Integrity (SRI). | [app.js:18-21](backend/src/app.js#L18-L21), [index.html](frontend/index.html) |
| 7 | No input schema validation. `limit` query parameters are uncapped, messages have no length limit, and sockets have no rate limit. | [chatController.js:60](backend/src/controllers/chatController.js#L60) |

### 2.4 Functional and engineering gaps (drive Phases 1–4)

- **Tests do not test the system.** [tests/runner.js](backend/tests/runner.js) replaces repositories with an in-memory store, so authorization and SQL behaviour are never exercised. There is no CI.
- **Schema is altered on every boot.** `sequelize.sync({ alter: true })` runs at startup because `AUTO_SEED=true` in production compose ([seed.js:25](backend/database/seed.js#L25)). There are no migrations.
- **Frontend breaks behind HTTPS.** When the page has no explicit port, [config.js:13](frontend/js/config.js#L13) points API and socket calls to `http://<host>:5000`, which bypasses the Nginx proxy and causes mixed-content failures.
- **REST writes are invisible in real time.** Messages, notifications and announcements created over REST are persisted but never emitted over Socket.IO.
- **Announcement targeting is unimplemented.** `department_id`, `role` and `expires_at` are stored but ignored when reading ([notificationRepository.js:88](backend/src/repositories/notificationRepository.js#L88)).
- **Read receipts are incomplete in channel rooms.** `message_status` rows exist only for explicit room members, and `markRoomAsRead` loads every message ID in the room into memory ([chatRepository.js:206](backend/src/repositories/chatRepository.js#L206)).
- **Deleting a user erases their message history** everywhere through `ON DELETE CASCADE` ([init.sql:188](backend/database/init.sql#L188)).
- **Presence is single-process and leaks state.** It lives in an in-memory `Map` ([socketEvents.js:8](backend/src/sockets/socketEvents.js#L8)), and `socket_sessions` rows stay `is_online=1` after a crash or restart.
- **Logout is a no-op.** Tokens remain valid for 24 h, and deactivated users keep open sockets.
- **Features are missing:** file upload, message edit/delete, threads UI, search, history scroll-back, group membership management, password reset, push notifications and an audit log.
- **The health check is shallow.** `/health` reports uptime only and does not check the database ([routes/index.js:13](backend/src/routes/index.js#L13)).

---

## 3. Prioritization Framework

| Priority | Meaning |
| :--- | :--- |
| **P0** | Blocks any real-user deployment (security, data isolation, broken deploy). |
| **P1** | High user or operational impact. Required for a credible campus pilot. |
| **P2** | Meaningful value. Schedule after P1 items in the same area. |
| **P3** | Differentiator or optimization. Build when capacity allows. |

The order within each phase is **impact ÷ effort**, adjusted for dependencies. Testing effort covers test design and execution, including automated tests written by QA, regression and exploratory passes. Unit tests written alongside the code are included in development effort.

---

## 4. Roadmap by Phase

### Phase 0 — Security & Tenant Isolation (Weeks 1–3)

**Goal:** No user can escalate privileges or cross a college boundary. Exit criterion: every item below has a negative (attack) test in the Phase 1 suite.

#### S-01 · Close self-registration privilege escalation — **P0**
- **Description:** Public `/auth/register` must ignore `role_id` and `college_id` and always create a student, or be disabled in favour of invite-based registration. Add an admin-only `POST /users` endpoint that provisions faculty and admins, restricted to the caller's own college unless the caller is `super_admin`.
- **Acceptance:** Registering with `role_id: 1` creates a student. A `college_admin` cannot create users in another college.
- **Development:** 6 h · **Testing:** 4 h

#### S-02 · Enforce tenant isolation on REST chat endpoints — **P0**
- **Description:** Route `getRoomById`, `getRoomMessages` and `sendMessage` through one access policy shared with the socket layer ([roomManager.js](backend/src/sockets/roomManager.js) `validateRoomAccess`) that also checks `room.college_id`. Restrict group creation and direct chats to users in the same college (except `super_admin`).
- **Acceptance:** An MIT student gets `403` reading or posting to a Stanford department or batch room. Group `member_ids` from other colleges are rejected.
- **Development:** 10 h · **Testing:** 8 h

#### S-03 · Scope administrative operations to the caller's college — **P0**
- **Description:** `college_admin` may only read, update or delete users and update the college within their own `college_id`. Department, course and batch creation must verify that the parent belongs to the caller's college. Allow-list updatable fields in `updateCollege` and `updateUser`. Scope `getUserById` and `getDepartments?college_id=` to the caller's tenant.
- **Development:** 12 h · **Testing:** 8 h

#### S-04 · Authorize every socket event — **P0**
- **Description:** Check room access in `message:read`, `message:delivered`, `user:typing` and `user:stop_typing`. Validate that `notification:send` targets users in the sender's college. Deliver role-targeted notifications only to recipients' `user:` rooms (or to role-scoped rooms), not to the whole `college:` room.
- **Development:** 8 h · **Testing:** 6 h

#### S-05 · Secrets and repository hygiene — **P0**
- **Description:** Add a `.gitignore`. Remove `backend/.env` and `node_modules` from the repository and rotate the leaked secrets. Fail fast at startup if `JWT_SECRET` is missing in production, and remove hard-coded credential fallbacks in [jwtHelper.js](backend/src/utils/jwtHelper.js) and [database.js](backend/src/config/database.js). Move compose credentials to an `env_file` or Docker secrets, and stop publishing MySQL on the host.
- **Development:** 6 h · **Testing:** 3 h

#### S-06 · Harden HTTP surface and production UI — **P0**
- **Description:** Replace wildcard CORS with an origin allow-list (REST and Socket.IO), enable a CSP compatible with Swagger and the frontend, and add SRI hashes to CDN assets. Show quick-login chips only in development, and set `AUTO_SEED=false` in production compose. Escape the error messages that are currently injected through `innerHTML` in [app.js](frontend/js/app.js).
- **Development:** 8 h · **Testing:** 4 h

#### S-07 · Input validation and abuse limits — **P0**
- **Description:** Introduce schema validation (e.g. `zod`) for every REST body/query and socket payload. Cap `limit` at 100, cap message length (e.g. 4,000 characters) and validate IDs as integers. Add per-socket rate limits for `message:send`, typing and notifications, and disconnect abusive clients.
- **Development:** 14 h · **Testing:** 8 h

#### S-08 · Real session management — **P1**
- **Description:** Use short-lived access tokens (15 min) with rotating refresh tokens, and make logout revoke the refresh token. Add a `token_version` on the user so deactivation or password change invalidates tokens and force-disconnects live sockets. Add a password strength policy and progressive login lockout.
- **Development:** 16 h · **Testing:** 8 h

---

### Phase 1 — Engineering Foundation (Weeks 2–5, overlaps Phase 0)

**Goal:** Changes can be verified automatically and deployed predictably.

#### F-01 · Integration test suite against a real database — **P0**
- **Description:** Replace the mock-based runner with Jest or Vitest plus `supertest` and `socket.io-client`, running against MySQL in Docker/Testcontainers. Include a role × tenant authorization matrix with negative tests for every Phase 0 finding. Target ≥ 70% line coverage on services.
- **Development:** 24 h · **Testing:** 6 h

#### F-02 · CI pipeline — **P0**
- **Description:** On every PR, a GitHub Actions workflow runs lint, the test suite, a dependency vulnerability scan (`npm audit` / Snyk) and Docker image builds. Branch protection on `master`.
- **Development:** 8 h · **Testing:** 2 h

#### F-03 · Fix frontend endpoint resolution for HTTPS/proxied deployments — **P0**
- **Description:** Default `Config.API_BASE` and `SOCKET_URL` to same-origin so traffic flows through Nginx. Use an explicit override only for local development.
- **Development:** 2 h · **Testing:** 2 h

#### F-04 · Versioned database migrations — **P1**
- **Description:** Replace `sync({ alter: true })` at boot with Umzug or `sequelize-cli` migrations. Reconcile model definitions with [init.sql](backend/database/init.sql), which currently diverge on underscored options and on the `sqlite` path. Separate seeding from server startup.
- **Development:** 16 h · **Testing:** 8 h

#### F-05 · Structured logging, health and metrics — **P1**
- **Description:** Add JSON logging (`pino`) with request and socket correlation IDs, and drop PII such as emails and user agents from info-level logs. Split health into liveness and readiness probes, with readiness checking the DB. Expose Prometheus metrics for connected sockets, messages per second, event latency and DB pool usage.
- **Development:** 14 h · **Testing:** 4 h

#### F-06 · Production-grade container and dependency cleanup — **P1**
- **Description:** Use a multi-stage Dockerfile with `npm ci --omit=dev` and a non-root user. Move `sqlite3` (a native build dependency) out of production dependencies. Add ESLint and Prettier and a `.dockerignore`.
- **Development:** 6 h · **Testing:** 3 h

#### F-07 · Consistent, non-leaky error contract — **P1**
- **Description:** Use stable error codes for REST and socket errors. Return generic messages for 5xx errors in production; today raw `err.message` is returned to clients over sockets. Document the codes in Swagger and [API_SOCKET_DOCS.md](API_SOCKET_DOCS.md).
- **Development:** 6 h · **Testing:** 3 h

---

### Phase 2 — Core Messaging Completeness (Weeks 5–12)

**Goal:** Finish the features the data model already anticipates and remove the "it saved but nobody saw it" class of bugs.

#### M-01 · REST/socket parity for real-time events — **P1**
- **Description:** Emit domain events from the service layer so that messages, notifications and announcements created via REST are broadcast live, exactly as socket-originated ones are.
- **Development:** 8 h · **Testing:** 6 h

#### M-02 · Announcement targeting, expiry and live delivery — **P1**
- **Description:** Filter announcements by department, course, batch, `target_role` and `expires_at`. Push new announcements live to the targeted audience and create matching notifications. Add edit, delete and pin for authors and admins. Add a read-rate indicator for authors.
- **Development:** 14 h · **Testing:** 8 h

#### M-03 · Notification targeting and preferences — **P1**
- **Description:** Support department and batch audiences in addition to role. Add per-user mute for rooms, notification categories and quiet hours. Collapse bursts of notifications into digests.
- **Development:** 12 h · **Testing:** 6 h

#### M-04 · Message history scroll-back and query performance — **P1**
- **Description:** Add infinite scroll and "jump to first unread" in the UI; the `before_id` API already exists. Add a composite index on `messages(chat_room_id, id)`. Rewrite `markRoomAsRead` as a single set-based `UPDATE … WHERE message_id <= ?`.
- **Development:** 14 h · **Testing:** 6 h

#### M-05 · Accurate unread counts and receipts in channel rooms — **P1**
- **Description:** Derive unread counts from `chat_room_members.last_read_message_id` and return them with the room list. Auto-create memberships for department and batch rooms based on profile, so read receipts work outside direct and group chats. Avoid per-message status rows for large channels, where an aggregate "seen by N" is sufficient.
- **Development:** 12 h · **Testing:** 6 h

#### M-06 · File and media attachments — **P1**
- **Description:** Implement uploads against S3-compatible storage (MinIO for self-hosting) using presigned URLs, using the existing `message_type='file'` and `media_url` fields. Add MIME and size validation, malware scanning, image thumbnails and access-checked downloads, so that only room members can fetch a file.
- **Development:** 32 h · **Testing:** 14 h

#### M-07 · Reliable delivery and reconnect sync — **P1**
- **Description:** Make sends idempotent on `clientMsgId`, which is already sent by the client but not de-duplicated. Add a client outbox with acknowledgement-based retry, optimistic rendering, and fetching of missed messages after reconnect. Currently a send while disconnected throws an error ([socket.js](frontend/js/socket.js)).
- **Development:** 18 h · **Testing:** 10 h

#### M-08 · Message edit, delete, replies and reactions — **P2**
- **Description:** Add soft-delete and edit with an "edited" marker and a time window. Add a threaded-reply UI on top of the existing `parent_message_id`, and emoji reactions. Broadcast all changes via socket events.
- **Development:** 28 h · **Testing:** 12 h

#### M-09 · Message search — **P2**
- **Description:** Add MySQL FULLTEXT search scoped strictly to rooms the user can access, with room, sender and date filters. Phase 5 adds semantic search on top (AI-08).
- **Development:** 16 h · **Testing:** 8 h

#### M-10 · Group room management — **P2**
- **Description:** Let room admins add, remove and promote members, rename and archive rooms, and let members leave, using the existing `chat_room_members.role`. Post system messages for membership changes.
- **Development:** 16 h · **Testing:** 8 h

#### M-11 · Accessibility and responsive UX — **P2**
- **Description:** Run a WCAG 2.1 AA pass covering keyboard navigation, focus management, an ARIA live region for incoming messages, contrast and reduced motion. Make the layout mobile-first and add a dark mode.
- **Development:** 20 h · **Testing:** 10 h

---

### Phase 3 — Scale & Reliability (Weeks 10–16)

**Goal:** Run more than one backend instance and survive peak periods such as results day and exam weeks.

#### P-01 · Horizontal Socket.IO scaling with Redis — **P1**
- **Description:** Add `@socket.io/redis-adapter`, move presence and socket counts from the in-process `Map` to Redis, and configure sticky sessions in Nginx for the polling transport. Update compose for multi-replica runs.
- **Acceptance:** A message sent through instance A reaches clients connected to instance B. Killing one instance doesn't mark users on other instances offline.
- **Development:** 24 h · **Testing:** 14 h

#### P-02 · Correct presence lifecycle — **P1**
- **Description:** Reset stale `socket_sessions` on startup or by TTL, update `last_seen` on heartbeat, show "last seen", and prune old session rows on a schedule.
- **Development:** 8 h · **Testing:** 4 h

#### P-03 · Load testing and SLOs — **P1**
- **Description:** Add k6 or Artillery scenarios for connection storms, room fan-out and notification broadcasts to a whole college. Publish a capacity baseline. Set SLOs, for example p95 message delivery under 200 ms at 5,000 concurrent users per instance.
- **Development:** 12 h · **Testing:** 8 h

#### P-04 · Backups, retention and disaster recovery — **P1**
- **Description:** Add automated MySQL backups with a tested restore runbook, a configurable message retention and archival policy per college, and documented RPO and RTO targets.
- **Development:** 10 h · **Testing:** 4 h

#### P-05 · Background job queue for fan-out — **P2**
- **Description:** College-wide notifications currently insert a row per user synchronously in the request path. Move fan-out, email and push delivery to BullMQ (Redis) with retries and a dead-letter queue. This is also the execution layer for Phase 5 AI jobs.
- **Development:** 16 h · **Testing:** 8 h

#### P-06 · Web Push notifications — **P2**
- **Description:** Add a service worker with VAPID Web Push for users who have no open tab, with per-category opt-in and a masked preview for direct messages. Make the frontend an installable PWA.
- **Development:** 20 h · **Testing:** 10 h

---

### Phase 4 — Administration, Identity & Trust (Weeks 12–20)

**Goal:** A college can onboard, run and govern itself without engineering help.

#### A-01 · Password reset and email verification — **P1**
- **Description:** Add SMTP-backed, single-use, time-limited tokens for password reset and email verification, with rate-limited endpoints.
- **Development:** 16 h · **Testing:** 8 h

#### A-02 · Bulk onboarding and safe user lifecycle — **P1**
- **Description:** Let admins import students and faculty from CSV with profiles, batches and validation reports, and add a UI for creating individual users. Replace hard delete with deactivate/anonymize; today deleting a user cascades and erases their messages from shared rooms.
- **Development:** 20 h · **Testing:** 10 h

#### A-03 · Content moderation tools — **P1**
- **Description:** Users can report a message. Room and college admins get a review queue, can hide or remove messages, and can mute or ban users per room or per college. Moderation actions emit live updates.
- **Development:** 18 h · **Testing:** 8 h

#### A-04 · Audit log — **P2**
- **Description:** Keep an append-only log of admin and moderation actions (user changes, role changes, deletions, announcement edits), viewable and exportable by college and super admins.
- **Development:** 12 h · **Testing:** 6 h

#### A-05 · Single sign-on (OIDC first, SAML later) — **P2**
- **Description:** Add Google Workspace and Microsoft Entra ID login with domain-to-college mapping and just-in-time provisioning. Keep password login as a per-college option.
- **Development:** 28 h · **Testing:** 12 h

#### A-06 · Privacy and compliance controls — **P2**
- **Description:** Support per-user data export and erasure requests (FERPA/GDPR), configurable retention (with P-04), PII minimization in logs, and a published data-processing summary for institutions.
- **Development:** 14 h · **Testing:** 6 h

#### A-07 · Admin engagement dashboard — **P3**
- **Description:** Show aggregate metrics per college: active users, messages per room, and announcement reach and read rates (the data exists in `user_notifications`). Show aggregates only, with no individual message content.
- **Development:** 18 h · **Testing:** 8 h

---

### Phase 5 — AI-Assisted Features (Weeks 18+)

**Goal:** Use AI to save faculty and student time without compromising tenant isolation or student privacy.

**Guardrails for every item:** opt-in per college; no cross-tenant retrieval; PII redaction before calls to external models; human-in-the-loop for any action that affects a user; direct messages excluded unless both participants invoke the feature.

#### AI-01 · AI platform foundation — **P2**
- **Description:** Add a model-provider abstraction executed through the P-05 job queue, per-college enablement and monthly cost caps, PII redaction, prompt and version management, an offline evaluation harness, and graceful degradation so chat keeps working if the AI service is down.
- **Dependencies:** P-05, Phase 0
- **Development:** 24 h · **Testing:** 10 h

#### AI-02 · "Catch me up" room summaries — **P2**
- **Description:** Summarize unread messages since `last_read_message_id`, highlighting decisions, deadlines and open questions, with links back to the source messages. Stream the result to the requesting user only.
- **Dependencies:** AI-01, M-05
- **Development:** 20 h · **Testing:** 10 h

#### AI-03 · Announcement drafting assistant — **P2**
- **Description:** Turn faculty notes into a clear announcement with a selectable tone, and suggest priority, audience and expiry. The author always reviews and edits before posting.
- **Dependencies:** AI-01, M-02
- **Development:** 12 h · **Testing:** 6 h

#### AI-04 · Campus knowledge assistant (RAG) — **P2**
- **Description:** Admins upload handbooks, syllabi and timetables. Students ask questions in a dedicated assistant room and get answers with document citations, retrieved strictly within their college and department scope. Unanswerable questions are routed to a human.
- **Dependencies:** AI-01, M-06
- **Development:** 48 h · **Testing:** 20 h

#### AI-05 · AI-assisted moderation — **P3**
- **Description:** Classify messages asynchronously for harassment, self-harm signals and spam, and flag them into the A-03 review queue. Start in flag-only mode; never auto-block until precision is measured on real data. Route self-harm signals to designated counsellors under an institution-approved protocol.
- **Dependencies:** AI-01, A-03
- **Development:** 24 h · **Testing:** 12 h

#### AI-06 · Semantic search — **P3**
- **Description:** Add embedding-based search across accessible rooms and uploaded documents, building on M-09 with the same access filter.
- **Dependencies:** AI-01, M-09
- **Development:** 20 h · **Testing:** 10 h

#### AI-07 · Deadline extraction to calendar — **P3**
- **Description:** Detect dates and deadlines in announcements and propose calendar entries. Users confirm each entry before it is added to a personal `.ics` feed.
- **Dependencies:** AI-01, M-02
- **Development:** 16 h · **Testing:** 8 h

#### AI-08 · On-demand message translation — **P3**
- **Description:** A per-message "Translate" action with a preferred language in the profile, for international students. Results are cached per message and language.
- **Dependencies:** AI-01
- **Development:** 12 h · **Testing:** 6 h

---

## 5. Consolidated Backlog (Priority Order)

| ID | Item | Phase | Priority | Dev (h) | Test (h) | Total (h) |
| :--- | :--- | :---: | :---: | ---: | ---: | ---: |
| S-01 | Close self-registration privilege escalation | 0 | P0 | 6 | 4 | 10 |
| S-02 | Tenant isolation on REST chat | 0 | P0 | 10 | 8 | 18 |
| S-03 | Scope admin operations to own college | 0 | P0 | 12 | 8 | 20 |
| S-04 | Authorize every socket event | 0 | P0 | 8 | 6 | 14 |
| S-05 | Secrets & repository hygiene | 0 | P0 | 6 | 3 | 9 |
| S-06 | Harden HTTP surface & production UI | 0 | P0 | 8 | 4 | 12 |
| S-07 | Input validation & abuse limits | 0 | P0 | 14 | 8 | 22 |
| F-01 | Integration tests on real DB | 1 | P0 | 24 | 6 | 30 |
| F-02 | CI pipeline | 1 | P0 | 8 | 2 | 10 |
| F-03 | Frontend same-origin endpoints | 1 | P0 | 2 | 2 | 4 |
| S-08 | Real session management | 0 | P1 | 16 | 8 | 24 |
| F-04 | Versioned DB migrations | 1 | P1 | 16 | 8 | 24 |
| F-05 | Logging, health & metrics | 1 | P1 | 14 | 4 | 18 |
| F-06 | Container & dependency cleanup | 1 | P1 | 6 | 3 | 9 |
| F-07 | Error contract | 1 | P1 | 6 | 3 | 9 |
| M-01 | REST/socket parity | 2 | P1 | 8 | 6 | 14 |
| M-02 | Announcement targeting & live delivery | 2 | P1 | 14 | 8 | 22 |
| M-03 | Notification targeting & preferences | 2 | P1 | 12 | 6 | 18 |
| M-04 | History scroll-back & query performance | 2 | P1 | 14 | 6 | 20 |
| M-05 | Unread counts & receipts in channels | 2 | P1 | 12 | 6 | 18 |
| M-06 | File & media attachments | 2 | P1 | 32 | 14 | 46 |
| M-07 | Reliable delivery & reconnect sync | 2 | P1 | 18 | 10 | 28 |
| P-01 | Redis-backed horizontal scaling | 3 | P1 | 24 | 14 | 38 |
| P-02 | Presence lifecycle | 3 | P1 | 8 | 4 | 12 |
| P-03 | Load testing & SLOs | 3 | P1 | 12 | 8 | 20 |
| P-04 | Backups, retention & DR | 3 | P1 | 10 | 4 | 14 |
| A-01 | Password reset & email verification | 4 | P1 | 16 | 8 | 24 |
| A-02 | Bulk onboarding & safe user lifecycle | 4 | P1 | 20 | 10 | 30 |
| A-03 | Content moderation tools | 4 | P1 | 18 | 8 | 26 |
| M-08 | Edit, delete, replies, reactions | 2 | P2 | 28 | 12 | 40 |
| M-09 | Message search | 2 | P2 | 16 | 8 | 24 |
| M-10 | Group room management | 2 | P2 | 16 | 8 | 24 |
| M-11 | Accessibility & responsive UX | 2 | P2 | 20 | 10 | 30 |
| P-05 | Background job queue | 3 | P2 | 16 | 8 | 24 |
| P-06 | Web Push notifications | 3 | P2 | 20 | 10 | 30 |
| A-04 | Audit log | 4 | P2 | 12 | 6 | 18 |
| A-05 | Single sign-on | 4 | P2 | 28 | 12 | 40 |
| A-06 | Privacy & compliance controls | 4 | P2 | 14 | 6 | 20 |
| AI-01 | AI platform foundation | 5 | P2 | 24 | 10 | 34 |
| AI-02 | Room catch-up summaries | 5 | P2 | 20 | 10 | 30 |
| AI-03 | Announcement drafting assistant | 5 | P2 | 12 | 6 | 18 |
| AI-04 | Campus knowledge assistant (RAG) | 5 | P2 | 48 | 20 | 68 |
| A-07 | Admin engagement dashboard | 4 | P3 | 18 | 8 | 26 |
| AI-05 | AI-assisted moderation | 5 | P3 | 24 | 12 | 36 |
| AI-06 | Semantic search | 5 | P3 | 20 | 10 | 30 |
| AI-07 | Deadline extraction to calendar | 5 | P3 | 16 | 8 | 24 |
| AI-08 | On-demand translation | 5 | P3 | 12 | 6 | 18 |
| | **Total (47 items)** | | | **738** | **359** | **1,097** |

### Effort by phase

| Phase | Items | Dev (h) | Test (h) | Total (h) |
| :--- | ---: | ---: | ---: | ---: |
| 0 — Security & Tenant Isolation | 8 | 80 | 49 | 129 |
| 1 — Engineering Foundation | 7 | 76 | 28 | 104 |
| 2 — Core Messaging Completeness | 11 | 190 | 94 | 284 |
| 3 — Scale & Reliability | 6 | 90 | 48 | 138 |
| 4 — Administration, Identity & Trust | 7 | 126 | 58 | 184 |
| 5 — AI-Assisted Features | 8 | 176 | 82 | 258 |
| **Total** | **47** | **738** | **359** | **1,097** |

### Indicative timeline

This assumes **2 full-stack developers and 1 QA engineer** at about 25 productive hours per person per week, which is roughly 50 development hours and 25 QA hours per week.

| Weeks | Focus | Milestone |
| :--- | :--- | :--- |
| 1–3 | Phase 0, plus F-01 to F-03 | **Security gate:** pilot-safe build with an authorization test matrix in CI |
| 4–6 | Remainder of Phase 1, plus M-01 to M-05 | Real-time behaviour consistent across REST and sockets |
| 7–10 | M-06, M-07, P-01 to P-04 | **Pilot launch** with one college on a multi-instance deployment |
| 11–15 | A-01 to A-03, the P2 items of Phases 2 and 3 | Self-serve onboarding and moderation |
| 16–20 | Phase 4 P2/P3 items, AI-01 | AI foundation in place |
| 21–26 | AI-02 to AI-04, then P3 AI items | First AI features to pilot colleges |

---

## 6. Dependency Map

```
S-01..S-07 ──► F-01 (tests prove fixes) ──► every later phase
F-04 migrations ──► all schema changes (M-05, M-06, M-08, A-02, A-04 …)
M-01 parity ──► M-02 announcements ──► AI-03, AI-07
M-06 uploads ──► AI-04 knowledge assistant
P-01 Redis ──► P-05 job queue ──► P-06 push, AI-01 AI foundation
A-03 moderation ──► AI-05 AI-assisted moderation
M-09 search ──► AI-06 semantic search
```

---

## 7. Success Metrics

| Metric | Target | Measured by |
| :--- | :--- | :--- |
| Cross-tenant access defects | 0 open; authorization matrix green in CI | F-01 suite |
| p95 message delivery latency | < 200 ms at pilot load | F-05 metrics, P-03 |
| Message delivery success (sent → delivered) | ≥ 99.9% | Receipts in `message_status` |
| Announcement reach (read within 24 h) | ≥ 70% of targeted users | `user_notifications.read_at` |
| Weekly active users / enrolled users (pilot) | ≥ 60% | Socket session analytics |
| Faculty time saved (post-AI) | ≥ 2 h per week (survey) | Pilot survey and AI-02/AI-03 usage |
| AI answer citation accuracy (AI-04) | ≥ 90% on evaluation set | AI-01 eval harness |

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Secrets already exposed in git history | High | Rotate all secrets in S-05; rewriting history is optional once secrets are rotated |
| Migrating from `sync({alter})` corrupts existing data | High | Baseline migration generated from the current production schema; dry run on a backup (F-04, P-04) |
| Tightened authorization breaks existing UI flows | Medium | Land F-01 alongside Phase 0; run frontend smoke tests against each fix |
| AI cost or latency overruns | Medium | Per-college caps, async execution, kill switch (AI-01) |
| Student privacy concerns with AI features | High | Opt-in, aggregate-only analytics, no DM processing without consent, institution sign-off |
| Small team capacity | Medium | P2 and P3 items are independently deferrable; the security gate and pilot milestones are not |

---

## 9. Considered and Deferred

These items were evaluated and intentionally left off the 6-month plan.

| Idea | Reason for deferral |
| :--- | :--- |
| End-to-end encryption for direct messages | Conflicts with institutional moderation and compliance obligations, and adds key-management complexity. Revisit after A-03 and A-06. |
| Built-in video/audio huddles (WebRTC) | Large scope (SFU infrastructure). Campuses already license Zoom/Teams; integrating meeting links is cheaper. |
| Native mobile apps | The PWA (P-06) covers most of the need. Revisit based on pilot usage data. |
| Individual-level sentiment analytics | High privacy and trust risk for students. A-07 stays aggregate-only. |

---

## 10. Open Questions for Stakeholders

1. **Registration model:** open self-registration with college email domain checks, or admin/invite-only? This decision affects S-01 and A-02.
2. **Deployment target:** self-hosted per institution or multi-tenant SaaS? This affects P-01, P-04 and A-05.
3. **AI hosting:** is sending redacted content to an external model provider acceptable to pilot institutions, or is in-VPC hosting required? This affects AI-01 cost and effort.
4. **Retention policy:** the default message retention period and whether colleges can override it (P-04, A-06).
