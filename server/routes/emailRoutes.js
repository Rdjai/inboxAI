const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getAccounts,
    createAccount,
    getAccountEmails,
    getAllUserEmails,
    sendAccountEmail,
    shareAccount,
    syncAccount
} = require('../controllers/emailAccountController');

router.get('/emails', auth, getAllUserEmails);
router.get('/accounts', auth, getAccounts);
router.post('/accounts', auth, createAccount);
router.get('/accounts/:accountId/emails', auth, getAccountEmails);
router.post('/accounts/:accountId/send', auth, sendAccountEmail);
router.post('/accounts/:accountId/share', auth, shareAccount);
router.post('/accounts/:accountId/sync', auth, syncAccount);

module.exports = router;
