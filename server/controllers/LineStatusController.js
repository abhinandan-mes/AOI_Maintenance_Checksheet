const lineStatusModel = require('../models/LineStatus');

const lineStatusController = {
  /**
   * GET /api/lines
   * Returns all lines with their installation status.
   * Accessible by any authenticated user (needed for form dropdowns).
   */
  getAllLines: async (req, res) => {
    try {
      const lines = await lineStatusModel.getAll();
      res.json({ success: true, data: lines });
    } catch (error) {
      console.error('Error fetching line statuses:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch line statuses' });
    }
  },

  /**
   * PATCH /api/lines/:line
   * Update is_installed status of a line.
   * Restricted to admin and super_admin roles.
   */
  updateLine: async (req, res) => {
    try {
      const { line } = req.params;
      const { is_installed } = req.body;

      if (typeof is_installed !== 'boolean') {
        return res.status(400).json({ success: false, error: 'is_installed must be a boolean' });
      }

      const updated = await lineStatusModel.updateStatus(line, is_installed, req.user?.username);

      // Log to SystemEventLog
      const prisma = require('../config/db');
      await prisma.systemEventLog.create({
        data: {
          event_type: 'LINE_STATUS_UPDATE',
          username: req.user?.username || 'unknown',
          public_ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
          details: `Line ${line} marked as ${is_installed ? 'Installed' : 'Not Installed'}`
        }
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error updating line status:', error);
      res.status(500).json({ success: false, error: 'Failed to update line status' });
    }
  },

  /**
   * GET /api/lines/installed
   * Returns only installed line numbers (used by form dropdowns).
   */
  getInstalledLines: async (req, res) => {
    try {
      const lines = await lineStatusModel.getInstalledLines();
      res.json({ success: true, data: lines });
    } catch (error) {
      console.error('Error fetching installed lines:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch installed lines' });
    }
  }
};

module.exports = lineStatusController;
