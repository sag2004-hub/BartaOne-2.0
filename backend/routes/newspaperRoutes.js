const express = require('express');
const router = express.Router();
const newspaperController = require('../controllers/newspaperController');
const { verifyFirebaseToken } = require('../middleware/verifyFirebaseToken');
const { checkRole } = require('../middleware/checkRole');
const { USER_ROLES } = require('../utils/constants');

// ─── Public Routes ──────────────────────────────────────────────────────────
router.get('/', newspaperController.getNewspapers);
router.get('/active', newspaperController.getActiveNewspapers);
router.get('/stats/:channelId', newspaperController.getNewspaperStats); // ✅ MOVE HERE (before auth)

// ─── Protected Routes ──────────────────────────────────────────────────────
router.use(verifyFirebaseToken);

// ✅ Specific routes first (BEFORE parameterized routes)
router.get('/user', newspaperController.getUserNewspapers);
router.get('/channel/:channelId', newspaperController.getNewspapersByChannel);

// ✅ Parameterized routes (AFTER specific routes)
router.get('/:id', newspaperController.getNewspaperById);

// ─── Owner Routes ──────────────────────────────────────────────────────────
router.post('/', checkRole([USER_ROLES.OWNER, USER_ROLES.ADMIN]), newspaperController.createNewspaper);
router.put('/:id', checkRole([USER_ROLES.OWNER, USER_ROLES.ADMIN]), newspaperController.updateNewspaper);
router.delete('/:id', newspaperController.deleteNewspaper);

// ─── Analytics Routes ──────────────────────────────────────────────────────
router.post('/:id/view', newspaperController.updateViews);

// ─── Admin Routes ──────────────────────────────────────────────────────────
router.post('/auto-expire', checkRole([USER_ROLES.ADMIN]), newspaperController.autoExpireNewspapers);

module.exports = router;