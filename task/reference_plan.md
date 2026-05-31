## Root Cause

The Joi validation schema declares `isRead: Joi.boolean()`, which coerces the incoming query string `'true'` or `'false'` to the JavaScript boolean `true` or `false` before the controller runs.

In `getAllEmails` (server/src/controllers/email.controller.js, line ~217), the controller then checks:

```js
if (isRead !== undefined) query.isRead = isRead === 'true';
```

Since `isRead` is already a boolean after Joi coercion, `isRead === 'true'` always evaluates to `false`. So `query.isRead` is always set to `false` regardless of what the caller passed. Filtering by `isRead=true` silently returns unread emails instead of read ones.

## Intended Fix

Change the condition to handle both the boolean and string forms:

```js
if (isRead !== undefined) query.isRead = isRead === true || isRead === 'true';
```

This makes the filter work whether `isRead` arrives as a boolean (after Joi coercion in the validated route) or as a raw string (if the controller is called without the validation middleware).

## Test Coverage

- `isRead=true` (boolean, post-Joi) → only the one read email is returned (fail_to_pass: currently broken)
- `isRead=false` (boolean, post-Joi) → only unread emails returned (pass_to_pass: happens to work by coincidence)
- `isRead` absent → all emails returned (pass_to_pass: unaffected by the bug)
