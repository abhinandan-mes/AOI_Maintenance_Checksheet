const maintenanceRecordModel = require('../models/MaintenanceRecord');
const prisma = require('../config/db');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'Unknown';
};

const maintenanceRecordController = {
  createRecord: async (req, res) => {
    try {
      if (req.body.period === 'Yearly') {
        const tenMonthsAgo = new Date();
        tenMonthsAgo.setMonth(tenMonthsAgo.getMonth() - 10);
        const existingYearly = await prisma.aoiSpiMaintenanceRecord.findFirst({
          where: {
            line: req.body.line,
            period: 'Yearly',
            date: { gte: tenMonthsAgo },
            status: { not: 'DISAPPROVED' },
            created_at: { lt: new Date(Date.now() - 5 * 60000) } // allow same-session inserts
          }
        });
        if (existingYearly) {
          return res.status(400).json({ success: false, error: 'A Yearly maintenance record was already submitted for this line within the last 10 months.' });
        }
      }

      req.body.submitted_ip = getClientIp(req);
      const record = await maintenanceRecordModel.create(req.body);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      res.status(500).json({ success: false, error: 'An unexpected error occurred' });
    }
  },

  getAllRecords: async (req, res) => {
    try {
      const user = req.user;
      const params = { ...req.query };
      
      // RBAC Enforcement: Technicians can only see their own submissions
      // Managers, Admins, Super Admins can see all.
      // Assuming 'technician' is the restricted role. 
      // If we don't have req.user (e.g. public endpoint), we skip RBAC but this route should be protected.
      if (user && user.role === 'technician') {
        const formattedName = `${user.full_name || user.username} (${user.username})`;
        params.submittedBy = formattedName;
      }

      // If no page/limit provided, we might default to getting everything for backwards compatibility,
      // but let's encourage pagination. If ?page= is missing, default to 1 and limit 2000 (legacy).
      if (!params.page && !params.limit && !params.line && !params.status && !params.search) {
         // Fallback for legacy calls that don't pass any params
         const records = await maintenanceRecordModel.getAll();
         return res.status(200).json({ success: true, data: records });
      }

      const result = await maintenanceRecordModel.getPaginated(params);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      console.error('Error listing maintenance records:', error);
      res.status(500).json({ success: false, error: 'An unexpected error occurred' });
    }
  },

  getRecordById: async (req, res) => {
    try {
      const { id } = req.params;
      const targetId = parseInt(id);
      if (isNaN(targetId)) {
        return res.status(400).json({ success: false, error: 'Invalid record ID' });
      }

      const record = await maintenanceRecordModel.getById(targetId);
      if (!record) return res.status(404).json({ success: false, error: 'Record not found' });
      res.status(200).json({ success: true, data: record });
    } catch (error) {
      console.error('Error fetching maintenance record:', error);
      res.status(500).json({ success: false, error: 'An unexpected error occurred' });
    }
  },

  updateRecord: async (req, res) => {
    try {
      const { id } = req.params;
      const targetId = parseInt(id);
      if (isNaN(targetId)) {
        return res.status(400).json({ success: false, error: 'Invalid record ID' });
      }

      const record = await maintenanceRecordModel.getById(targetId);
      if (!record) {
        return res.status(404).json({ success: false, error: 'Record not found' });
      }
      if (record.status !== 'DISAPPROVED') {
        return res.status(400).json({ success: false, error: 'Only disapproved records can be modified' });
      }

      req.body.submitted_ip = getClientIp(req);
      const updated = await maintenanceRecordModel.update(targetId, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('Error updating maintenance record:', error);
      res.status(500).json({ success: false, error: 'An unexpected error occurred' });
    }
  },

  reviewRecord: async (req, res) => {
    try {
      const { id } = req.params;
      const { action, remarks, designated_manager_id } = req.body;
      const targetId = parseInt(id);
      if (isNaN(targetId)) {
        return res.status(400).json({ success: false, error: 'Invalid record ID' });
      }

      const record = await maintenanceRecordModel.getById(targetId);
      if (!record) {
        return res.status(404).json({ success: false, error: 'Record not found' });
      }

      const user = req.user;
      let newStatus;
      let reviewerName = `${user.full_name || user.username} (${user.username})`;

      if (action === 'approve') {
        if (user.role === 'engineer') {
          if (record.status !== 'SUBMITTED') {
            return res.status(400).json({ success: false, error: 'Engineer can only approve SUBMITTED records' });
          }
          newStatus = 'ENG_APPROVED';
        } else if (user.role === 'manager') {
          if (record.status !== 'ENG_APPROVED') {
            return res.status(400).json({ success: false, error: 'Manager can only approve ENG_APPROVED records' });
          }
          newStatus = 'APPROVED';
        } else if (user.role === 'super_admin' || user.role === 'admin') {
          if (record.status === 'SUBMITTED') {
            newStatus = 'ENG_APPROVED';
          } else if (record.status === 'ENG_APPROVED') {
            newStatus = 'APPROVED';
          } else {
            return res.status(400).json({ success: false, error: 'Record is not in a status that can be approved' });
          }
        } else {
          return res.status(403).json({ success: false, error: 'Unauthorized role for approval' });
        }
      } else if (action === 'disapprove') {
        if (!remarks || remarks.trim() === '') {
          return res.status(400).json({ success: false, error: 'Rejection reason is required' });
        }
        newStatus = 'DISAPPROVED';
      } else {
        return res.status(400).json({ success: false, error: 'Invalid review action' });
      }

      const updated = await maintenanceRecordModel.reviewWorkflow(
        targetId,
        newStatus,
        reviewerName,
        remarks || null,
        user.role,
        getClientIp(req),
        designated_manager_id || null
      );
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('Error reviewing maintenance record:', error);
      res.status(500).json({ success: false, error: 'An unexpected error occurred' });
    }
  },

  reassignRecord: async (req, res) => {
    try {
      const targetId = req.params.id;
      const { username } = req.body;

      if (!username || username.trim() === '') {
        return res.status(400).json({ success: false, error: 'Target assignee username is required' });
      }

      const prisma = require('../config/db');
      const targetUser = await prisma.appUser.findUnique({
        where: { username: username.trim() }
      });

      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'Target assignee user not found' });
      }

      const allowedRoles = ['technician', 'engineer', 'manager', 'super_admin', 'admin'];
      if (!allowedRoles.includes(targetUser.role)) {
        return res.status(400).json({ success: false, error: 'Target assignee does not have a valid assignment role' });
      }

      const formattedName = `${targetUser.full_name} (${targetUser.username})`;

      const record = await prisma.aoiSpiMaintenanceRecord.findUnique({
        where: { id: parseInt(targetId) }
      });
      if (!record) {
        return res.status(404).json({ success: false, error: 'Maintenance record not found' });
      }

      if (record.status === 'APPROVED') {
        return res.status(400).json({ success: false, error: 'Approved records cannot be reassigned' });
      }

      const reassignerName = `${req.user.full_name || req.user.username} (${req.user.username})`;

      const updated = await prisma.aoiSpiMaintenanceRecord.update({
        where: { id: parseInt(targetId) },
        data: {
          submitted_by: formattedName,
          reassigned_by: reassignerName,
          reassigned_at: new Date(),
          reassigned_ip: getClientIp(req)
        }
      });

      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('Error reassigning record:', error);
      res.status(500).json({ success: false, error: 'An unexpected error occurred' });
    }
  },

  deleteRecord: async (req, res) => {
    try {
      const { id } = req.params;
      const targetId = parseInt(id);
      if (isNaN(targetId)) {
        return res.status(400).json({ success: false, error: 'Invalid record ID' });
      }

      const record = await maintenanceRecordModel.getById(targetId);
      if (!record) {
        return res.status(404).json({ success: false, error: 'Record not found' });
      }

      if (record.status === 'APPROVED') {
        return res.status(400).json({ success: false, error: 'Approved records cannot be deleted' });
      }

      await maintenanceRecordModel.delete(targetId);
      res.status(200).json({ success: true, message: 'Record deleted successfully' });
    } catch (error) {
      console.error('Error deleting record:', error);
      res.status(500).json({ success: false, error: 'An unexpected error occurred' });
    }
  },

  batchReview: async (req, res) => {
    try {
      const { ids, action, remarks, designated_manager_id } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid or empty IDs array' });
      }

      const user = req.user;
      let reviewerName = `${user.full_name || user.username} (${user.username})`;
      const clientIp = getClientIp(req);

      const updatedRecords = await prisma.$transaction(async (tx) => {
        const results = [];
        for (const id of ids) {
          const targetId = parseInt(id);
          const record = await tx.aoiSpiMaintenanceRecord.findUnique({
            where: { id: targetId }
          });
          if (!record) {
            throw new Error(`Record with ID ${id} not found`);
          }

          let newStatus;
          if (action === 'approve') {
            if (user.role === 'engineer') {
              if (record.status !== 'SUBMITTED') {
                throw new Error(`Record ${id} is not in SUBMITTED state for Engineer review`);
              }
              newStatus = 'ENG_APPROVED';
            } else if (user.role === 'manager') {
              if (record.status !== 'ENG_APPROVED') {
                throw new Error(`Record ${id} is not in ENG_APPROVED state for Manager review`);
              }
              newStatus = 'APPROVED';
            } else if (user.role === 'super_admin' || user.role === 'admin') {
              if (record.status === 'SUBMITTED') {
                newStatus = 'ENG_APPROVED';
              } else if (record.status === 'ENG_APPROVED') {
                newStatus = 'APPROVED';
              } else {
                throw new Error(`Record ${id} cannot be approved in its current state`);
              }
            } else {
              throw new Error('Unauthorized role for approval');
            }
          } else if (action === 'disapprove') {
            if (!remarks || remarks.trim() === '') {
              throw new Error('Rejection reason is required');
            }
            newStatus = 'DISAPPROVED';
          } else {
            throw new Error('Invalid review action');
          }

          const updateData = { status: newStatus };
          if (newStatus === 'ENG_APPROVED') {
            updateData.engineer_reviewed_by = reviewerName;
            updateData.eng_reviewed_at = new Date();
            updateData.eng_reviewed_ip = clientIp;
            if (designated_manager_id) updateData.designated_manager_id = designated_manager_id;
          } else if (newStatus === 'APPROVED') {
            updateData.manager_reviewed_by = reviewerName;
            updateData.mgr_approved_at = new Date();
            updateData.reviewed_by = reviewerName;
            updateData.mgr_approved_ip = clientIp;
          } else if (newStatus === 'DISAPPROVED') {
            updateData.rejection_reason = remarks;
            if (user.role === 'engineer') {
              updateData.engineer_reviewed_by = reviewerName;
              updateData.eng_reviewed_at = new Date();
              updateData.eng_reviewed_ip = clientIp;
            } else if (user.role === 'manager') {
              updateData.manager_reviewed_by = reviewerName;
              updateData.mgr_approved_at = new Date();
              updateData.mgr_approved_ip = clientIp;
            } else {
              updateData.engineer_reviewed_by = reviewerName;
              updateData.eng_reviewed_at = new Date();
              updateData.eng_reviewed_ip = clientIp;
            }
          }

          const updated = await tx.aoiSpiMaintenanceRecord.update({
            where: { id: targetId },
            data: updateData
          });
          results.push(updated);
        }
        return results;
      });

      res.status(200).json({ success: true, data: updatedRecords });
    } catch (error) {
      console.error('Error batch-reviewing records:', error);
      res.status(500).json({ success: false, error: error.message || 'An unexpected error occurred during batch review' });
    }
  },

  batchReassign: async (req, res) => {
    try {
      const { ids, username } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid or empty IDs array' });
      }
      if (!username) {
        return res.status(400).json({ success: false, error: 'Assignee username is required' });
      }

      const targetUser = await prisma.user.findUnique({
        where: { username }
      });
      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'Target user not found' });
      }
      const formattedName = `${targetUser.full_name} (${targetUser.username})`;
      const reassignerName = `${req.user.full_name || req.user.username} (${req.user.username})`;
      const clientIp = getClientIp(req);

      const updatedRecords = await prisma.$transaction(async (tx) => {
        const results = [];
        for (const id of ids) {
          const targetId = parseInt(id);
          const record = await tx.aoiSpiMaintenanceRecord.findUnique({
            where: { id: targetId }
          });
          if (!record) {
            throw new Error(`Record with ID ${id} not found`);
          }
          if (record.status === 'APPROVED') {
            throw new Error(`Record ${id} is approved and cannot be reassigned`);
          }

          const updated = await tx.aoiSpiMaintenanceRecord.update({
            where: { id: targetId },
            data: {
              submitted_by: formattedName,
              reassigned_by: reassignerName,
              reassigned_at: new Date(),
              reassigned_ip: clientIp
            }
          });
          results.push(updated);
        }
        return results;
      });

      res.status(200).json({ success: true, data: updatedRecords });
    } catch (error) {
      console.error('Error batch-reassigning records:', error);
      res.status(500).json({ success: false, error: error.message || 'An unexpected error occurred during batch reassignment' });
    }
  },

  batchDelete: async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid or empty IDs array' });
      }

      await prisma.$transaction(async (tx) => {
        for (const id of ids) {
          const targetId = parseInt(id);
          const record = await tx.aoiSpiMaintenanceRecord.findUnique({
            where: { id: targetId }
          });
          if (!record) {
            throw new Error(`Record with ID ${id} not found`);
          }
          if (record.status === 'APPROVED') {
            throw new Error(`Record ${id} is approved and cannot be deleted`);
          }
          await tx.aoiSpiMaintenanceRecord.delete({
            where: { id: targetId }
          });
        }
      });

      res.status(200).json({ success: true, message: 'All specified records deleted successfully' });
    } catch (error) {
      console.error('Error batch-deleting records:', error);
      res.status(500).json({ success: false, error: error.message || 'An unexpected error occurred during batch deletion' });
    }
  }
};

module.exports = maintenanceRecordController;
