# QA Knowledge Hub

The Hub reads published records from `KnowledgeItems` and their normalized citations from `KnowledgeSources`.
Its seed package contains 135 interview questions, 50 Architecture & Networking articles, and 50 Tools & Technologies articles.
The seed validates unique slugs and package sizes before writing records in one transaction.
The portable MySQL snapshot includes the same knowledge records. Regenerate that section after changing the seed package with `npm run db:snapshot:knowledge`.

The portable database imports `db-snapshot/snapshot.sql` only when its data volume is first created. Existing volumes are preserved across image updates; the API startup seed refreshes the knowledge package in place without deleting user data.

## Database setup

Apply the backend migrations with the project's configured Sequelize environment, then start the API. The API startup seeds or refreshes the bundled learning package and removes legacy-format generated seed entries.

```powershell
npm run sqlz -- db:migrate --migrations-path migrations --config config/config.js
```

## Content editor API

Read endpoints are public. Create, edit, and delete operations require a valid `Authorization: Token <JWT>` header and an account email included in the comma-separated `KNOWLEDGE_ADMIN_EMAILS` environment variable.

- `GET /api/knowledge?section=interview|architecture|tools&search=...&category=...&difficulty=...`
- `GET /api/knowledge/categories`
- `GET /api/knowledge/:slug`
- `POST /api/knowledge/manage`
- `PUT /api/knowledge/manage/:slug`
- `DELETE /api/knowledge/manage/:slug`

Article create/update payloads must include at least one titled HTTP(S) source URL (up to 700 characters, to fit the MySQL utf8mb4 composite index safely). Sources are validated and saved as individual rows in `KnowledgeSources`. `orderIndex` controls ordering within a section; `published` controls public visibility.

## Content sources

Interview scenarios are independently authored and use QA_bible as topic inspiration. Technical articles cite official specifications or documentation where available, including IETF RFCs, ITU-T, IEEE, Microsoft Learn, Docker, Redis, Jenkins, PostgreSQL, Kubernetes, RabbitMQ, Kafka, OpenTelemetry, Prometheus, Airflow and Keycloak.
