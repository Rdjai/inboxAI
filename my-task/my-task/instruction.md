Selected mailbox scope is being lost across the inbox APIs.

When the client requests inbox data for a specific mailbox, the backend should keep that mailbox boundary intact for the inbox list, inbox search, and dashboard overview. Right now those paths do not stay in sync:

- the inbox list total and status breakdown can include emails from other mailboxes
- mailbox-scoped search does not consistently honor the selected mailbox
- dashboard overview counts can stay constant even after switching mailboxes

This is causing cross-mailbox data bleed in normal product flows. Update the backend so that when a mailbox identifier is provided in the request, mailbox-specific inbox results, search results, and dashboard analytics are all scoped to that mailbox consistently.
