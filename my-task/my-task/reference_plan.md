Root cause analysis

- The backend accepts mailbox-scoped requests from the client, but that scope is not preserved consistently across the request lifecycle.
- Query validation currently strips the mailbox identifier from inbox-related query params, so downstream code may never receive it.
- Even when inbox handlers build filters for list, search, and analytics behavior, mailbox scope is not being added consistently to those filters.
- Search has a second gap because its shared filter builder does not include mailbox scope, so search behavior can diverge from the standard inbox list.

Intended fix direction

- Allow the mailbox identifier through the inbox list and inbox search validation schemas.
- In the inbox controller, include mailbox scope when building the base list query.
- In the search path, pass mailbox scope into the shared search filter builder and preserve it in the final search filters.
- In dashboard analytics, add mailbox scope to the match/count filter used for overview metrics and grouped aggregations.

Test coverage plan

- Verify inbox list query validation preserves mailbox scope instead of stripping it.
- Verify inbox search query validation preserves mailbox scope.
- Verify inbox pagination and stats only count emails from the requested mailbox.
- Verify search requests pass mailbox scope into the search filter pipeline.
- Verify dashboard overview totals and grouped counts stay within the requested mailbox.
- Keep regression coverage for unrelated stable behavior with pagination normalization and deterministic AI fallback.

Why this task is realistic

- Multi-mailbox products commonly regress on tenant or mailbox scoping when filters are threaded through validation, controllers, and shared query builders separately.
- The bug affects core user-facing flows: inbox totals, search relevance, and dashboard trustworthiness.
- The required fix spans multiple backend layers without being a large refactor.

Why this task is fair

- The failure is fully described by observable behavior.
- The affected area is localized to existing inbox validation, controller, search, and analytics code.
- A solver does not need hidden product knowledge or infrastructure access.

Why this task is medium difficulty

- The issue is not a one-line rename; it requires tracing scope through validation, request handling, shared search filtering, and analytics aggregation.
- The fix is still bounded to a few backend files and has deterministic outcomes.

Validation risks

- A partial fix in only one layer can make one test pass while leaving other mailbox paths broken.
- Search tests must avoid implementation inspection and instead verify the mailbox filter is propagated behaviorally.
- Analytics tests need deterministic response-time behavior, so the test overrides that helper instead of depending on database aggregation internals.
