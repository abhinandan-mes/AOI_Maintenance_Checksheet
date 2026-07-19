const express = require('express');
const lineStatusController = require('../controllers/LineStatusController');
const { requireRoles } = require('../middleware/auth');

const router = express.Router();

// GET all lines with status (any authenticated user — needed for form dropdowns)
router.get('/lines/installed', lineStatusController.getInstalledLines);
router.get('/lines', lineStatusController.getAllLines);

// PATCH update a line's installation status (admin / super_admin only)
router.patch('/lines/:line', requireRoles(['admin', 'super_admin']), lineStatusController.updateLine);

module.exports = router;
