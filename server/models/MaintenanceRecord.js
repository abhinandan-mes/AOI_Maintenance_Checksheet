const prisma = require('../config/db');

const maintenanceFields = [
  'm1_clean_test_area',
  'm2_clean_inside_wipe_sensor',
  'm3_check_equipment_box',
  'm4_clean_filter_cotton',
  'm5_check_belt_dirty_damaged',
  'm6_check_rails_smooth',
  'm7_check_tank_chain',
  'm8_check_no_jitter',
  'm9_clean_dust_collector',
  'm10_exhaust_pipe_damaged',
  'q1_clean_cabinet_dust',
  'q2_inspect_belt',
  'q3_screws_rails_lubricant',
  'q4_replace_filter_screen'
];

const maintenanceRecordModel = {
  create: async (data) => {
    const insertData = {
      equipment_type: data.equipment_type,
      machine_name: data.machine_name || null,
      machine_type: data.machine_type || null,
      machine_asset_no: data.machine_asset_no || null,
      line: data.line || null,
      date: new Date(data.date),
      period: data.period,
      submitted_by: data.submitted_by || null,
      status: data.status || 'SUBMITTED',
      rejection_reason: data.rejection_reason || null,
      remarks: data.remarks || null,
      submitted_ip: data.submitted_ip || null,
      designated_engineer_id: data.designated_engineer_id || null,
      designated_manager_id: data.designated_manager_id || null,
      image_paths: data.image_paths || []
    };

    maintenanceFields.forEach(field => {
      if (data[field] !== undefined) {
        insertData[field] = data[field] === null ? null : Boolean(data[field]);
      }
    });

    return await prisma.aoiSpiMaintenanceRecord.create({
      data: insertData
    });
  },

  update: async (id, data) => {
    // Fetch existing record to check if it was disapproved
    const existing = await prisma.aoiSpiMaintenanceRecord.findUnique({
      where: { id: parseInt(id) }
    });

    let finalRemarks = data.remarks || null;
    if (existing && existing.status === 'DISAPPROVED' && existing.rejection_reason) {
      const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
      const logEntry = `[Resubmit Log: ${timestamp}] Resubmitted after disapproval. Past disapproval reason: "${existing.rejection_reason}"`;
      if (finalRemarks) {
        finalRemarks = `${finalRemarks}\n${logEntry}`;
      } else {
        finalRemarks = logEntry;
      }
    }

    const updateData = {
      equipment_type: data.equipment_type,
      machine_name: data.machine_name || null,
      machine_type: data.machine_type || null,
      machine_asset_no: data.machine_asset_no || null,
      line: data.line || null,
      date: new Date(data.date),
      period: data.period,
      submitted_by: data.submitted_by || null,
      remarks: finalRemarks,
      status: 'SUBMITTED',
      rejection_reason: null,
      submitted_ip: data.submitted_ip || null,
      designated_engineer_id: data.designated_engineer_id || null,
      designated_manager_id: data.designated_manager_id || null,
      image_paths: data.image_paths || []
    };

    maintenanceFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field] === null ? null : Boolean(data[field]);
      }
    });

    return await prisma.aoiSpiMaintenanceRecord.update({
      where: { id: parseInt(id) },
      data: updateData
    });
  },

  getPaginated: async (params) => {
    const { page = 1, limit = 500, line, period, status, from, to, search, submittedBy } = params;
    
    const skip = (page - 1) * limit;
    
    let where = {};
    if (line && line !== 'All lines') where.line = line;
    if (period && period !== 'All periods') where.period = period;
    if (status && status !== 'All') where.status = status;
    if (submittedBy) where.submitted_by = submittedBy; // RBAC enforcement
    
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    
    if (search) {
      where.OR = [
        { machine_serial_no: { contains: search, mode: 'insensitive' } },
        { machine_asset_no: { contains: search, mode: 'insensitive' } },
        { machine_type: { contains: search, mode: 'insensitive' } },
        { machine_name: { contains: search, mode: 'insensitive' } },
        { submitted_by: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [totalCount, records] = await Promise.all([
      prisma.aoiSpiMaintenanceRecord.count({ where }),
      prisma.aoiSpiMaintenanceRecord.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: parseInt(limit)
      })
    ]);
    
    return {
      records,
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / limit)
    };
  },

  getAll: async () => {
    return await prisma.aoiSpiMaintenanceRecord.findMany({
      orderBy: { date: 'desc' },
      take: 200
    });
  },

  getById: async (id) => {
    return await prisma.aoiSpiMaintenanceRecord.findUnique({
      where: { id: parseInt(id) }
    });
  },

  review: async (id, reviewedBy) => {
    return await prisma.aoiSpiMaintenanceRecord.update({
      where: { id: parseInt(id) },
      data: { reviewed_by: reviewedBy, status: 'APPROVED' }
    });
  },

  reviewWorkflow: async (id, status, reviewerName, rejectionReason = null, reviewerRole = null, ip = null, designatedManagerId = null) => {
    const updateData = {
      status: status
    };
    if (status === 'ENG_APPROVED') {
      updateData.engineer_reviewed_by = reviewerName;
      updateData.eng_reviewed_at = new Date();
      if (ip) updateData.eng_reviewed_ip = ip;
      if (designatedManagerId) updateData.designated_manager_id = designatedManagerId;
    } else if (status === 'APPROVED') {
      updateData.manager_reviewed_by = reviewerName;
      updateData.mgr_approved_at = new Date();
      updateData.reviewed_by = reviewerName;
      if (ip) updateData.mgr_approved_ip = ip;
    } else if (status === 'DISAPPROVED') {
      updateData.rejection_reason = rejectionReason;
      if (reviewerRole === 'engineer') {
        updateData.engineer_reviewed_by = reviewerName;
        updateData.eng_reviewed_at = new Date();
        if (ip) updateData.eng_reviewed_ip = ip;
      } else if (reviewerRole === 'manager') {
        updateData.manager_reviewed_by = reviewerName;
        updateData.mgr_approved_at = new Date();
        if (ip) updateData.mgr_approved_ip = ip;
      } else {
        // Fallback for admin or other roles
        updateData.engineer_reviewed_by = reviewerName;
        updateData.eng_reviewed_at = new Date();
        if (ip) updateData.eng_reviewed_ip = ip;
      }
    }

    return await prisma.aoiSpiMaintenanceRecord.update({
      where: { id: parseInt(id) },
      data: updateData
    });
  },

  delete: async (id) => {
    return await prisma.aoiSpiMaintenanceRecord.delete({
      where: { id: parseInt(id) }
    });
  }
};

module.exports = maintenanceRecordModel;
