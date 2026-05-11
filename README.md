# ProcessMail

ProcessMail is a MERN email operations platform with mailbox triage, lightweight AI-assisted classification and drafting, team workflows, and analytics.

## Repository Structure

- `client/`: React frontend
- `server/`: Express API, background jobs, and MongoDB models
- `processmail_app/`: companion Flutter client

## Backend Notes

The backend exposes mailbox, analytics, authentication, and account-management APIs. Operational one-off scripts have been trimmed in favor of application code paths that are easier to test and package deterministically.

## Docker

The repository now includes Docker support for the backend API plus MongoDB and Redis.

Files:
- `server/Dockerfile`
- `server/.dockerignore`
- `docker-compose.yml`
- `.env.docker.example`

Run it:

```powershell
Copy-Item .env.docker.example .env.docker
docker compose up --build
```

API endpoints:
- API: `http://localhost:3000`
- Health check: `http://localhost:3000/api/health`

Notes:
- The current Docker setup packages the `server/` app only.
- MongoDB data is stored in the named volume `mongo_data`.
- Redis data is stored in the named volume `redis_data`.
- Uploaded files and server logs are persisted to `server/uploads` and `server/logs` on the host.
