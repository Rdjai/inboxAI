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
    bulkUpdate
} = require('../controllers/emailController');
const Attachment = require('../models/Attachment');
const AuditLog = require('../models/AuditLog');

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
router.post('/:id/attachments', upload.array('files', 5), async (req, res) => {
    try {
        const { id } = req.params;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files uploaded'
            });
        }

        // Save attachments
        const attachments = await Promise.all(
            files.map(async (file) => {
                return await Attachment.create({
                    email: id,
                    filename: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    path: file.path
                });
            })
        );

        // Update email
        const Email = require('../models/Email');
        await Email.findByIdAndUpdate(id, {
            hasAttachments: true
        });

        // Create audit log
        await AuditLog.create({
            email: id,
            user: req.user._id,
            action: 'edited',
            details: {
                attachments: files.map(f => ({
                    filename: f.originalname,
                    size: f.size
                }))
            }
        });

        res.json({
            success: true,
            data: attachments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Download attachment
router.get('/:emailId/attachments/:attachmentId', async (req, res) => {
    try {
        const { emailId, attachmentId } = req.params;

        const attachment = await Attachment.findOne({
            _id: attachmentId,
            email: emailId
        });

        if (!attachment) {
            return res.status(404).json({
                success: false,
                error: 'Attachment not found'
            });
        }

        const fs = require('fs');
        if (!fs.existsSync(attachment.path)) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        res.download(attachment.path, attachment.filename);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;