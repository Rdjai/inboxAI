#!/bin/sh

cd /workspace

git apply <<'PATCH'
diff --git a/server/src/controllers/analytics.controller.js b/server/src/controllers/analytics.controller.js
index 4faa574..a1c84d2 100644
--- a/server/src/controllers/analytics.controller.js
+++ b/server/src/controllers/analytics.controller.js
@@ -12,9 +12,12 @@ class AnalyticsController {
 
     async getDashboardStats(req, res, next) {
         try {
-            const { fromDate, toDate } = req.query;
+            const { fromDate, toDate, accountId } = req.query;
 
             const dateFilter = {};
+            if (accountId) {
+                dateFilter.accountId = accountId;
+            }
             if (fromDate || toDate) {
                 dateFilter.createdAt = {};
                 if (fromDate) dateFilter.createdAt.$gte = new Date(fromDate);
diff --git a/server/src/controllers/email.controller.js b/server/src/controllers/email.controller.js
index ed17ef0..1cc731a 100644
--- a/server/src/controllers/email.controller.js
+++ b/server/src/controllers/email.controller.js
@@ -23,6 +23,7 @@ class EmailController {
             const {
                 page = 1,
                 limit = 20,
+                accountId,
                 status,
                 category,
                 priority,
@@ -47,6 +48,7 @@ class EmailController {
                 query[req.requireOwnership.field] = req.requireOwnership.userId;
             }
 
+            if (accountId) query.accountId = accountId;
             if (status) query.status = status;
             if (category) query.category = category;
             if (priority) query.priority = priority;
@@ -65,7 +67,7 @@ class EmailController {
             if (search) {
                 const filters = {
                     ...searchService.buildSearchFilters({
-                        status, category, priority, isRead, assignedTo, fromDate, toDate
+                        accountId, status, category, priority, isRead, assignedTo, fromDate, toDate
                     }), ...query
                 };
 
diff --git a/server/src/middleware/validation.middleware.js b/server/src/middleware/validation.middleware.js
index 8e9f7ff..394c494 100644
--- a/server/src/middleware/validation.middleware.js
+++ b/server/src/middleware/validation.middleware.js
@@ -83,6 +83,7 @@ const emailSchemas = {
     filter: Joi.object({
         page: Joi.number().integer().min(1).default(1),
         limit: Joi.number().integer().min(1).max(100).default(20),
+        accountId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
         status: Joi.string().valid('NEW', 'CLASSIFIED', 'DRAFTED', 'REVIEWED', 'APPROVED', 'SENT', 'FAILED'),
         category: Joi.string().valid('Complaint', 'Issue', 'Refund', 'Billing', 'Feedback', 'Sales', 'Other'),
         priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
@@ -105,6 +106,7 @@ const emailSchemas = {
         searchType: Joi.string().valid('fulltext', 'regex', 'exact').default('fulltext'),
         page: Joi.number().integer().min(1).default(1),
         limit: Joi.number().integer().min(1).max(100).default(20),
+        accountId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
         sortBy: Joi.string().valid('createdAt', 'priority', 'status', 'category', 'updatedAt', 'searchScore').default('createdAt'),
         sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
         includeScore: Joi.boolean().default(false),
diff --git a/server/src/services/search.service.js b/server/src/services/search.service.js
index 3ee5aef..ee411ef 100644
--- a/server/src/services/search.service.js
+++ b/server/src/services/search.service.js
@@ -572,6 +572,7 @@ buildSearchFilters(queryParams) {
     const filters = {};
 
     // Standard filters
+    if (queryParams.accountId) filters.accountId = queryParams.accountId;
     if (queryParams.status) filters.status = queryParams.status;
     if (queryParams.category) filters.category = queryParams.category;
     if (queryParams.priority) filters.priority = queryParams.priority;
PATCH
