So I spent a couple hours troubleshooting this and determined the issue is that the accountId never gets to the controller because it is discarded at the validation stage. There is no an accountId in the JOI schema for either the list or search. Therefore, the middleware totally ignores it, and it is simply never provided to the controller. In short, the frontend is sending it to the backend — the backend is just ignoring it.

Once the schemas are updated, the getAllEmails function in email.controller.js tries to build a mongo filter with a missing accountId. The find query will run against all records and the stats aggregate functions will do the same thing, so no mailbox filter is being applied. This is a straightforward fix by adding the required condition.

In the buildSearchFilters function in search.service.js, status, category, and priority are read from the parameters, but the accountId is literally not even touched in this function so the result set is infinite for any of these filters. We simply need to add the accountId condition.

In analytics.controller.js, the problem is slightly more difficult because there are actually three places where the same bug occurs: getDashboardStats(), getCategoryAnalytics() and getTeamAnalytics() all destructure the fromDate and toDate, but do not build the correct match stage with the accountId in them. I fixed the first one and copied the changes to the other two functions.

Agent validation will be a challenge especially if there is a controller fix only as validation tests will still fail since param does not reach the controller. It will also be all too easy to fix getDashboardStats, then forget to fix the other two analytics methods.

Testing covers - schema allows an accountId to be passed; total inbox scope is to single mailbox; search service applies mailbox filter; dashboard counts don't bleed between mailboxes.
