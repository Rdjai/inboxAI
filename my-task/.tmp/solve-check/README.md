# ProcessMail

ProcessMail is a MERN email operations platform with mailbox triage, lightweight AI-assisted classification and drafting, team workflows, and analytics.

## Repository Structure

- `client/`: React frontend
- `server/`: Express API, background jobs, and MongoDB models
- `processmail_app/`: companion Flutter client

## Backend Notes

The backend exposes mailbox, analytics, authentication, and account-management APIs. Operational one-off scripts have been trimmed in favor of application code paths that are easier to test and package deterministically.
