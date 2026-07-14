import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import './Reports.css';
import { useLanguage } from '../contexts/LanguageContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Import Child Components
import ReportStats from './reports/ReportStats';
import ReportFilters from './reports/ReportFilters';
import ReportDetailPanel from './reports/ReportDetailPanel';
import WorkflowModal from './WorkflowModal';
import ConfirmModal from './ConfirmModal';

const lineOptions = Array.from({ length: 25 }, (_, index) => String(401 + index));

export default function Reports({ currentUser }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [potentialAssignees, setPotentialAssignees] = useState([]);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'approve', // 'approve' | 'disapprove' | 'success'
    recordId: null,
    details: {}
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalApiError, setModalApiError] = useState('');

  const [bulkRejectState, setBulkRejectState] = useState({
    isOpen: false,
    reason: '',
    ids: []
  });

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    showCancel: true,
    isDanger: false,
    onConfirm: () => {}
  });

  const showConfirm = (title, message, onConfirm, isDanger = false) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText: language === 'zh' ? '确定' : 'Confirm',
      cancelText: language === 'zh' ? '取消' : 'Cancel',
      showCancel: true,
      isDanger,
      onConfirm: () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      }
    });
  };

  const showAlert = (title, message) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText: language === 'zh' ? '确定' : 'OK',
      showCancel: false,
      isDanger: false,
      onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const [filters, setFilters] = useState({
    from: '',
    to: '',
    line: '',
    period: '',
    search: '',
    status: ''
  });
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);


  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit,
        ...(filters.from && { from: filters.from }),
        ...(filters.to && { to: filters.to }),
        ...(filters.line && { line: filters.line }),
        ...(filters.period && { period: filters.period }),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status })
      };
      const response = await apiService.getAllMaintenanceRecords(params);
      setRows(response.data.records || []);
      setTotalCount(response.data.totalCount || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, limit, filters]);
  
  // Previous useEffect for query parameters parsing
  useEffect(() => {
    
    // Parse ?open=ID URL parameters
    const queryParams = new URLSearchParams(window.location.search);
    const openId = queryParams.get('open');
    if (openId) {
      const parsedId = parseInt(openId, 10);
      setExpandedRowId(parsedId);
      setTimeout(() => {
        const el = document.getElementById(`row-${parsedId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, []);

  useEffect(() => {
    const fetchAssignees = async () => {
      try {
        const response = await apiService.getActiveAssignees();
        setPotentialAssignees(response.data.users || []);
      } catch (err) {
        console.error('Failed to load assignees:', err);
      }
    };
    if (currentUser) {
      fetchAssignees();
    }
  }, [currentUser]);

  // Backend already handles filtering, just pass rows through
  const filteredRows = useMemo(() => rows, [rows]);

  // Consolidate filtered database rows into checksheet group entries
  const groupedRows = useMemo(() => {
    const groups = {};
    filteredRows.forEach(r => {
      const dateStr = r.date.split('T')[0];
      const key = `${dateStr}-${r.line}-${r.period}-${r.submitted_by}`;
      if (!groups[key]) {
        groups[key] = {
          id: r.id, // Primary record id used for keys & toggle anchors
          date: dateStr,
          line: r.line,
          period: r.period,
          status: r.status,
          submitted_by: r.submitted_by,
          engineer_reviewed_by: r.engineer_reviewed_by,
          eng_reviewed_at: r.eng_reviewed_at,
          manager_reviewed_by: r.manager_reviewed_by,
          mgr_approved_at: r.mgr_approved_at,
          reassigned_by: r.reassigned_by,
          reassigned_at: r.reassigned_at,
          submitted_ip: r.submitted_ip,
          eng_reviewed_ip: r.eng_reviewed_ip,
          mgr_approved_ip: r.mgr_approved_ip,
          reassigned_ip: r.reassigned_ip,
          created_at: r.created_at,
          records: [r]
        };
      } else {
        groups[key].records.push(r);
      }
    });
    return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredRows]);



  const handleToggleSelectRow = (id, e) => {
    e.stopPropagation(); // Prevent row expand click
    setSelectedRowIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedRowIds.length === groupedRows.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(groupedRows.map(g => g.id));
    }
  };

  // Get all individual machine records for the selected checksheet groups
  const selectedRecords = useMemo(() => {
    const selectedGroupKeys = new Set(
      groupedRows
        .filter(g => selectedRowIds.includes(g.id))
        .map(g => `${g.date}-${g.line}-${g.period}-${g.submitted_by}`)
    );

    return filteredRows.filter(r => {
      const dateStr = r.date.split('T')[0];
      const key = `${dateStr}-${r.line}-${r.period}-${r.submitted_by}`;
      return selectedGroupKeys.has(key);
    });
  }, [filteredRows, groupedRows, selectedRowIds]);


  // Consolidate all database rows in history to compute accurate stats count
  const allGroupedRows = useMemo(() => {
    const groups = {};
    rows.forEach(r => {
      const dateStr = r.date.split('T')[0];
      const key = `${dateStr}-${r.line}-${r.period}-${r.submitted_by}`;
      if (!groups[key]) {
        groups[key] = {
          status: r.status
        };
      }
    });
    return Object.values(groups);
  }, [rows]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset page on filter change
  };

  const clearFilters = () => {
    setFilters({
      from: '',
      to: '',
      line: '',
      period: '',
      search: '',
      status: ''
    });
    setPage(1);
  };

  const handleWorkflowReview = (id, action, recordDetails = {}) => {
    setModalApiError('');
    setModalLoading(false);
    setModalConfig({
      isOpen: true,
      type: action,
      recordId: id,
      details: recordDetails
    });
  };

  const handleModalConfirm = async (type, remarks) => {
    const id = modalConfig.recordId;
    setModalLoading(true);
    setModalApiError('');
    try {
      const primaryRec = rows.find(r => r.id === id);
      if (primaryRec) {
        const targetDateStr = primaryRec.date.split('T')[0];
        const group = rows.filter(rec => 
          rec.line === primaryRec.line && 
          rec.period === primaryRec.period && 
          rec.date.split('T')[0] === targetDateStr &&
          rec.submitted_by === primaryRec.submitted_by
        );

        const userRole = currentUser?.role;
        const recordsToReview = group.filter(rec => {
          if (type === 'disapprove') {
            return rec.status !== 'DISAPPROVED' && rec.status !== 'APPROVED';
          } else {
            // Approve action
            if (userRole === 'engineer') return rec.status === 'SUBMITTED';
            if (userRole === 'manager') return rec.status === 'ENG_APPROVED';
            if (userRole === 'super_admin' || userRole === 'admin') {
              return rec.status === 'SUBMITTED' || rec.status === 'ENG_APPROVED';
            }
            return false;
          }
        });

        const recordIdsToReview = recordsToReview.map(r => r.id);
        if (recordIdsToReview.length > 0) {
          await apiService.batchReviewRecords({
            ids: recordIdsToReview,
            action: type,
            remarks
          });
        }
      } else {
        await apiService.batchReviewRecords({
          ids: [id],
          action: type,
          remarks
        });
      }

      setModalConfig(prev => ({ ...prev, type: 'success' }));
      setTimeout(() => {
        setModalConfig({ isOpen: false, type: 'approve', recordId: null, details: {} });
        fetchRecords();
      }, 1500);
    } catch (err) {
      setModalApiError(err.message || 'Workflow action failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const toggleRowExpand = (id) => {
    setExpandedRowId(prev => (prev === id ? null : id));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(language === 'zh' ? 'zh-CN' : undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const monthlyChecks = [
    { key: 'm1_clean_test_area', label: t('m1_label') },
    { key: 'm2_clean_inside_wipe_sensor', label: t('m2_label') },
    { key: 'm3_check_equipment_box', label: t('m3_label') },
    { key: 'm4_clean_filter_cotton', label: t('m4_label') },
    { key: 'm5_check_belt_dirty_damaged', label: t('m5_label') },
    { key: 'm6_check_rails_smooth', label: t('m6_label') },
    { key: 'm7_check_tank_chain', label: t('m7_label') },
    { key: 'm8_check_no_jitter', label: t('m8_label') }
  ];

  const quarterlyChecks = [
    { key: 'q1_clean_cabinet_dust', label: t('q1_label') },
    { key: 'q2_inspect_belt', label: t('q2_label') },
    { key: 'q3_screws_rails_lubricant', label: t('q3_label') }
  ];

  // Export grouped checksheets
  const generateGroupedData = () => {
    const selectedGroups = groupedRows.filter(g => selectedRowIds.includes(g.id));
    return selectedGroups;
  };

  const getApprovalHistoryText = (group) => {
    const lines = [];
    if (group.created_at) {
      lines.push(`Submitted By: ${group.submitted_by} (${new Date(group.created_at).toLocaleString()})`);
    } else {
      lines.push(`Submitted By: ${group.submitted_by}`);
    }
    
    if (group.engineer_reviewed_by) {
      lines.push(`Engineer Review: ${group.engineer_reviewed_by} ${group.eng_reviewed_at ? '('+new Date(group.eng_reviewed_at).toLocaleString()+')' : ''}`);
    }
    if (group.manager_reviewed_by) {
      lines.push(`Manager Final: ${group.manager_reviewed_by} ${group.mgr_approved_at ? '('+new Date(group.mgr_approved_at).toLocaleString()+')' : ''}`);
    }
    
    lines.push(`Current Status: ${group.status}`);
    return lines.join(' \n');
  };

  const getApprovalHistoryHtml = (group) => {
    let html = `<div style="margin-top: 15px; padding: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">`;
    html += `<h4 style="margin: 0 0 10px 0; color: #334155;">Workflow History</h4>`;
    html += `<table style="width:100%; font-size:12px; font-family:sans-serif; color:#475569;">`;
    
    const timeStr = (ts) => ts ? new Date(ts).toLocaleString() : 'N/A';
    
    html += `<tr><td style="padding:4px 0;"><strong>Submitted:</strong></td><td>${group.submitted_by}</td><td style="text-align:right;">${timeStr(group.created_at)}</td></tr>`;
    
    if (group.engineer_reviewed_by) {
      html += `<tr><td style="padding:4px 0;"><strong>Engineer Review:</strong></td><td>${group.engineer_reviewed_by}</td><td style="text-align:right;">${timeStr(group.eng_reviewed_at)}</td></tr>`;
    }
    if (group.manager_reviewed_by) {
      html += `<tr><td style="padding:4px 0;"><strong>Manager Final:</strong></td><td>${group.manager_reviewed_by}</td><td style="text-align:right;">${timeStr(group.mgr_approved_at)}</td></tr>`;
    }
    html += `<tr><td style="padding:4px 0; padding-top: 8px;"><strong>Status:</strong></td><td colspan="2" style="padding-top: 8px;"><strong>${group.status}</strong></td></tr>`;
    html += `</table></div>`;
    return html;
  };

  const executeExportCSV = () => {
    const selectedGroups = generateGroupedData();
    const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    let csvContent = "";

    selectedGroups.forEach((group, index) => {
      if (index > 0) csvContent += "\n\n";
      csvContent += `Date: ${group.date},Line: ${group.line},Period: ${group.period}\n`;
      
      const laser = group.records.find(r => r.equipment_type === 'LASER') || {};
      const spi = group.records.find(r => r.equipment_type === 'SPI') || {};
      const preAoi = group.records.find(r => r.equipment_type === 'PRE_AOI') || {};
      const postAoi = group.records.find(r => r.equipment_type === 'POST_AOI') || {};

      const getVal = (rec, key) => rec[key] === 1 || rec[key] === true ? '✅' : (rec[key] === 0 || rec[key] === false ? '❌' : 'N/A');

      csvContent += "Check Item,LASER,SPI,PRE-AOI,POST-AOI\n";
      csvContent += `Machine Name,${escape(laser.machine_name)},${escape(spi.machine_name)},${escape(preAoi.machine_name)},${escape(postAoi.machine_name)}\n`;
      csvContent += `Asset No,${escape(laser.machine_asset_no)},${escape(spi.machine_asset_no)},${escape(preAoi.machine_asset_no)},${escape(postAoi.machine_asset_no)}\n`;
      
      monthlyChecks.forEach(c => {
        csvContent += `${escape(c.label)},${getVal(laser, c.key)},${getVal(spi, c.key)},${getVal(preAoi, c.key)},${getVal(postAoi, c.key)}\n`;
      });

      if (group.period === 'Third Month') {
        quarterlyChecks.forEach(c => {
          csvContent += `${escape(c.label)},${getVal(laser, c.key)},${getVal(spi, c.key)},${getVal(preAoi, c.key)},${getVal(postAoi, c.key)}\n`;
        });
      }
      
      csvContent += `\nRemarks:,${escape(group.records[0]?.remarks || 'None')}\n\n`;
      
      // Approval Path
      csvContent += "Approval History\n";
      csvContent += `Submitted By:,${escape(group.submitted_by)},${group.created_at ? new Date(group.created_at).toLocaleString() : ''}\n`;
      if (group.engineer_reviewed_by) csvContent += `Engineer Review:,${escape(group.engineer_reviewed_by)},${group.eng_reviewed_at ? new Date(group.eng_reviewed_at).toLocaleString() : ''}\n`;
      if (group.manager_reviewed_by) csvContent += `Manager Final:,${escape(group.manager_reviewed_by)},${group.mgr_approved_at ? new Date(group.mgr_approved_at).toLocaleString() : ''}\n`;
      csvContent += `Current Status:,${escape(group.status)}\n`;
    });

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const lineNames = [...new Set(selectedGroups.map(g => g.line))].join('_');
    const fileName = `AOI_Maintenance_Reports_Line_${lineNames}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executeExportPDF = () => {
    const selectedGroups = generateGroupedData();
    const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });
    
    let currentY = 15;

    selectedGroups.forEach((group, index) => {
      if (index > 0) {
        doc.addPage();
        currentY = 15;
      }
      
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.text('AOI Maintenance Checksheet Report', 14, currentY);
      currentY += 8;
      
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text(`Date: ${group.date} | Line: ${group.line} | Period: ${group.period}`, 14, currentY);
      currentY += 8;

      const laser = group.records.find(r => r.equipment_type === 'LASER') || {};
      const spi = group.records.find(r => r.equipment_type === 'SPI') || {};
      const preAoi = group.records.find(r => r.equipment_type === 'PRE_AOI') || {};
      const postAoi = group.records.find(r => r.equipment_type === 'POST_AOI') || {};

      // In standard jsPDF Helvetica, ✔ and ✘ might render poorly.
      // We will try standard 'v' and 'X' if unicode fails, but let's use the UTF-8 text and rely on autoTable's rendering.
      // A common PDF trick is using 'Y' and 'N' or 'Pass'/'Fail' if font is missing. We will try tick/cross.
      const getVal = (rec, key) => {
        if (rec[key] === 1 || rec[key] === true) return 'Pass';
        if (rec[key] === 0 || rec[key] === false) return 'Fail';
        return '-';
      };

      const body = [];
      body.push(['Machine Name', laser.machine_name||'-', spi.machine_name||'-', preAoi.machine_name||'-', postAoi.machine_name||'-']);
      body.push(['Asset No', laser.machine_asset_no||'-', spi.machine_asset_no||'-', preAoi.machine_asset_no||'-', postAoi.machine_asset_no||'-']);
      
      monthlyChecks.forEach(c => {
        body.push([c.label, getVal(laser, c.key), getVal(spi, c.key), getVal(preAoi, c.key), getVal(postAoi, c.key)]);
      });

      if (group.period === 'Third Month') {
        body.push([{ content: 'Quarterly Checks', colSpan: 5, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [30, 58, 138] } }]);
        quarterlyChecks.forEach(c => {
          body.push([c.label, getVal(laser, c.key), getVal(spi, c.key), getVal(preAoi, c.key), getVal(postAoi, c.key)]);
        });
      }

      autoTable(doc, {
        head: [['Check Item', 'LASER', 'SPI', 'PRE-AOI', 'POST-AOI']],
        body: body,
        startY: currentY,
        styles: { fontSize: 8.5, cellPadding: 4, overflow: 'linebreak', textColor: [51, 65, 85], lineColor: [226, 232, 240], lineWidth: 0.1 },
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' }
        },
        didParseCell: function(data) {
          if (data.section === 'body' && data.column.index > 0) {
            if (data.cell.raw === 'Pass') data.cell.styles.textColor = [4, 120, 87]; // Green
            if (data.cell.raw === 'Fail') data.cell.styles.textColor = [185, 28, 28]; // Red
          }
        }
      });
      
      currentY = doc.lastAutoTable.finalY + 8;
      
      if (group.records[0] && group.records[0].remarks) {
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105);
        doc.text(`Remarks: ${group.records[0].remarks}`, 14, currentY);
        currentY += 8;
      }
      
      // Approval History block
      currentY += 4;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, currentY, 182, 35, 'FD');
      
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Workflow History', 18, currentY + 7);
      
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const timeStr = (ts) => ts ? new Date(ts).toLocaleString() : 'N/A';
      doc.text(`Submitted: ${group.submitted_by} (${timeStr(group.created_at)})`, 18, currentY + 14);
      if (group.engineer_reviewed_by) {
        doc.text(`Engineer Review: ${group.engineer_reviewed_by} (${timeStr(group.eng_reviewed_at)})`, 18, currentY + 20);
      }
      if (group.manager_reviewed_by) {
        doc.text(`Manager Final: ${group.manager_reviewed_by} (${timeStr(group.mgr_approved_at)})`, 18, currentY + 26);
      }
      doc.setFontSize(9.5);
      doc.setTextColor(30, 58, 138);
      doc.text(`Current Status: ${group.status}`, 18, currentY + 32);
      
    });
    
    const lineNames = [...new Set(selectedGroups.map(g => g.line))].join('_');
    doc.save(`AOI_Maintenance_Reports_Line_${lineNames}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleBulkReview = (action) => {
    if (selectedRowIds.length === 0) {
      showAlert(language === 'zh' ? '警告' : 'Warning', language === 'zh' ? '请先选择记录' : 'Please select records first.');
      return;
    }
    
    // selectedRowIds points to the primary id of each group, but batchReview needs all underlying ids
    // Let's get all underlying ids for the selected groups
    const selectedGroupKeys = new Set(
      groupedRows
        .filter(g => selectedRowIds.includes(g.id))
        .map(g => `${g.date}-${g.line}-${g.period}-${g.submitted_by}`)
    );

    const allUnderlyingIds = rows
      .filter(r => {
        const dateStr = r.date.split('T')[0];
        const key = `${dateStr}-${r.line}-${r.period}-${r.submitted_by}`;
        return selectedGroupKeys.has(key);
      })
      .map(r => r.id);

    if (action === 'disapprove') {
       // Open custom modal instead of window.prompt
       setBulkRejectState({ isOpen: true, reason: '', ids: allUnderlyingIds });
    } else {
       showConfirm(
         language === 'zh' ? '批量审批' : 'Bulk Approve',
         language === 'zh' ? `确认审批选中的 ${selectedRowIds.length} 个项目？` : `Are you sure you want to approve ${selectedRowIds.length} selected items?`,
         () => executeBulkReview('approve', null, allUnderlyingIds)
       );
    }
  };

  const executeBulkReview = async (action, remarks, ids) => {
    try {
      setLoading(true);
      await apiService.batchReviewRecords({ ids, action, remarks });
      setSelectedRowIds([]);
      fetchRecords();
      showAlert(
        language === 'zh' ? '成功' : 'Success',
        language === 'zh' ? '批量操作已成功完成。' : 'Bulk action completed successfully.'
      );
    } catch (err) {
      showAlert(language === 'zh' ? '错误' : 'Error', err.message || 'Bulk review failed');
    } finally {
      setLoading(false);
    }
  };

  const executeExportWord = () => {
    const selectedGroups = generateGroupedData();
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>AOI Maintenance Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #334155; }
          .report-header { color: #1e3a8a; font-size: 20px; font-weight: bold; margin-bottom: 5px; }
          .report-meta { color: #475569; font-size: 13px; margin-bottom: 15px; }
          .modern-table { border-collapse: collapse; width: 100%; font-size: 12px; border: 1px solid #e2e8f0; }
          .modern-table th { background-color: #1e3a8a; color: white; padding: 10px 8px; text-align: center; }
          .modern-table th:first-child { text-align: left; }
          .modern-table td { border: 1px solid #e2e8f0; padding: 8px; text-align: center; color: #475569; }
          .modern-table td:first-child { text-align: left; font-weight: 500; color: #1e293b; }
          .modern-table tr:nth-child(even) { background-color: #f8fafc; }
          .text-green { color: #059669; font-weight: bold; }
          .text-red { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
    `;

    selectedGroups.forEach((group, index) => {
      const laser = group.records.find(r => r.equipment_type === 'LASER') || {};
      const spi = group.records.find(r => r.equipment_type === 'SPI') || {};
      const preAoi = group.records.find(r => r.equipment_type === 'PRE_AOI') || {};
      const postAoi = group.records.find(r => r.equipment_type === 'POST_AOI') || {};
      
      const getVal = (rec, key) => {
        if (rec[key] === 1 || rec[key] === true) return '<span class="text-green">✅</span>';
        if (rec[key] === 0 || rec[key] === false) return '<span class="text-red">❌</span>';
        return '<span style="color:#94a3b8">-</span>';
      };

      htmlContent += `
        <div class="report-header">AOI Maintenance Checksheet Report</div>
        <div class="report-meta">
          <strong>Date:</strong> ${group.date} &nbsp;|&nbsp; <strong>Line:</strong> ${group.line} &nbsp;|&nbsp; <strong>Period:</strong> ${group.period}
        </div>
        
        <table class="modern-table">
          <thead>
            <tr>
              <th style="width: 40%;">Check Item</th>
              <th>LASER</th>
              <th>SPI</th>
              <th>PRE-AOI</th>
              <th>POST-AOI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Machine Name</td>
              <td>${laser.machine_name||'-'}</td>
              <td>${spi.machine_name||'-'}</td>
              <td>${preAoi.machine_name||'-'}</td>
              <td>${postAoi.machine_name||'-'}</td>
            </tr>
            <tr>
              <td>Asset No</td>
              <td>${laser.machine_asset_no||'-'}</td>
              <td>${spi.machine_asset_no||'-'}</td>
              <td>${preAoi.machine_asset_no||'-'}</td>
              <td>${postAoi.machine_asset_no||'-'}</td>
            </tr>
      `;

      monthlyChecks.forEach(c => {
        htmlContent += `
            <tr>
              <td>${c.label}</td>
              <td>${getVal(laser, c.key)}</td>
              <td>${getVal(spi, c.key)}</td>
              <td>${getVal(preAoi, c.key)}</td>
              <td>${getVal(postAoi, c.key)}</td>
            </tr>
        `;
      });

      if (group.period === 'Third Month') {
        htmlContent += `<tr><td colspan="5" style="background-color: #f1f5f9; color: #1e3a8a; font-weight: bold; text-align: center;">Quarterly Checks</td></tr>`;
        quarterlyChecks.forEach(c => {
          htmlContent += `
              <tr>
                <td>${c.label}</td>
                <td>${getVal(laser, c.key)}</td>
                <td>${getVal(spi, c.key)}</td>
                <td>${getVal(preAoi, c.key)}</td>
                <td>${getVal(postAoi, c.key)}</td>
              </tr>
          `;
        });
      }

      htmlContent += `</tbody></table>`;
      
      if (group.records[0] && group.records[0].remarks) {
        htmlContent += `<div style="margin-top: 15px; font-size: 12px; color: #475569;"><strong>Remarks:</strong> ${group.records[0].remarks}</div>`;
      }
      
      htmlContent += getApprovalHistoryHtml(group);
      
      if (index < selectedGroups.length - 1) {
        htmlContent += `<br clear="all" style="page-break-before:always" />`;
      }
    });

    htmlContent += `</body></html>`;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const lineNames = [...new Set(selectedGroups.map(g => g.line))].join('_');
    link.download = `AOI_Maintenance_Reports_Line_${lineNames}_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = (type) => {
    setExportDropdownOpen(false);
    if (selectedRowIds.length === 0) {
      showAlert(
        language === 'zh' ? '导出提示' : 'Export Info',
        language === 'zh'
          ? '请先勾选需要导出的保养检查表记录。'
          : 'Please select at least one checksheet group to export.'
      );
      return;
    }

    const selectedGroupsCount = selectedRowIds.length;
    let formatName = type === 'pdf' ? 'PDF' : type === 'word' ? 'Word' : 'CSV';
    
    const confirmMsg = language === 'zh'
      ? `确定要将已选的 ${selectedGroupsCount} 份保养检查表 (${selectedRecords.length} 条设备记录) 导出为 ${formatName} 吗？`
      : `Are you sure you want to export the selected ${selectedGroupsCount} checksheet groups (${selectedRecords.length} detailed machine records) to ${formatName}?`;

    const execFn = type === 'pdf' ? executeExportPDF : type === 'word' ? executeExportWord : executeExportCSV;

    showConfirm(
      language === 'zh' ? `导出 ${formatName} 确认` : `Export ${formatName} Confirm`,
      confirmMsg,
      execFn
    );
  };



  return (
    <section className="reports-section animate-fade-in">
      {/* Header Panel */}
      <div className="reports-banner-header" style={{ marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 className="premium-heading-gradient" style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
            {t('nav_reports')}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '6px', marginBottom: 0 }}>
            {language === 'zh'
              ? '查阅、筛选、审核及导出 AOI 团队所有已提交的设备保养记录。'
              : 'Audit, search, filter, approve, and export all submitted checksheet groups.'}
          </p>
        </div>

        <div style={{ position: 'relative', display: 'flex', gap: '12px' }}>
          {(currentUser?.role === 'engineer' || currentUser?.role === 'manager' || currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && (
            <>
              <button
                type="button"
                onClick={() => handleBulkReview('approve')}
                disabled={selectedRowIds.length === 0}
                className="btn-review-sign"
                style={{
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                  margin: 0,
                  opacity: selectedRowIds.length === 0 ? 0.5 : 1,
                  cursor: selectedRowIds.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ✅ {language === 'zh' ? '批量通过' : 'Bulk Approve'}
              </button>
              <button
                type="button"
                onClick={() => handleBulkReview('disapprove')}
                disabled={selectedRowIds.length === 0}
                className="btn-review-sign"
                style={{
                  backgroundColor: '#fef2f2',
                  color: '#b91c1c',
                  border: '1px solid #fecaca',
                  margin: 0,
                  opacity: selectedRowIds.length === 0 ? 0.5 : 1,
                  cursor: selectedRowIds.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ❌ {language === 'zh' ? '批量退回' : 'Bulk Reject'}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
            className="btn-review-sign btn-action-review"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontSize: '0.9rem',
              margin: 0
            }}
          >
            📥 {language === 'zh' ? '导出报表' : 'Export Report'} ▾
          </button>
          
          {exportDropdownOpen && (
            <>
              <div 
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
                onClick={() => setExportDropdownOpen(false)}
              />
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                zIndex: 100,
                minWidth: '180px',
                overflow: 'hidden'
              }}>
                <button 
                  onClick={() => handleExport('csv')}
                  style={{ display: 'block', width: '100%', padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#334155', borderBottom: '1px solid #f1f5f9' }}
                  onMouseOver={(e) => e.target.style.background = '#f8fafc'}
                  onMouseOut={(e) => e.target.style.background = 'none'}
                >
                  📄 {language === 'zh' ? '导出为 CSV' : 'Export as CSV'}
                </button>
                <button 
                  onClick={() => handleExport('pdf')}
                  style={{ display: 'block', width: '100%', padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#334155', borderBottom: '1px solid #f1f5f9' }}
                  onMouseOver={(e) => e.target.style.background = '#f8fafc'}
                  onMouseOut={(e) => e.target.style.background = 'none'}
                >
                  📕 {language === 'zh' ? '导出为 PDF' : 'Export as PDF'}
                </button>
                <button 
                  onClick={() => handleExport('word')}
                  style={{ display: 'block', width: '100%', padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}
                  onMouseOver={(e) => e.target.style.background = '#f8fafc'}
                  onMouseOut={(e) => e.target.style.background = 'none'}
                >
                  📘 {language === 'zh' ? '导出为 Word' : 'Export as Word'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* KPI Stats summary */}
      <ReportStats rows={allGroupedRows} language={language} />

      {/* Control filters panel */}
      <ReportFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={clearFilters}
        lineOptions={lineOptions}
        language={language}
        t={t}
      />

      {/* Meta count description */}
      {!loading && !error && (
        <div className="report-meta-bar" style={{ marginBottom: '16px', paddingLeft: '8px' }}>
          <span className="result-count-badge" style={{ fontSize: '0.88rem', color: '#64748b' }}>
            {language === 'zh' 
              ? <span>已过滤显示第 <strong>{groupedRows.length}</strong> 份保养检查表 (共 {allGroupedRows.length} 份)</span>
              : <span>Showing <strong>{groupedRows.length}</strong> of {allGroupedRows.length} checksheet groups</span>
            }
          </span>
        </div>
      )}

      {/* States handler */}
      {loading && (
        <div className="report-state" style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontSize: '1.1rem' }}>
          <span className="loading-spinner" style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid #cbd5e1', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '10px', verticalAlign: 'middle' }}></span>
          {t('loading')}
        </div>
      )}
      {error && <div className="report-state error" style={{ textAlign: 'center', padding: '20px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', margin: '20px 0' }}>⚠️ {t('error')}: {error}</div>}
      {!loading && !error && groupedRows.length === 0 && (
        <div className="report-state" style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '1.05rem' }}>📭 {t('rep_empty')}</div>
      )}

      {/* Main Table View */}
      {!loading && !error && groupedRows.length > 0 && (
        <div className="report-table-wrap" style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden'
        }}>
          <table className="report-table">
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ width: '45px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={groupedRows.length > 0 && selectedRowIds.length === groupedRows.length}
                    onChange={handleToggleSelectAll}
                    style={{ cursor: 'pointer', transform: 'scale(1.15)', verticalAlign: 'middle' }}
                  />
                </th>
                <th style={{ width: '40px' }}></th>
                <th>{t('date')}</th>
                <th>{t('line')}</th>
                <th>{language === 'zh' ? '保养周期' : 'Period'}</th>
                <th>{language === 'zh' ? '保养人' : 'Technician'}</th>
                <th>{language === 'zh' ? '审核状态' : 'Review Status'}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {groupedRows.map(group => {
                const isExpanded = expandedRowId === group.id;
                return (
                  <React.Fragment key={group.id}>
                    <tr 
                      id={`row-${group.id}`}
                      className={isExpanded ? 'expanded-row-parent' : ''} 
                      onClick={() => toggleRowExpand(group.id)} 
                      style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    >
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedRowIds.includes(group.id)}
                          onChange={(e) => handleToggleSelectRow(group.id, e)}
                          style={{ cursor: 'pointer', transform: 'scale(1.15)', verticalAlign: 'middle' }}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`expand-arrow ${isExpanded ? 'open' : ''}`} style={{
                          display: 'inline-block',
                          fontSize: '9px',
                          color: '#64748b',
                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease'
                        }}>▶</span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#334155' }}>{formatDate(group.date)}</td>
                      <td><span style={{ background: '#f1f5f9', color: '#1e3a8a', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>Line {group.line}</span></td>
                      <td>
                        {group.period === 'First Month' && t('maint_period_m1')}
                        {group.period === 'Second Month' && t('maint_period_m2')}
                        {group.period === 'Third Month' && t('maint_period_m3')}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#475569' }}>{group.submitted_by || '—'}</td>
                      <td>
                        <span className={`status-badge status-${group.status.toLowerCase()}`}>
                          {group.status === 'SUBMITTED' && (language === 'zh' ? '待审核' : 'Waiting Eng.')}
                          {group.status === 'ENG_APPROVED' && (language === 'zh' ? '待审批' : 'Waiting Mgr.')}
                          {group.status === 'DISAPPROVED' && (language === 'zh' ? '被退回' : 'Rejected')}
                          {group.status === 'APPROVED' && (language === 'zh' ? '已归档' : 'Approved')}
                        </span>
                        {group.status === 'APPROVED' && group.manager_reviewed_by && (
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                            👤 {language === 'zh' ? '经理签字' : 'Mgr Final Sign'}: {group.manager_reviewed_by.split(' ')[0]}
                          </div>
                        )}
                        {group.status === 'ENG_APPROVED' && group.engineer_reviewed_by && (
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                            🎓 {language === 'zh' ? '工程师审核' : 'Eng Approved'}: {group.engineer_reviewed_by.split(' ')[0]}
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="toggle-details-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowExpand(group.id);
                          }}
                        >
                          {isExpanded ? (language === 'zh' ? '收起' : 'Hide') : (language === 'zh' ? '查看' : 'View')}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable row block */}
                    {isExpanded && (
                      <ReportDetailPanel
                        group={group}
                        currentUser={currentUser}
                        language={language}
                        t={t}
                        monthlyChecks={monthlyChecks}
                        quarterlyChecks={quarterlyChecks}
                        potentialAssignees={potentialAssignees}
                        navigate={navigate}
                        fetchRecords={fetchRecords}
                        setExpandedRowId={setExpandedRowId}
                        showConfirm={showConfirm}
                        showAlert={showAlert}
                        onTriggerReview={handleWorkflowReview}
                        formatDate={formatDate}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <WorkflowModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        details={modalConfig.details}
        onClose={() => setModalConfig({ isOpen: false, type: 'approve', recordId: null, details: {} })}
        onConfirm={handleModalConfirm}
        language={language}
        loading={modalLoading}
        apiError={modalApiError}
      />
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        showCancel={confirmConfig.showCancel}
        isDanger={confirmConfig.isDanger}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        language={language}
      />
      {/* Bulk Reject Modal */}
      {bulkRejectState.isOpen && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-container">
            <div className="premium-modal-header">
              <h3>
                {language === 'zh' ? '批量退回' : 'Bulk Reject'}
              </h3>
              <button 
                className="premium-modal-close"
                onClick={() => setBulkRejectState(prev => ({...prev, isOpen: false}))}
                disabled={loading}
              >
                ✕
              </button>
            </div>
            <div className="premium-modal-body">
              <p>
                {language === 'zh' 
                  ? `您正在退回 ${selectedRowIds.length} 个项目。请输入统一退回原因：` 
                  : `You are rejecting ${selectedRowIds.length} items. Please enter a unified rejection reason:`}
              </p>
              <textarea
                value={bulkRejectState.reason}
                onChange={(e) => setBulkRejectState(prev => ({...prev, reason: e.target.value}))}
                className="premium-modal-textarea"
                placeholder={language === 'zh' ? '输入退回原因 (必填)...' : 'Enter rejection reason (Required)...'}
                disabled={loading}
              />
            </div>
            <div className="premium-modal-footer">
              <button
                onClick={() => setBulkRejectState(prev => ({...prev, isOpen: false}))}
                className="premium-btn-cancel"
                disabled={loading}
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  if (!bulkRejectState.reason.trim()) {
                    showAlert(language === 'zh' ? '警告' : 'Warning', language === 'zh' ? '退回原因不能为空' : 'Rejection reason cannot be empty');
                    return;
                  }
                  executeBulkReview('disapprove', bulkRejectState.reason, bulkRejectState.ids);
                  setBulkRejectState({ isOpen: false, reason: '', ids: [] });
                }}
                disabled={loading || !bulkRejectState.reason.trim()}
                className={`premium-btn-danger ${loading || !bulkRejectState.reason.trim() ? 'disabled' : ''}`}
              >
                {loading && (
                  <svg className="premium-spinner" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {language === 'zh' ? '确认退回' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
