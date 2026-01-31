const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
    getEmails,
    getEmail,
    createEmail,
    updateEmail,
    approveEmail,
    sendEmail,
    replyToEmail,
    bulkUpdate,
    uploadAttachments,
    downloadAttachment
} = require('../controllers/emailController');

// All routes require authentication
router.use(auth);

// Email routes
router.get('/', getEmails);
router.get('/:id', getEmail);
router.post('/', createEmail);
router.put('/:id', updateEmail);
router.post('/:id/approve', approveEmail);
router.post('/:id/send', sendEmail);
router.post('/:id/reply', replyToEmail);
router.post('/bulk', bulkUpdate);

// Attachment routes
router.post('/:id/attachments', upload.array('files', 5), uploadAttachments);
router.get('/:emailId/attachments/:attachmentId', downloadAttachment);

module.exports = router;
