# Reference Plan

Root cause:

- The validation layer strips unknown query fields, but the email list and search schemas do not declare `accountId`.
- The inbox controller never applies `accountId` to its base Mongo query, so pagination and optional status stats are computed across every mailbox.
- The search flow builds filters without mailbox scope, so mailbox-specific search requests degrade into global search.
- The dashboard controller ignores `accountId`, which makes overview counts and aggregations inconsistent with mailbox-specific inbox views.

Intended fix direction:

- Extend the relevant query schemas so `accountId` is accepted and survives validation.
- Thread the mailbox filter through the inbox list path, including both normal list queries and search requests.
- Ensure search filter construction includes `accountId` so search results and counts stay aligned.
- Apply the same mailbox scope in dashboard analytics queries and derived calculations.

Why this task is fair:

- The repository already models `accountId` on emails and the frontend already sends mailbox-scoped requests.
- The bug is deterministic and reproducible without external services.
- Solving it requires understanding how validation, controllers, and search/analytics logic interact instead of editing a single line in isolation.

Test strategy:

- Verify query validation keeps `accountId` for list and search endpoints.
- Verify inbox listing paginates and summarizes only the requested mailbox.
- Verify the search controller forwards mailbox scope into the search service.
- Verify dashboard analytics count only the requested mailbox.
