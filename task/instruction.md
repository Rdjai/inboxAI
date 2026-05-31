The `/api/emails` endpoint accepts an `isRead` query parameter to filter emails by their read status. Passing `isRead=true` should return only emails where `isRead` is `true`. Passing `isRead=false` should return only emails where `isRead` is `false`. Omitting the parameter entirely should return all emails regardless of read status.

Currently, the filter does not behave correctly when a boolean value reaches the `getAllEmails` method in `server/src/controllers/email.controller.js`. Specifically, passing `isRead=true` returns the wrong set of emails.

Fix `getAllEmails` so the `isRead` filter correctly scopes results in all three cases: `true`, `false`, and absent.
