#!/bin/bash
set -euo pipefail

cd "/app/inboxAI"

cat > /tmp/solution.patch << '__SOLUTION__'
diff --git a/server/src/controllers/email.controller.js b/server/src/controllers/email.controller.js
index dc0b7d0..558e8c7 100644
--- a/server/src/controllers/email.controller.js
+++ b/server/src/controllers/email.controller.js
@@ -214,7 +214,7 @@ class EmailController {
             if (status) query.status = status;
             if (category) query.category = category;
             if (priority) query.priority = priority;
-            if (isRead !== undefined) query.isRead = isRead === 'true';
+            if (isRead !== undefined) query.isRead = isRead === true || isRead === 'true';
             if (assignedTo) query.assignedUserId = assignedTo;
 
             const dateFilter = {};
__SOLUTION__

git apply --verbose /tmp/solution.patch
