# Comments SPA

A "Comments" single-page application: anonymous and registered users post comments, reply to each other (nested threads of any depth), attach files, and see new messages from other users without reloading the page.

Built for the dZENcode test assignment, Junior+ level with some Middle-level elements.

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Repository structure](#repository-structure)
5. [Implemented features](#implemented-features)
6. [Database](#database)
7. [Redis](#redis)
8. [API](#api)
9. [Key flows](#key-flows)
10. [Security](#security)
11. [Getting started from scratch](#getting-started-from-scratch)
12. [Environment variables](#environment-variables)
13. [DB schema for MySQL Workbench](#db-schema-for-mysql-workbench)
14. [Verification](#verification)
15. [Decisions and limitations](#decisions-and-limitations)

## Features

- Comment form: User Name (Latin letters and digits), E-mail, Home page (optional), CAPTCHA, Text.
- Formatting toolbar `[i] [strong] [code] [a]` and a live preview without reloading the page.
- Allowed tags: `<a href title>`, `<code>`, `<i>`, `<strong>`. All other HTML is stripped, unclosed tags are rejected.
- Nested replies (you can reply to any comment, any depth).
- Root comments are shown in a table: sorting by User Name, E-mail and date (ascending and descending), newest first (LIFO) by default, 25 per page.
- Attachments: up to 5 files per comment. JPG/GIF/PNG images are proportionally downscaled to 320×240, TXT files are limited to 100 KB. Images open in a lightbox.
- Real time via WebSocket: new comments, replies, votes and finished image processing appear instantly for all open clients.
- Registration and login (JWT). Guest mode works without logging in. Only logged-in users can vote (↑/↓).

## Tech stack

| Layer | Technology |
|---|---|
| Backend | NestJS, TypeScript, TypeORM |
| Database | MySQL 8.4 |
| Cache, queue, Pub/Sub | Redis 7, BullMQ |
| API | REST (mutations, files, auth) and GraphQL (reading the list) |
| Realtime | native WebSocket (`ws`, `@nestjs/platform-ws`) |
| Events | EventEmitter2 |
| Authentication | JWT (Passport), bcrypt |
| Files | separate NestJS service, sharp, local storage |
| Frontend | React, TypeScript, Vite, clean architecture |
| Protection | sanitize-html, DOMPurify, helmet, CSP in nginx |
| Infrastructure | Docker Compose, nginx |

## Architecture

```
                      ┌──────────────────────────────┐
                      │           Browser            │
                      │   React + TypeScript (SPA)   │
                      └──────────────┬───────────────┘
                                     │ HTTP :80 / WebSocket /ws
                      ┌──────────────▼───────────────┐
                      │ nginx (frontend image)       │
                      │ SPA static files + reverse   │
                      │ proxy                        │
                      └──────────────┬───────────────┘
                                     │ /api  /graphql  /ws
                      ┌──────────────▼───────────────┐
                      │ Backend (NestJS) :3000       │
                      │ REST · GraphQL · WebSocket   │
                      │ BullMQ worker · EventEmitter │
                      └──────┬─────────┬─────────┬───┘
                    TCP 3306 │ TCP 6379│  HTTP   │
                 ┌───────────▼──┐  ┌───▼──────┐  │
                 │   MySQL 8    │  │ Redis 7  │  │
                 │ data         │  │ cache,   │  │
                 │              │  │ captcha, │  │
                 │              │  │ queue    │  │
                 └──────────────┘  └──────────┘  │
                                      ┌──────────▼───────────┐
                                      │ File service :3001   │
                                      │ NestJS + sharp       │
                                      │ StorageProvider      │
                                      └──────────┬───────────┘
                                                 │ file system
                                      ┌──────────▼───────────┐
                                      │ Docker volume        │
                                      │ /data/uploads        │
                                      └──────────────────────┘
```

Connections between components:

```
┌──────────────────┬──────────────────┬────────────────────────┬──────────────────────────────────────────┐
│ From             │ To               │ Protocol               │ Purpose                                  │
├──────────────────┼──────────────────┼────────────────────────┼──────────────────────────────────────────┤
│ Browser          │ nginx            │ HTTP :80               │ Single entry point                       │
│ nginx            │ Backend          │ HTTP, WebSocket        │ Proxies /api, /graphql, /ws              │
│ Backend          │ MySQL            │ TCP 3306 (TypeORM)     │ Data, migrations                         │
│ Backend          │ Redis            │ TCP 6379               │ Cache, captcha, queue, Pub/Sub           │
│ Backend          │ File service     │ HTTP (internal network)│ File upload, resize, delivery            │
│ File service     │ Docker volume    │ File system            │ File storage                             │
└──────────────────┴──────────────────┴────────────────────────┴──────────────────────────────────────────┘
```

Component responsibilities:

| Component | Responsible for |
|---|---|
| nginx | Serves the built SPA, proxies the API and WebSocket, adds security headers (CSP, nosniff, X-Frame-Options) |
| Backend | Business logic, validation, sanitization, captcha, authentication, voting, job queue, event broadcasting |
| File service | Stores and serves file bytes, downscales images. Knows nothing about the database or Redis |
| MySQL | Users, comments, votes, file metadata |
| Redis | Captcha answers, rate limits, page cache, BullMQ queue, Pub/Sub channel for WebSocket |

The client never talks to the file service directly. Files are served through `GET /api/files/:id`, which the backend streams from the file service. The file service port is not published to the outside.

## Repository structure

```
comments-app/
├── backend/                  NestJS: all business logic
│   └── src/
│       ├── common/           HTML sanitization
│       ├── config/           .env validation, Redis
│       ├── database/         entities, migrations, seeder
│       └── modules/          auth, captcha, comments, votes, files,
│                             queue, realtime, cache, health
├── file-service/             NestJS: file storage and processing
│   └── src/                  storage (StorageProvider), files, health
├── frontend/                 React + Vite
│   ├── nginx/default.conf    nginx config inside the image
│   └── src/                  domain, application, infrastructure,
│                             presentation, di
├── docs/                     DB schema for MySQL Workbench
├── docker-compose.yml
├── .env.example
└── README.md
```

## Implemented features

Base level:

- NestJS, ORM (TypeORM), MySQL, React, Git, Docker, WebSocket.
- All form fields with client and server validation, CAPTCHA, preview, tag toolbar.
- Nested replies, sortable table, pagination by 25, LIFO by default.
- Files: image resize to 320×240, 100 KB limit for TXT, lightbox.
- Protection against XSS and SQL injection.

Junior+:

- Queue: BullMQ, background image resizing, 3 attempts with exponential backoff.
- Cache: Redis, cached list page with a versioned key.
- Events: EventEmitter2, `comment.created` event.
- JWT: registration and login. Authentication is optional, guest mode works.

Part of Middle:

- GraphQL for reading the comment list.
- Redis as a NoSQL store (cache, rate limits, captcha, Pub/Sub).
- Separate file microservice with a storage abstraction (`StorageProvider`).

Beyond the assignment: voting on comments (↑/↓), up to 5 files per comment, request rate limiting, file type detection by content.

Not implemented: message broker (RabbitMQ/Kafka), cloud, load test (Middle+), automated tests.

## Database

```
users
├── id             CHAR(36), PK
├── username       VARCHAR(50), UNIQUE
├── email          VARCHAR(255), UNIQUE
├── password_hash  VARCHAR(255)
└── created_at     DATETIME(3)

comments
├── id             CHAR(36), PK
├── user_id        CHAR(36), FK -> users.id, NULL for guests, ON DELETE SET NULL
├── parent_id      CHAR(36), FK -> comments.id, NULL for root, ON DELETE CASCADE
├── username       VARCHAR(50)
├── email          VARCHAR(255)
├── home_page      VARCHAR(255), NULL
├── text           TEXT                 (already sanitized HTML)
├── ip_address     VARCHAR(45)          (client identification)
├── user_agent     VARCHAR(512), NULL   (client identification)
├── score          INT                  (sum of votes)
├── depth          INT UNSIGNED         (nesting level)
├── created_at     DATETIME(3)
└── indexes: (parent_id, created_at), created_at, username, email

votes
├── id             CHAR(36), PK
├── user_id        CHAR(36), FK -> users.id, ON DELETE CASCADE
├── comment_id     CHAR(36), FK -> comments.id, ON DELETE CASCADE
├── vote_type      ENUM('like','dislike')
├── created_at     DATETIME(3)
└── UNIQUE (user_id, comment_id)        (one vote per comment)

files
├── id             CHAR(36), PK
├── comment_id     CHAR(36), FK -> comments.id, ON DELETE CASCADE
├── type           ENUM('image','txt')
├── original_name  VARCHAR(255)
├── stored_name    VARCHAR(255), UNIQUE (uuid.ext in storage)
├── mime_type      VARCHAR(100)
├── size_bytes     INT UNSIGNED
├── status         ENUM('pending','processed','failed')
└── created_at     DATETIME(3)
```

Relations: `users 1 — N comments`, `comments 1 — N comments` (replies), `comments 1 — N files`, `users 1 — N votes`, `comments 1 — N votes`.

`ip_address` and `user_agent` are stored to identify the client, as the assignment requires. They are never returned by the API. This is personal data, so define a retention period for real-world use.

Migrations are located in `backend/src/database/migrations/`, one per table, and are applied automatically when the backend starts.

## Redis

| Key | Purpose | TTL |
|---|---|---|
| `captcha:{uuid}` | Correct captcha answer, deleted on verification (`GETDEL`) | 5 minutes |
| `rate:captcha:{ip}` | Captcha request counter per IP | 15 minutes |
| `rate:comments:{userId or ip}` | Limit of 10 comments per minute | 1 minute |
| `comments:page:{v}:{n}:{sort}:{dir}` | Cached list page (JSON) | 2 minutes |
| `comments:version` | Cache version, `INCR` on any change | none |
| `realtime:events` | Pub/Sub channel that delivers events to WebSocket clients of all instances | |
| `bull:image-processing:*` | BullMQ internal keys | |

The cache is invalidated by bumping the version: keys of old versions are no longer used and expire on their own, so there is no need to delete them by pattern.

## API

REST (prefix `/api`):

| Method and path | Description |
|---|---|
| `GET /api/health` | Service status and database connection |
| `GET /api/captcha` | New captcha: `{ captchaId, svg }` |
| `POST /api/auth/register` | Registration: `username`, `email`, `password` |
| `POST /api/auth/login` | Login: `usernameOrEmail`, `password`. Response: `{ accessToken, user }` |
| `POST /api/comments` | Create a comment (multipart/form-data, token optional) |
| `GET /api/comments` | Page of root comments: `page`, `sortBy`, `order` |
| `POST /api/comments/:id/votes` | Vote `{ voteType: "like" \| "dislike" }`, token required |
| `GET /api/files/:id` | Download or display an attachment |

Fields of `POST /api/comments`: `username`, `email`, `homePage?`, `text`, `captchaId`, `captchaAnswer`, `parentId?`, `files[]` (up to 5).

GraphQL (`POST /graphql`):

```graphql
query {
  comments(page: 1, sortBy: "createdAt", order: "desc") {
    total page pageSize
    items {
      id username text score createdAt
      files { id type originalName status }
      thread { id parentId username text score depth createdAt }
    }
  }
}
```

`thread` contains all replies of a root comment as a flat list, the client builds the tree using `parentId`.

WebSocket (`/ws`): the server sends JSON `{ "event": "...", "data": {...} }`. Events: `comment:created`, `comment:voted`, `file:processed`. After an event the client re-fetches the current page.

## Key flows

Creating a comment:

```
POST /api/comments
  ├─ rate limit (Redis)
  ├─ text sanitization, tag balance check, file signature check
  ├─ captcha verification (single use)
  ├─ files -> File service (rolled back on error)
  ├─ MySQL transaction: comment + file records
  ├─ images -> BullMQ queue
  ├─ comments:version +1 (cache invalidation)
  └─ comment.created event -> WebSocket to all clients
```

Image processing (background):

```
BullMQ worker -> File service: downscale to 320×240 (sharp)
  ├─ success: files.status = processed
  ├─ 3 failures: files.status = failed
  └─ file:processed event -> clients refresh the card
```

Reading the list:

```
GraphQL comments(...)
  ├─ cache hit (Redis) -> return it
  └─ cache miss: 3 MySQL queries regardless of the number of comments
          1) root comments of the page
          2) all their descendants (recursive CTE)
          3) files of all comments on the page
        -> store in cache
```

## Security

- XSS: `sanitize-html` on the server with a whitelist of tags and protocols, DOMPurify on the client. Links get `rel="noopener noreferrer nofollow"`. The captcha SVG is displayed as an `<img>`. nginx sends a Content-Security-Policy without inline scripts.
- SQL injection: parameterized TypeORM queries, only `?` parameters in the recursive query, sorting only by a whitelist of columns.
- Validation: `class-validator` with `whitelist` on the server, the same rules on the client.
- Files: the type is detected by signature, not by the client MIME type. Storage names are UUIDs, protected against path traversal. Files are served with `nosniff` and `Content-Security-Policy: sandbox`.
- Limits: 10 comments per minute per user or IP, 100 captcha requests per 15 minutes per IP.
- Privacy: IP and user-agent never appear in API responses. A logged-in user cannot post under someone else's name.
- Headers: helmet on the backend, security headers in nginx.

## Getting started from scratch

Requirements: Git and Docker with Compose v2 (Docker Desktop or Docker Engine). Ports 80, 3000 and 3307 must be free.

```bash
# 1. Clone the repository
git clone <repo-url>
cd comments-app

# 2. Create the environment file
cp .env.example .env          # Windows (cmd): copy .env.example .env

# 3. Fill in .env: replace every change_me value
#    A JWT secret can be generated with: openssl rand -hex 32

# 4. Build and start
docker compose up -d --build

# 5. Wait until all services are healthy
docker compose ps
```

The application will be available at `http://localhost`.

Migrations are applied automatically when the backend starts. Stop: `docker compose down`. Stop and delete all data (database, Redis, uploaded files): `docker compose down -v`.

### Test data / Seed

The project includes a database seed script for quickly populating the application with test data.

After the Docker containers are running and the migrations have been applied, the seed can be executed in two ways.

#### Development

If the backend is running directly from the source code:

```bash
npm run seed
```

This runs:

```json
"seed": "ts-node -r dotenv/config src/database/seed.ts"
```

#### Docker / production build

If the application is running inside Docker and the backend has been built:

```bash
docker compose exec backend npm run seed:prod
```

This runs:

```json
"seed:prod": "node dist/database/seed.js"
```

The seed creates demo users, root comments, nested replies and test votes.

The seed is safe to run without the `--reset` flag: if the `comments` table already contains data, it does not modify the existing data.

To completely recreate the test data:

```bash
docker compose exec backend npm run seed:prod -- --reset
```

The `--reset` option removes the existing test data from the `votes`, `files`, `comments` and `users` tables and then recreates the demo data.

The seed also creates a test account:

```text
Username: demo_user
Password: password123
```


## Environment variables

Root `.env` (used by `docker-compose.yml`):

| Variable | Purpose |
|---|---|
| `MYSQL_ROOT_PASSWORD` | MySQL root password |
| `MYSQL_DATABASE` | Database name |
| `MYSQL_USER` | Application user |
| `MYSQL_PASSWORD` | Application user password |
| `JWT_SECRET` | JWT signing secret, at least 16 characters |

The `.env` file is not committed to the repository, only `.env.example` is.

## DB schema for MySQL Workbench

The file is located at `docs/db-schema.mwb`. To regenerate it: start MySQL, in Workbench choose Database → Reverse Engineer, connect to `127.0.0.1:3307`, select the `comments` schema (the service table `migrations` can be excluded) and save the model.

## Verification

1. `docker compose ps`: all services are `healthy`.
2. Open `http://localhost`: the status line shows "Realtime updates: connected".
3. Create a comment, it appears without a page reload. Open the site in a second window, the new comment must appear there too.
4. Reply to a comment, the reply is displayed nested.
5. Attach several images and a TXT file: images first show "processing", then appear downscaled, a click opens the lightbox.
6. Submit the text `<i>unclosed` (error) and `<script>alert(1)</script>` (the tag is stripped).
7. Register and vote: the counter changes for all clients.
8. Check sorting by User Name, E-mail and date, and page switching.

## Decisions and limitations

- Pagination counts only root comments (25 per page). Replies come nested together with their root.
- Real time is implemented with native WebSocket (as required by the assignment). Events reach clients of all backend instances through Redis Pub/Sub, and the client reconnects with increasing delays.
- The file service uses local storage on a Docker volume. Storage is hidden behind the `StorageProvider` interface, so an S3-compatible storage can be added as a second implementation. Several file service instances cannot share a local disk.
- The JWT is stored in `localStorage`. This is a simplification: with an XSS the token could be stolen. The risk is reduced by CSP and sanitization.
- Client IP detection behind a proxy relies on `trust proxy` and `X-Forwarded-For`. The address can be spoofed, this is soft identification, not authentication.
- There are no automated tests and no load test.
- Up to 5 files per comment is an extension of the assignment.