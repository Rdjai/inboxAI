### Email Account Filtering Problem Description

The backend code contains a bug that allows cross-tenancy data leakage. When a logged in user requests their email listing, search results or dashboard analytics, the result set contains information from **all users** instead of filtering based upon only the requesting user’s mailbox.

### Affected Functions

1. **Email listing endpoint** (`GET /api/emails`) - returns emails from all email accounts instead of restricting the emails returned to just the requesting user’s email account.
2. **Search endpoint** (`POST /api/emails/search`) - returns email search results including emails in other email accounts.
3. **Dashboard analytics** (`GET /api/analytics/dashboard`) - counts and aggregates include email counts for all email accounts instead of just counting the requesting user’s email account.

### Desired Functionality

Each of the three endpoint functions (email listing, search emails, and dashboard analytics) must filter the query by the authenticated user’s `accountId` (available via `req.user.accountId`). The email list must include pagination that is scoped to the authenticated user’s mailbox. The search must utilize the scoped account filter in conjunction with existing search criteria. Finally, the dashboard analytics must only include email counts for only the requesting authenticated user’s emails.

### Examples

If user A (accountId: "acc_123") has 5 emails and user B (accountId: "acc_456") has 3 emails:
- When user A requests a listing of their emails, request will be returned with 5 emails matching their accountId instead of returning all 8 emails.
- When user A searches for an invoice emails, user A will receive search results that will only show invoices accounted for against "acc_123".
- When user A's email dashboard analytics are returned, it will show total email counts of 5 instead of a total of 8.

## Constraints

- Do not break existing functionality for schema validation, role-based access control, or AI service fallbacks.
- The fix should be minimal and targeted to the affected controllers/services.