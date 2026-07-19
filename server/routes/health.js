const express = require('express');
const router = express.Router();

// Public health endpoint (no auth)
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

module.exports = router;
