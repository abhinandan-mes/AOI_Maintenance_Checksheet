const express = require('express');
const maintenanceRecordController = require('../controllers/MaintenanceRecordController');
const { validateMaintenanceRecord } = require('../middleware/validation');
const { requireRoles } = require('../middleware/auth');

const router = express.Router();

router.post('/maintenance', requireRoles(['technician', 'engineer', 'manager', 'admin', 'super_admin']), validateMaintenanceRecord, maintenanceRecordController.createRecord);
router.get('/maintenance', maintenanceRecordController.getAllRecords);
router.get('/maintenance/:id', maintenanceRecordController.getRecordById);
router.put('/maintenance/:id', requireRoles(['technician', 'engineer', 'manager', 'admin', 'super_admin']), validateMaintenanceRecord, maintenanceRecordController.updateRecord);
router.post('/maintenance/:id/review', requireRoles(['engineer', 'manager', 'admin', 'super_admin']), maintenanceRecordController.reviewRecord);
router.post('/maintenance/:id/reassign', requireRoles(['technician', 'engineer', 'manager', 'admin', 'super_admin']), maintenanceRecordController.reassignRecord);
router.delete('/maintenance/:id', requireRoles(['super_admin']), maintenanceRecordController.deleteRecord);
router.post('/maintenance/batch-review', requireRoles(['engineer', 'manager', 'admin', 'super_admin']), maintenanceRecordController.batchReview);
router.post('/maintenance/batch-reassign', requireRoles(['technician', 'engineer', 'manager', 'admin', 'super_admin']), maintenanceRecordController.batchReassign);
router.post('/maintenance/batch-delete', requireRoles(['super_admin']), maintenanceRecordController.batchDelete);

module.exports = router;
