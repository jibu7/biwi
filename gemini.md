# Gemini Project Overview: Biwi

This document provides a high-level overview of the Biwi project, its structure, and key technologies based on the repository's file structure.

## 1. Project Description

The "Biwi" project appears to be a complex, multi-tenant SaaS application with a focus on accounting and inventory management. The extensive documentation and scripts related to "multi-tenancy," "AR" (Accounts Receivable), "AP" (Accounts Payable), and "Inventory" suggest a business-oriented platform.

The architecture is a modern web application with a distinct separation between the frontend and backend services, designed to be containerized and deployed.

## 2. Tech Stack

-   **Backend:**
    -   **Language:** Python
    -   **Framework:** Likely FastAPI or a similar ASGI framework (inferred from `app/main.py`, `app/schemas.py`).
    -   **Dependency Management:** Poetry (`pyproject.toml`, `poetry.lock`).
    -   **Database Migrations:** Alembic (`alembic.ini`, `alembic/`).
    -   **Testing:** Pytest (`pytest.ini`).

-   **Frontend:**
    -   **Language:** TypeScript
    -   **Framework:** Next.js (React) (`next.config.ts`, `tsconfig.json`).
    -   **Package Management:** npm or Yarn (`package.json`, `yarn.lock`).
    -   **Testing:** Jest and Playwright (`jest.config.js`, `playwright.config.ts`).

-   **Database:**
    -   Likely PostgreSQL, given the use of Python/Alembic and scripts like `import_to_neon.sh`.

-   **DevOps & Deployment:**
    -   **Containerization:** Docker (`docker/` directory with Dockerfiles for frontend and backend, `docker-compose.yml`).
    -   **CI/CD:** GitHub Actions (`.github/workflows/`).
    -   **Hosting:** Render (`render.yaml`) is configured as a deployment target.

## 3. Project Structure

-   `backend/`: Contains the Python backend application, including API endpoints, database models, business logic, and migration files.
-   `frontend/`: Contains the TypeScript Next.js frontend application, including UI components, pages, and client-side logic.
-   `docker/`: Holds the Dockerfiles for building frontend and backend images, along with Docker Compose files for local development orchestration.
-   `database/`: Contains raw SQL scripts, likely for manual database adjustments or fixes.
-   `scripts/`: A collection of utility scripts for various tasks like database dumps (`create_db_dump.sh`), data import (`import_to_neon.sh`), and validation.
-   `docs/`: Contains extensive markdown documentation covering implementation details, progress reports, and guides for various features, with a strong emphasis on the multi-tenancy implementation.
-   `.github/`: Houses CI/CD workflows and other GitHub-related configuration.

## 4. Key Architectural Concepts

-   **Multi-Tenancy:** This is a core concept. Numerous files (`TENANT_AWARE_FRONTEND_IMPLEMENTATION.md`, `test_multitenant.py`, etc.) indicate that the application is designed to serve multiple customers (tenants) from a single instance, with data isolation between them.
-   **Service Separation:** The project follows a clear separation of concerns with distinct `frontend` and `backend` applications.
-   **Database First/Code First:** The use of Alembic suggests a "code-first" approach to database schema management, where database changes are driven by code and managed through migration scripts.

"npx https://github.com/google-gemini/gemini-cli"