<<Mailbox-Scoped Filtering>>

(# Root Cause)

While the authentication middleware appropriately sets `req.user` with the information belonging to the authenticated user, such as `accountId`, there are three controller methods that do not honor this value, and are querying the database without `accountId` filtering at the account level. Specifically:

1. `email.controller.js::getAllEmails` - this method destructures `req.query` but not `req.user.accountId` and is ultimately passing a non-scoped query to the `Email.find()`.
2. `email.controller.js::searchEmails` - this method creates a search filter object based on the contents of `req.body`, but it never adds the `accountId` value to limit the results.
3. `analytics.controller.js::getDashboardStats` - this method aggregates on all documents in the `Email` collection without filtering on `accountId`.

(# Intended Fix)

For each affected controller, extract the value of `req.user.accountId` and add it to the database query object:

- `getAllEmails`: add the query object: `{ accountId: req.user.accountId }` to the query object prior to calling `Email.find()`.
- `searchEmails`: before invoking the search service, merge the `accountId` into the search filter.
- `getDashboardStats`: include the stage `{$match: { accountId: req.user.accountId } }` as the first stage in the aggregation pipeline.

(# What Tests Verify)

- **Email List Test** - mocks the `Email.find()` and verifies it is called with a query containing the appropriate `accountId`. It also verifies that pagination metadata is scoped for the number of records returned.
- **Search Test** - mocks the search service and captures the search service filter, asserting that the `accountId` is present.
- **Analytics Test** - mocks the `Email.aggregate()` method and verifies that the returned pipeline has an `$match` stage filtering on the included `accountId`.
- **Tests need verification with the proper schema that has accountId and/or userId fields. The role middleware blocks unauthorized roles from passing and AI Services returns to classification that fall back on an empty payload.**

## Rationale Behind the Task; Accessing this task requires several skills and knowledge of multi-tenant architecture as well as understanding of the flow (middleware -> controller -> service/data) for middleware controller to understand the controller/service/data flows. Accessing the task will provide clear behavioural requirements without leaking implementation details.