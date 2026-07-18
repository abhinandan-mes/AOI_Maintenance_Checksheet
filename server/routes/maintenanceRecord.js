const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const maintenanceRecordController = require('../controllers/MaintenanceRecordController');
const { validateMaintenanceRecord } = require('../middleware/validation');
const { requireRoles } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage });

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

// Image Upload Route
router.post('/maintenance/upload', requireRoles(['technician', 'engineer', 'manager', 'admin', 'super_admin']), upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No images uploaded' });
    }
    const filePaths = req.files.map(f => `/uploads/${f.filename}`);
    res.json({ success: true, paths: filePaths });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
