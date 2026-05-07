# Reference Plan

## Root Cause Analysis

The backend writes `userId` and `accountId` into email creation flows, but the canonical `Email` schema does not define either field. In Mongoose strict mode, those properties are dropped during document construction, so downstream queries have no persisted tenancy metadata to filter on.

The inbox and analytics controllers also build global filters. Even if ownership metadata were present, list/detail/analytics queries currently do not consistently scope by the authenticated user.

## Intended Fix Direction

1. Add mailbox ownership fields to the canonical email schema.
2. Update inbox queries to include `req.user._id` ownership scoping.
3. Update direct email lookup and mutation entry points to reject foreign mailbox records.
4. Scope dashboard analytics to the authenticated mailbox owner.
5. Keep the patch narrow and preserve the current controller structure.

## Test Coverage Strategy

- Fail-to-pass:
  - email documents retain ownership metadata
  - paginated inbox results only include the requester’s mailbox
  - direct email lookup does not expose a foreign mailbox record
  - dashboard overview counts only aggregate the requester’s mailbox
- Pass-to-pass:
  - role authorization middleware still blocks unauthorized roles
  - AI drafting/classification fallback remains deterministic for empty payloads

## Why This Task Is Fair And Realistic

This is a realistic production regression in a multi-user mail platform:

- the write path and read path disagree about tenancy
- the bug is subtle because the code appears to set ownership already
- the fix requires understanding persistence, authorization boundaries, and aggregate queries
- the task stays local to backend models/controllers and does not require external services
