# Repository Guidelines

## Project Structure & Module Organization
- `frontend/src/`: React 19/Vite JavaScript application. Routing and layouts live in `app/`, business screens and API adapters in `features/`, reusable code in `shared/`, images in `assets/`, and CSS in `styles/`.
- `backend/src/main/java/com/swp391/selfstorage/`: Spring Boot 3 application. Domain code lives in `modules/<feature>/`; transactions spanning modules belong in `application/workflow/`.
- Backend tests mirror packages under `backend/src/test/java/`; frontend tests sit beside source files.
- `contracts/` holds OpenAPI and route inventories; `postman/` contains request collections; `database/` contains migrations and reference schemas. See `docs/` for architecture and requirements, and `design/` for visual references.

## Build, Test, and Development Commands
Use Node >=22.12, Java 21, and Maven 3.9. Run from the repository root:

- `npm ci`: install workspace dependencies from the lockfile.
- `npm run dev`: start Vite at `127.0.0.1:5173`.
- `npm run start:local`: start the backend on port 8080 with an isolated, temporary H2 database.
- `npm run build`: build the frontend.
- `npm run check`: build, run frontend tests, and check API contract alignment.
- `npm run test:backend`: run backend tests.
- `mvn -B -f backend/pom.xml verify`: run the backend CI verification lifecycle.

## Coding Style & Naming Conventions
Match surrounding formatting: Java commonly uses two-space indentation; JavaScript uses four spaces and double quotes. Use PascalCase for Java classes and React components, camelCase for functions and variables, and kebab-case for utility files such as `http-client.js`. Frontend code uses `.js`/`.jsx`. Prettier and `prettier-plugin-java` are available; no dedicated lint script is configured. Keep controllers thin, place business logic in services/workflows, and route frontend requests through feature API adapters and the shared HTTP client.

## Testing Guidelines
Use Vitest with colocated `*.test.js` files (`npm run test:frontend`). Backend tests use JUnit 5, Mockito, and Spring Boot/MockMvc; name classes `*Test.java`. Add regression coverage for changed business rules, authorization, and lifecycle transitions. No numeric coverage threshold is configured. Run both CI check commands before submitting.

## Commit & Pull Request Guidelines
Follow existing Conventional Commit prefixes: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, and `chore:`; optional scopes include `feat(auth):`. PRs should explain behavior changes, link relevant issues, report validation, and include screenshots for UI changes. Update contracts and migration documentation when affected.

## Security & Configuration
Use `.env.example` files as references; Spring Boot does not automatically load `.env`. Keep credentials in environment variables or ignored private configuration. Never commit `storage-rental-secrets/` contents. Review `docs/guides/database-migration.md` before applying schema changes.
