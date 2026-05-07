# Issue: Inbox and Analytics Leak Cross-Mailbox Data

We have a tenancy regression in the backend mailbox pipeline.

When emails are imported or created, the API intends to associate them with the authenticated mailbox owner, but the inbox and analytics endpoints are still able to surface records from other users. The problem is easiest to notice on paginated inbox views and dashboard totals:

- page 2 of the inbox can include messages that do not belong to the signed-in user
- total counts and status/category rollups include emails from other mailboxes
- looking up an email by id can succeed even when the record belongs to another mailbox

Expected behavior:

- mailbox ownership metadata should persist on `Email` documents
- inbox queries should paginate only within the requester’s mailbox
- dashboard analytics should only aggregate the requester’s mailbox data
- direct email lookups should not expose records from another mailbox

Actual behavior:

- ownership metadata written by the backend is not reliably available on stored email documents
- inbox and analytics queries behave like global queries instead of mailbox-scoped queries

Affects:

- `server/src/models/email.model.js`
- `server/src/controllers/email.controller.js`
- `server/src/controllers/analytics.controller.js`
