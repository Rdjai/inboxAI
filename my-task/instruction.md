accountId is currently being overlooked in the backend. Frontend passes the data correctly when users change their mailbox, but the handler ignores it.

Inbox route is returning wrong total email count since it counts the number of all emails in both mailboxes rather than the selected one. Similarly, the search route will return emails found in mailbox A even if you perform the search in mailbox B. The statistics shown on the dashboard are incorrect because the counts remain constant regardless of the chosen mailbox.

The accountId param is getting stripped somewhere before it reaches the query layer. Even when this is resolved, the controllers are not using it when building database queries, and the search filter logic ignores it too.

Fix all three — inbox listing, search, and dashboard aggregations — so that when accountId is provided, all queries and counts are scoped to that mailbox only.
