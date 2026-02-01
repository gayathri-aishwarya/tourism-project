# Project Roadmap

## Project Snapshot
- Language: JavaScript (Node.js)
- Framework: Express-style backend
- Entry: server.js
- Structure: src/controllers, src/services, src/models, src/routes, src/middlewares, src/config

## Immediate (Days 0–2)
- Create `.env` with DB and secret variables.
- Run `npm install` and start the app to confirm boot:

```bash
npm install
node server.js
``` 

- Verify health endpoints and DB connection (check `src/config/db.js`).

## Short Term (Week 1)
- Map endpoints: generate a list from `src/routes/` and validate controllers.
- Document auth flow: review `src/controllers/auth.controller.js` and `src/middlewares/auth.middleware.js`.
- Add basic Postman collection and README with run instructions.
- Add simple unit tests for core services (recommend Jest).

## Medium Term (Weeks 2–4)
- Add CI pipeline (GitHub Actions) to run lint and tests on PRs.
- Add integration tests for critical flows (auth, booking, payment).
- Add OpenAPI/Swagger spec for public endpoints.
- Add Dockerfile and simple deployment scripts (staging).

## Longer Term (1–3 months)
- Add DB migrations (e.g., Knex, Sequelize CLI) if using relational DB.
- Implement monitoring and centralized logging (winston/pino + exporter).
- Harden security: input validation, rate limiting, secure file uploads, env secrets.
- Performance: caching of heavy queries, optimize critical routes.

## Deliverables
- `roadmap.md` (this file)
- `README.md` with quickstart and env vars
- Postman collection / OpenAPI spec
- CI workflow file (.github/workflows/ci.yml)
- Dockerfile and deployment guide

## Next actions I can take (choose one)
- Run the app locally and report startup logs.
- Generate an endpoints list from `src/routes/`.
- Draft OpenAPI spec for current routes.

---
*Created to track the backend roadmap.*
