# Issue: Selected mailbox filter is dropped by the backend

The mailbox switcher is not being enforced consistently on the backend.

When the client requests inbox or analytics data for a specific mailbox, it sends an `accountId` query parameter. The API should treat that mailbox as the scope for list, search, and dashboard responses. Right now the backend silently falls back to cross-mailbox data instead.

Symptoms:

- inbox pagination still counts emails from other connected mailboxes
- searching inside a selected mailbox returns matches from unrelated mailboxes
- dashboard totals and status/category breakdowns do not match the mailbox currently being viewed

Expected behavior:

- mailbox-scoped endpoints should preserve `accountId` during request validation
- `/api/emails` should paginate and summarize only the requested mailbox when `accountId` is provided
- search requests should keep the mailbox filter applied all the way into the search service
- dashboard analytics should aggregate only the requested mailbox when `accountId` is provided

Actual behavior:

- the mailbox filter is dropped before some handlers see it
- inbox and search logic behave like cross-mailbox queries
- dashboard aggregates are calculated across all mailboxes for the user-facing view
