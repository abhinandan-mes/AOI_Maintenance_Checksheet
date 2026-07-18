import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../services/api';
import './MaintenanceForm.css';
import { useLanguage } from '../contexts/LanguageContext';
import WorkflowModal from './WorkflowModal';
import ConfirmModal from './ConfirmModal';
import ImageUpload from './ImageUpload';

const lineOptions = Array.from({ length: 25 }, (_, i) => String(401 + i));

const MACHINE_CONFIG = [
  {
    key: 'LASER',
    label: 'Laser',
    labelZh: 'Laser 设备',
    color: '#f97316',
    colorLight: '#fff7ed',
    colorBorder: '#ffedd5',
    colorMid: '#ea580c',
    placeholder: 'e.g., Kingmax, Youngpool',
    manual: 'SMT Laser Machine Maintenance Manual',
  },
  {
    key: 'SPI',
    label: 'SPI',
    labelZh: 'SPI 设备',
    color: '#8b5cf6',
    colorLight: '#f5f3ff',
    colorBorder: '#ede9fe',
    colorMid: '#7c3aed',
    placeholder: 'e.g., Parmi, Sinic Tek',
    manual: 'PARMI / Kohyoung / Sinictek SPI Maintenance Manual',
  },
  {
    key: 'PRE_AOI',
    label: 'Pre-AOI',
    labelZh: 'Pre-AOI 设备',
    color: '#3b82f6',
    colorLight: '#eff6ff',
    colorBorder: '#dbeafe',
    colorMid: '#2563eb',
    placeholder: 'e.g., VI, Parmi, Jutze',
    manual: 'Jutze / VI / Parmi / Vitrox / ALD AOI Maintenance Manual',
  },
  {
    key: 'POST_AOI',
    label: 'Post-AOI',
    labelZh: 'Post-AOI 设备',
    color: '#10b981',
    colorLight: '#ecfdf5',
    colorBorder: '#d1fae5',
    colorMid: '#059669',
    placeholder: 'e.g., Parmi, Vitrox',
    manual: 'Jutze / VI / Parmi / Vitrox / ALD AOI Maintenance Manual',
  },
];

const blankMachine = () => ({
  id: null,
  machine_type: '',
  machine_name: '',
  machine_asset_no: '',
  image_paths: [],
  m1_clean_test_area: false,
  m2_clean_inside_wipe_sensor: false,
  m3_check_equipment_box: false,
  m4_clean_filter_cotton: false,
  m5_check_belt_dirty_damaged: false,
  m6_check_rails_smooth: false,
  m7_check_tank_chain: false,
  m8_check_no_jitter: false,
  m9_clean_dust_collector: false,
  m10_exhaust_pipe_damaged: false,
  q1_clean_cabinet_dust: false,
  q2_inspect_belt: false,
  q3_screws_rails_lubricant: false,
  q4_replace_filter_screen: false,
});

export default function MaintenanceForm({ currentUser }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // ── Selection state ───────────────────────────────────────────────────────
  const [selectedLine, setSelectedLine] = useState('');
  const [formStarted, setFormStarted] = useState(isEditMode);
  const [maintenanceType, setMaintenanceType] = useState(''); // '' | 'Weekly' | 'Monthly' | 'Yearly'

  // ── Shared state ──────────────────────────────────────────────────────────
  const [common, setCommon] = useState({
    line: '',
    period: '',
    date: new Date().toISOString().split('T')[0],
    submitted_by: '',
    designated_engineer_id: '',
    designated_manager_id: '',
    confirmation: false,
    remarks: '',
  });

  const [engineers, setEngineers] = useState([]);
  const [managers, setManagers] = useState([]);

  // ── Per-machine state ─────────────────────────────────────────────────────
  const [machines, setMachines] = useState({
    LASER:    blankMachine(),
    SPI:      blankMachine(),
    PRE_AOI:  blankMachine(),
    POST_AOI: blankMachine(),
  });

  // ── Original loaded record (to display signature trails in review) ────────
  const [fullRecord, setFullRecord] = useState(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage]     = useState('');

  // ── Workflow Modal state ──────────────────────────────────────────────────
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'approve', // 'approve' | 'disapprove' | 'success'
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalApiError, setModalApiError] = useState('');

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

  // Sync logged-in user name and fetch engineers
  useEffect(() => {
    if (currentUser) {
      setCommon(prev => ({
        ...prev,
        submitted_by: `${currentUser.full_name} (${currentUser.username})`,
      }));
    }
    
    // Fetch engineers and managers for review selection
    apiService.getActiveAssignees().then(res => {
      if (res.data && res.data.users) {
        const engs = res.data.users.filter(u => u.role === 'engineer');
        const mgrs = res.data.users.filter(u => u.role === 'manager');
        setEngineers(engs);
        setManagers(mgrs);
      }
    }).catch(err => console.error("Failed to fetch assignees", err));
  }, [currentUser]);

  // Handle draft loading and saving for page refreshes
  useEffect(() => {
    if (isEditMode) return;
    const savedDraft = sessionStorage.getItem('maintenanceDraft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.formStarted !== undefined) {
          setFormStarted(parsed.formStarted);
          if (parsed.selectedLine) setSelectedLine(parsed.selectedLine);
          if (parsed.common) setCommon(parsed.common);
          if (parsed.maintenanceType) setMaintenanceType(parsed.maintenanceType);
          if (parsed.machines) {
            // Restore machines but ensure image_paths is array (cannot restore File objects)
            const restoredMachines = {};
            for (const key in parsed.machines) {
              restoredMachines[key] = { ...parsed.machines[key], image_paths: [] };
            }
            setMachines(restoredMachines);
          }
        }
      } catch (err) {
        console.error("Failed to parse draft", err);
      }
    }
  }, [isEditMode]);

  useEffect(() => {
    if (isEditMode) return;
    // Don't serialize file objects
    const machinesToSave = {};
    for (const key in machines) {
      machinesToSave[key] = { ...machines[key], image_paths: [] };
    }
    const draft = { formStarted, selectedLine, common, machines: machinesToSave, maintenanceType };
    sessionStorage.setItem('maintenanceDraft', JSON.stringify(draft));
  }, [isEditMode, formStarted, selectedLine, common, machines, maintenanceType]);

  // Load record and matching 3-in-1 group in edit/review mode
  useEffect(() => {
    if (!isEditMode) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiService.getMaintenanceRecordById(id);
        const r   = res.data.data;
        if (r) {
          setFullRecord(r);
          setCommon({
            line: r.line || '',
            period: r.period,
            date: r.date.split('T')[0],
            submitted_by: r.submitted_by || '',
            designated_engineer_id: r.designated_engineer_id || '',
            designated_manager_id: r.designated_manager_id || '',
            confirmation: false,
            remarks: r.remarks || '',
          });
          if (r.period === 'Weekly') setMaintenanceType('Weekly');
          else if (r.period === 'Yearly') setMaintenanceType('Yearly');
          else setMaintenanceType('Monthly');

          // Fetch all records to compile the matching 3-in-1 group
          const allRes = await apiService.getAllMaintenanceRecords();
          const allRecords = allRes.data.data || [];
          const targetDateStr = r.date.split('T')[0];
          
          const group = allRecords.filter(rec => 
            rec.line === r.line && 
            rec.period === r.period && 
            rec.date.split('T')[0] === targetDateStr &&
            rec.submitted_by === r.submitted_by
          );

          const groupMachines = {
            LASER: blankMachine(),
            SPI: blankMachine(),
            PRE_AOI: blankMachine(),
            POST_AOI: blankMachine()
          };

          group.forEach(rec => {
            if (groupMachines[rec.equipment_type]) {
              groupMachines[rec.equipment_type] = {
                id: rec.id,
                machine_type: rec.machine_type || '',
                machine_name: rec.machine_name || '',
                machine_asset_no: rec.machine_asset_no || '',
                m1_clean_test_area: Boolean(rec.m1_clean_test_area),
                m2_clean_inside_wipe_sensor: Boolean(rec.m2_clean_inside_wipe_sensor),
                m3_check_equipment_box: Boolean(rec.m3_check_equipment_box),
                m4_clean_filter_cotton: Boolean(rec.m4_clean_filter_cotton),
                m5_check_belt_dirty_damaged: Boolean(rec.m5_check_belt_dirty_damaged),
                m6_check_rails_smooth: Boolean(rec.m6_check_rails_smooth),
                m7_check_tank_chain: Boolean(rec.m7_check_tank_chain),
                m8_check_no_jitter: Boolean(rec.m8_check_no_jitter),
                m9_clean_dust_collector: Boolean(rec.m9_clean_dust_collector),
                m10_exhaust_pipe_damaged: Boolean(rec.m10_exhaust_pipe_damaged),
                q1_clean_cabinet_dust: Boolean(rec.q1_clean_cabinet_dust),
                q2_inspect_belt: Boolean(rec.q2_inspect_belt),
                q3_screws_rails_lubricant: Boolean(rec.q3_screws_rails_lubricant),
                q4_replace_filter_screen: Boolean(rec.q4_replace_filter_screen),
                status: rec.status,
                rejection_reason: rec.rejection_reason,
                image_paths: Array.isArray(rec.image_paths) 
                  ? rec.image_paths.map(p => ({ url: `http://localhost:5010${p}`, path: p })) 
                  : [],
                engineer_reviewed_by: rec.engineer_reviewed_by,
                manager_reviewed_by: rec.manager_reviewed_by
              };
            }
          });
          setMachines(groupMachines);
          setFormStarted(true);
        }
      } catch (err) {
        setMessage('Failed to load record group: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]); // eslint-disable-line

  // ── Check definitions ─────────────────────────────────────────────────────
    const getMonthlyChecks = (machineKey) => {
    if (machineKey === 'LASER') {
      return [
        { key: 'm1_clean_test_area',          label: t('m1_label'),  detail: t('m1_detail') },
        { key: 'm2_clean_inside_wipe_sensor', label: t('m2_label'),  detail: t('m2_detail') },
        { key: 'm9_clean_dust_collector',     label: t('m9_label'),  detail: t('m9_detail') },
        { key: 'm10_exhaust_pipe_damaged',    label: t('m10_label'), detail: t('m10_detail') },
        { key: 'm3_check_equipment_box',      label: t('m3_label'),  detail: t('m3_detail') },
        { key: 'm4_clean_filter_cotton',      label: t('m4_label'),  detail: t('m4_detail') },
        { key: 'm5_check_belt_dirty_damaged', label: t('m5_label'),  detail: t('m5_detail') },
        { key: 'm6_check_rails_smooth',       label: t('m6_label'),  detail: t('m6_detail') },
        { key: 'm7_check_tank_chain',         label: t('m7_label'),  detail: t('m7_detail') },
        { key: 'm8_check_no_jitter',          label: t('m8_label'),  detail: t('m8_detail') },
      ];
    }
    return [
      { key: 'm1_clean_test_area',          label: t('m1_label'), detail: t('spi_m1_label') },
      { key: 'm2_clean_inside_wipe_sensor', label: t('m2_label'), detail: t('spi_m2_label') },
      { key: 'm3_check_equipment_box',      label: t('m3_label'), detail: t('spi_m3_label') },
      { key: 'm4_clean_filter_cotton',      label: t('m4_label'), detail: t('spi_m4_label') },
      { key: 'm5_check_belt_dirty_damaged', label: t('m5_label'), detail: t('spi_m5_label') },
      { key: 'm6_check_rails_smooth',       label: t('m6_label'), detail: t('spi_m6_label') },
      { key: 'm7_check_tank_chain',         label: t('m7_label'), detail: t('spi_m7_label') },
      { key: 'm8_check_no_jitter',          label: t('m8_label'), detail: t('spi_m8_label') },
    ];
  };

  const getQuarterlyChecks = (machineKey) => {
    if (machineKey === 'LASER') {
      return [
        { key: 'q1_clean_cabinet_dust',     label: t('q1_label'), detail: t('q1_detail') },
        { key: 'q2_inspect_belt',           label: t('q2_label'), detail: t('q2_detail') },
        { key: 'q3_screws_rails_lubricant', label: t('q3_label'), detail: t('q3_detail') },
        { key: 'q4_replace_filter_screen',  label: t('q4_label'), detail: t('q4_detail') },
      ];
    }
    return [
      { key: 'q1_clean_cabinet_dust',     label: t('q1_label'), detail: t('spi_q1_label') },
      { key: 'q2_inspect_belt',           label: t('q2_label'), detail: t('spi_q2_label') },
      { key: 'q3_screws_rails_lubricant', label: t('q3_label'), detail: t('spi_q3_label') },
    ];
  };

  const isThirdMonth   = common.period === 'Third Month' || common.period === 'Yearly';
  const isMachineFilled = (machineData, eqType) => {
    const isLaser = eqType === 'LASER';
    const checks = [...getMonthlyChecks(eqType), ...(isThirdMonth ? getQuarterlyChecks(eqType) : [])];
    return checks.every(c => machineData[c.key] === true);
  };
  
  const getTotalChecks = (machineKey) => {
    if (machineKey === 'LASER') {
      return isThirdMonth ? 14 : 10;
    }
    return isThirdMonth ? 11 : 8;
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const updateMachine = (type, field, value) =>
    setMachines(prev => ({ ...prev, [type]: { ...prev[type], [field]: value } }));

  const toggleCheck = (type, key) =>
    setMachines(prev => ({ ...prev, [type]: { ...prev[type], [key]: !prev[type][key] } }));

  const countChecked = (data, machineKey) => {
    if (!data) return 0;
    const mChecks = getMonthlyChecks(machineKey);
    const qChecks = getQuarterlyChecks(machineKey);
    const m = mChecks.filter(c => data[c.key]).length;
    const q = isThirdMonth ? qChecks.filter(c => data[c.key]).length : 0;
    return m + q;
  };

  const hasUnchecked = (data, machineKey) => {
    const mChecks = getMonthlyChecks(machineKey);
    const qChecks = getQuarterlyChecks(machineKey);
    const mu = mChecks.some(c => !data[c.key]);
    const qu = isThirdMonth && qChecks.some(c => !data[c.key]);
    return mu || qu;
  };

  const isMachineValid = (type) => {
    const d = machines[type];
    return (
      d.machine_type.trim() &&
      d.machine_name.trim() &&
      d.machine_asset_no.trim()
    );
  };

  const anyUnchecked = MACHINE_CONFIG.some(m => hasUnchecked(machines[m.key], m.key));
  const isAllValid =
    common.line && common.period && common.date && common.designated_engineer_id &&
    MACHINE_CONFIG.every(m => isMachineValid(m.key)) &&
    (!anyUnchecked || common.remarks.trim());

  // ── Submit / Resubmit all 3 records ───────────────────────────────────────
  const handleSubmitAll = (e) => {
    e.preventDefault();
    if (!common.confirmation) { setMessage(t('maint_msg_confirm_lock')); return; }

    let validationErrors = [];
    if (!common.line) validationErrors.push(language === 'zh' ? '线别未填写' : 'Line is missing');
    if (!common.period) validationErrors.push(language === 'zh' ? '周期未填写' : 'Period is missing');
    if (!common.date) validationErrors.push(language === 'zh' ? '日期未填写' : 'Date is missing');
    if (!common.designated_engineer_id) validationErrors.push(language === 'zh' ? '未选择审核工程师' : 'Review Engineer is not selected');
    if (anyUnchecked && !common.remarks.trim()) validationErrors.push(language === 'zh' ? '存在未勾选项，必须填写备注' : 'Remarks are required for unchecked items');
    
    const missingMachines = MACHINE_CONFIG.filter(m => !isMachineValid(m.key));
    if (missingMachines.length > 0) {
      const tabs = missingMachines.map(m => m.label).join(', ');
      validationErrors.push(language === 'zh' ? `以下设备标签页缺少设备型号/名称/资产编号: ${tabs}` : `Missing equipment info (Type/Name/Asset No) in tabs: ${tabs}`);
    }

    const missingImages = MACHINE_CONFIG.filter(m => !machines[m.key].image_paths || machines[m.key].image_paths.length === 0);
    if (missingImages.length > 0) {
      const tabs = missingImages.map(m => m.label).join(', ');
      validationErrors.push(language === 'zh' ? `以下设备必须上传至少一张状态照片: ${tabs}` : `Mandatory equipment photos are missing in tabs: ${tabs}`);
    }

    if (validationErrors.length > 0) {
      setMessage(`⚠️ ${language === 'zh' ? '无法提交' : 'Cannot submit'}: ${validationErrors.join(' | ')}`);
      return;
    }
    
    const msg = isEditMode
      ? (language === 'zh' ? `确认修改并重新提交 Line ${common.line} 的 4 份保养记录？` : `Confirm changes and resubmit all 4 records for Line ${common.line}?`)
      : (language === 'zh' ? `确认提交 Line ${common.line} 全部 4 份保养记录？` : `Submit all 4 maintenance records for Line ${common.line}?`);
      
    const executeSubmit = async () => {
      setSubmitting(true);
      setMessage('');
      try {
        for (const key of MACHINE_CONFIG.map(m => m.key)) {
          const d = machines[key];
          
          // 1. Upload new images if any
          let finalPaths = d.image_paths.filter(img => !img.file).map(img => img.path);
          const newFiles = d.image_paths.filter(img => img.file).map(img => img.file);
          
          if (newFiles.length > 0) {
            const formData = new FormData();
            newFiles.forEach(file => formData.append('images', file));
            const uploadRes = await apiService.uploadImages(formData);
            if (uploadRes.data.success) {
              finalPaths = [...finalPaths, ...uploadRes.data.paths];
            }
          }

          const payload = {
            equipment_type: key,
            line: common.line,
            period: common.period,
            date: common.date,
            submitted_by: common.submitted_by,
            machine_type: d.machine_type,
            machine_name: d.machine_name,
            machine_asset_no: d.machine_asset_no,
            image_paths: finalPaths,
            remarks: common.remarks || '',
            designated_engineer_id: common.designated_engineer_id || null,
            designated_manager_id: common.designated_manager_id || null,
            m1_clean_test_area: d.m1_clean_test_area,
            m2_clean_inside_wipe_sensor: d.m2_clean_inside_wipe_sensor,
            m3_check_equipment_box: d.m3_check_equipment_box,
            m4_clean_filter_cotton: d.m4_clean_filter_cotton,
            m5_check_belt_dirty_damaged: d.m5_check_belt_dirty_damaged,
            m6_check_rails_smooth: d.m6_check_rails_smooth,
            m7_check_tank_chain: d.m7_check_tank_chain,
            m8_check_no_jitter: d.m8_check_no_jitter,
            m9_clean_dust_collector: key === 'LASER' ? d.m9_clean_dust_collector : null,
            m10_exhaust_pipe_damaged: key === 'LASER' ? d.m10_exhaust_pipe_damaged : null,
            q1_clean_cabinet_dust: isThirdMonth ? d.q1_clean_cabinet_dust : null,
            q2_inspect_belt: isThirdMonth ? d.q2_inspect_belt : null,
            q3_screws_rails_lubricant: isThirdMonth ? d.q3_screws_rails_lubricant : null,
            q4_replace_filter_screen: (key === 'LASER' && isThirdMonth) ? d.q4_replace_filter_screen : null,
          };

          if (isEditMode && d.id) {
            await apiService.updateMaintenanceRecord(d.id, payload);
          } else {
            await apiService.submitMaintenanceRecord(payload);
          }
        }
        
        const successMsgText = language === 'zh'
          ? '✓ 保养记录提交保存成功！正在跳转...'
          : '✓ All maintenance records submitted successfully!';
        setMessage(successMsgText);
        showAlert(language === 'zh' ? '成功' : 'Success', successMsgText);
        setTimeout(() => navigate('/pending'), 1800);
      } catch (err) {
        setMessage('Error: ' + err.message);
        showAlert('Error', err.message);
      } finally {
        setSubmitting(false);
      }
    };

    showConfirm(
      language === 'zh' ? '提交确认' : 'Submit Confirm',
      msg,
      executeSubmit
    );
  };

  // ── Roles & Flow States ───────────────────────────────────────────────────
  const isInspector = currentUser?.role === 'inspector';
  const userRole = currentUser?.role;
  const primaryRecordStatus = fullRecord?.status;
  const isDisapproved = primaryRecordStatus === 'DISAPPROVED';
  const isApproved = primaryRecordStatus === 'APPROVED';

  const isPendingReview = isEditMode && fullRecord && (
    (primaryRecordStatus === 'SUBMITTED' && ['engineer', 'manager', 'super_admin', 'admin'].includes(userRole)) ||
    (primaryRecordStatus === 'ENG_APPROVED' && ['manager', 'super_admin', 'admin'].includes(userRole))
  );

  const isReadOnly = isEditMode
    ? (
        isInspector ||
        (userRole === 'technician' && !isDisapproved) ||
        (userRole === 'engineer' && primaryRecordStatus !== 'SUBMITTED') ||
        (userRole === 'manager' && primaryRecordStatus !== 'ENG_APPROVED') ||
        isApproved
      )
    : isInspector;

  const handleWorkflowReview = (action) => {
    if (action === 'approve' && !isAllValid) {
      const errors = [];
      if (!common.line) errors.push(language === 'zh' ? '生产线别 (Line)' : 'Line');
      if (!common.period) errors.push(language === 'zh' ? '保养周期 (Period)' : 'Period');
      if (!common.date) errors.push(language === 'zh' ? '保养日期 (Date)' : 'Date');
      if (!common.designated_engineer_id) errors.push(language === 'zh' ? '未指派审核工程师' : 'Designated Review Engineer');
      if (userRole === 'engineer' && !common.designated_manager_id) errors.push(language === 'zh' ? '未指派终审经理' : 'Designated Final Approval Manager');

      MACHINE_CONFIG.forEach(m => {
        const d = machines[m.key];
        const mErrors = [];
        if (!d.machine_type.trim()) mErrors.push(language === 'zh' ? '设备型号' : 'Machine Type');
        if (!d.machine_name.trim()) mErrors.push(language === 'zh' ? '设备名称' : 'Machine Name');
        if (!d.machine_asset_no.trim()) mErrors.push(language === 'zh' ? '资产编号' : 'Asset No');
        if (mErrors.length > 0) {
          errors.push(`[${m.label}] ${mErrors.join(', ')}`);
        }
      });
      if (anyUnchecked && !common.remarks.trim()) {
        errors.push(language === 'zh' ? '未勾选检查项需要填写整体备注' : 'Unchecked checklist items require overall remarks');
      }

      const errText = language === 'zh'
        ? `无法批准！请检查以下未完成项：\n\n${errors.map(e => `• ${e}`).join('\n')}`
        : `Cannot approve! Please check the following incomplete items:\n\n${errors.map(e => `• ${e}`).join('\n')}`;

      showAlert(
        language === 'zh' ? '审核失败 - 必填项未填写' : 'Approval Blocked - Required Fields Incomplete',
        errText
      );
      return;
    }
    setModalApiError('');
    setModalLoading(false);
    setModalConfig({
      isOpen: true,
      type: action
    });
  };

  const handleModalConfirm = async (type, remarks) => {
    setModalLoading(true);
    setModalApiError('');
    setSubmitting(true);
    try {
      const groupRecords = Object.values(machines).filter(m => m.id);
      
      const recordsToReview = groupRecords.filter(rec => {
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

      for (const rec of recordsToReview) {
        await apiService.reviewWorkflowRecord(rec.id, type, remarks, common.designated_manager_id || null);
      }

      if (!isEditMode) {
        sessionStorage.removeItem('maintenanceDraft');
      }

      setModalConfig(prev => ({ ...prev, type: 'success' }));
      setTimeout(() => {
        setModalConfig({ isOpen: false, type: 'approve' });
        navigate('/pending');
      }, 1500);
    } catch (err) {
      setModalApiError(err.message || 'Workflow action failed.');
    } finally {
      setModalLoading(false);
      setSubmitting(false);
    }
  };

  // ── Reusable Check table ──────────────────────────────────────────────────
  const renderChecks = (data, onToggle, mc) => (
    <>
      <div className="check-table check-table-3col">
        <div className="check-table-head">
          <div className="cthead-cycle">{language === 'zh' ? '保养周期' : 'Cycle'}</div>
          <div className="cthead-content">{language === 'zh' ? '保养检查内容' : 'Maintenance Check Content'}</div>
          <div className="cthead-subcontent">{language === 'zh' ? '月度/季度操作项' : 'Monthly/Quarterly Details'}</div>
          <div className="cthead-status">{language === 'zh' ? '状态' : 'Status'}</div>
        </div>

        {getMonthlyChecks(mc.key).map((c, idx) => (
          <div
            key={c.key}
            className={`check-row ${data[c.key] ? 'check-row--done' : ''}`}
            style={data[c.key] ? { borderLeftColor: mc.color } : {}}
            onClick={() => !isReadOnly && onToggle(c.key)}
          >
            <div className="check-row-cycle">
              {idx === 0 && (
                <span className="cycle-badge" style={{ color: mc.color }}>
                  {language === 'zh' ? '月度' : 'Monthly'}
                </span>
              )}
            </div>
            <div className="check-row-content">
              <span className="check-row-num">{idx + 1}</span>
              <span className="check-row-text">{c.label}</span>
            </div>
            <div className="check-row-subcontent">
              <span className="check-row-text-sub">{c.detail}</span>
            </div>
            <div className="check-row-status">
              <span
                className={`check-mark ${data[c.key] ? 'check-mark--done' : ''}`}
                style={data[c.key] ? { background: mc.color, borderColor: mc.color, color: 'white' } : {}}
              >
                {data[c.key] ? '\u2713' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      {isThirdMonth && (
        <div className="check-table check-table-3col check-table--quarterly">
          {getQuarterlyChecks(mc.key).map((c, idx) => (
            <div
              key={c.key}
              className={`check-row ${data[c.key] ? 'check-row--done' : ''}`}
              style={data[c.key] ? { borderLeftColor: '#6d28d9' } : {}}
              onClick={() => !isReadOnly && onToggle(c.key)}
            >
              <div className="check-row-cycle">
                {idx === 0 && (
                  <span className="cycle-badge cycle-badge--quarterly" style={{ color: '#6d28d9' }}>
                    {language === 'zh' ? '季度' : 'Quarterly'}
                  </span>
                )}
              </div>
              <div className="check-row-content">
                <span className="check-row-num">{getMonthlyChecks(mc.key).length + idx + 1}</span>
                <span className="check-row-text">{c.label}</span>
              </div>
              <div className="check-row-subcontent">
                <span className="check-row-text-sub">{c.detail}</span>
              </div>
              <div className="check-row-status">
                <span
                  className={`check-mark ${data[c.key] ? 'check-mark--done' : ''}`}
                  style={data[c.key] ? { background: '#6d28d9', borderColor: '#6d28d9', color: 'white' } : {}}
                >
                  {data[c.key] ? '\u2713' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 1 — Line Selection (Only in create mode when form not started)
  // ══════════════════════════════════════════════════════════════════════════
  if (!formStarted && !isEditMode) {
    return (
      <div className="activity-container animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '30px 40px' }}>
        {/* ── Header ── */}
        <div className="activity-header" style={{ marginBottom: '24px' }}>
          <div className="header-title">
            <span className="subtitle-admin">
              <span className="sub-tag-bullet">✦</span> {language === 'zh' ? '设备检查' : 'EQUIPMENT CHECK'}
            </span>
            <h1>
              <span className="title-icon">📋</span> <span className="premium-heading-gradient">{language === 'zh' ? '设备保养检查表' : 'Maintenance Checksheet'}</span>
            </h1>
            <p>{language === 'zh' ? '选择产线后，同时填写四类设备的保养记录' : 'Select a production line to complete checksheets for Laser, SPI, Pre-AOI, & Post-AOI machines.'}</p>
          </div>
        </div>

        {/* ── Selection Card ── */}
        <div className="dashboard-card animate-slide-up" style={{ padding: '30px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: '#eff6ff', padding: '8px', borderRadius: '8px', display: 'flex' }}>📍</span> 
                {language === 'zh' ? '选择生产线' : 'Select Production Line'}
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '6px', marginBottom: 0 }}>
                {language === 'zh' ? '点击下方产线编号开始保养记录' : 'Tap a line number below to begin'}
              </p>
            </div>
            <div className="sel-types-chips" style={{ display: 'flex', gap: '8px' }}>
              {MACHINE_CONFIG.map(m => (
                <span key={m.key} className="sel-type-chip" style={{ background: m.colorLight, borderColor: m.colorBorder, color: m.color, padding: '6px 12px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid' }}>
                  <span className="sel-type-dot" style={{ background: m.color, width: '6px', height: '6px', borderRadius: '50%' }} />
                  {language === 'zh' ? m.labelZh.split(' ')[0] : m.label}
                </span>
              ))}
            </div>
          </div>

          <div className="card-body">
            <div className="line-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: '12px' }}>
              {lineOptions.map(l => (
                <button
                  key={l}
                  type="button"
                  className={`line-tile ${selectedLine === l ? 'active' : ''}`}
                  onClick={() => setSelectedLine(l)}
                  style={{
                    padding: '14px 6px',
                    borderRadius: '10px',
                    border: selectedLine === l ? 'none' : '1.5px solid #e2e8f0',
                    background: selectedLine === l ? '#415fff' : 'white',
                    color: selectedLine === l ? 'white' : '#475569',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    textAlign: 'center',
                    fontFamily: "ui-monospace, 'Courier New', monospace",
                    boxShadow: selectedLine === l ? '0 8px 24px rgba(65, 95, 255, 0.35)' : '0 2px 6px rgba(0,0,0,0.02)',
                    transform: selectedLine === l ? 'translateY(-2px)' : 'none'
                  }}
                  onMouseOver={e => {
                    if (selectedLine !== l) {
                      e.currentTarget.style.borderColor = 'rgba(65, 95, 255, 0.3)';
                      e.currentTarget.style.color = '#415fff';
                      e.currentTarget.style.background = 'rgba(65, 95, 255, 0.05)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseOut={e => {
                    if (selectedLine !== l) {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.color = '#475569';
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            {selectedLine && (
              <div style={{ marginTop: '28px', paddingTop: '28px', borderTop: '1px dashed #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <h3 style={{ fontSize: '1rem', color: '#334155', margin: 0, fontWeight: 700 }}>
                  {language === 'zh' ? '选择保养类型' : 'Select Maintenance Type'}
                </h3>
                <div className="period-switcher">
                  {['Weekly', 'Monthly', 'Yearly'].map((t, i) => (
                    <button
                      key={t}
                      type="button"
                      className={`period-tab ${maintenanceType === t ? 'active' : ''}`}
                      onClick={() => {
                        setMaintenanceType(t);
                        if (t === 'Weekly') setCommon(prev => ({ ...prev, period: 'Weekly' }));
                        else if (t === 'Monthly') setCommon(prev => ({ ...prev, period: 'First Month' }));
                        else if (t === 'Yearly') setCommon(prev => ({ ...prev, period: 'Yearly' }));
                      }}
                    >
                      {language === 'zh'
                        ? ['每周保养', '每月保养', '每年保养'][i]
                        : ['Weekly', 'Monthly', 'Yearly'][i]}
                    </button>
                  ))}
                </div>
                
                {maintenanceType === 'Monthly' && (
                  <div className="period-switcher" style={{ transform: 'scale(0.85)', marginTop: '-8px' }}>
                    {['First Month', 'Second Month', 'Third Month'].map((p, i) => (
                      <button
                        key={p}
                        type="button"
                        className={`period-tab ${common.period === p ? 'active' : ''}`}
                        onClick={() => setCommon(prev => ({ ...prev, period: p }))}
                      >
                        {language === 'zh'
                          ? ['M1 第一月', 'M2 第二月', 'M3 季度'][i]
                          : ['Month 1', 'Month 2', 'Month 3 · Quarterly'][i]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="sel-cta-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginTop: '30px', paddingTop: '24px', borderTop: '1px dashed #e2e8f0', flexWrap: 'wrap' }}>
              {selectedLine ? (
                <div className="sel-chosen-badge" style={{ background: 'rgba(65, 95, 255, 0.08)', color: '#415fff', border: '1px solid rgba(65, 95, 255, 0.2)', padding: '8px 20px', borderRadius: '100px', fontSize: '13px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ background: '#415fff', color: 'white', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', boxShadow: '0 2px 6px rgba(65,95,255,0.4)' }}>✓</span>
                  Line {selectedLine} {language === 'zh' ? '已选择' : 'selected'}
                </div>
              ) : (
                <div className="sel-cta-hint" style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                  {language === 'zh' ? '尚未选择产线' : 'No line selected yet'}
                </div>
              )}
              <button
                type="button"
                className={`sel-start-btn ${(!selectedLine || !common.period) ? 'sel-start-btn--disabled' : ''}`}
                disabled={!selectedLine || !common.period}
                onClick={() => {
                  setCommon(prev => ({ ...prev, line: selectedLine }));
                  setFormStarted(true);
                }}
                style={(selectedLine && common.period) ? {
                  padding: '14px 32px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #415fff 0%, #2438c0 100%)',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 8px 24px rgba(65, 95, 255, 0.3)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  letterSpacing: '0.2px'
                } : {
                  padding: '14px 32px',
                  borderRadius: '12px',
                  background: 'transparent',
                  border: '2px dashed #cbd5e1',
                  color: '#94a3b8',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'not-allowed'
                }}
                onMouseOver={e => {
                  if (selectedLine) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(65, 95, 255, 0.45)';
                  }
                }}
                onMouseOut={e => {
                  if (selectedLine) {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(65, 95, 255, 0.3)';
                  }
                }}
              >
                {selectedLine
                  ? (language === 'zh' ? `开始填写 Line ${selectedLine} 保养记录 →` : `Start Line ${selectedLine} Maintenance Checksheet →`)
                  : (language === 'zh' ? '请先选择产线' : 'Please select a production line to continue')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 2 — 3-in-1 form (Used for creation, and group edit/review mode)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="form-page">
      {loading && <div className="form-loading">Loading records group…</div>}

      {/* Sticky Topbar */}
      <div className="form-topbar form-topbar--multi">
        <div className="topbar-left">
          {isEditMode ? (
            <button type="button" className="topbar-back-btn"
              onClick={() => navigate('/pending')}>
              ← {language === 'zh' ? '返回待办列表' : 'Pending Tasks'}
            </button>
          ) : (
            <button type="button" className="topbar-back-btn"
              onClick={() => { setFormStarted(false); setSelectedLine(''); setCommon(prev => ({ ...prev, line: '' })); }}>
              ← {language === 'zh' ? '换产线' : 'Change Line'}
            </button>
          )}
          <div className="topbar-line-pill">📍 Line {common.line}</div>
          {isEditMode && (
            <span className="topbar-edit-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', marginLeft: '12px' }}>
              {isPendingReview ? (
                <>🔍 <span style={{ color: '#d97706', fontWeight: 700 }}>{language === 'zh' ? '待审核签字' : 'Review & Sign-Off'}</span></>
              ) : primaryRecordStatus === 'APPROVED' ? (
                <>✓ <span style={{ color: '#16a34a', fontWeight: 700 }}>{language === 'zh' ? '已批准归档' : 'Approved & Locked'}</span></>
              ) : isReadOnly ? (
                <>👁️ <span style={{ color: '#64748b', fontWeight: 700 }}>{language === 'zh' ? '只读查看' : 'Read-Only View'}</span></>
              ) : (
                <>✏️ <span style={{ color: '#f59e0b', fontWeight: 700 }}>{language === 'zh' ? '修改并重新提交' : 'Edit & Resubmit'}</span></>
              )}
            </span>
          )}
        </div>

        <div className="topbar-center">
          <div className="topbar-period-display" style={{ fontWeight: 700, color: '#1e3a8a', background: '#eff6ff', padding: '6px 16px', borderRadius: '8px', fontSize: '0.88rem' }}>
            ⏳ {common.period === 'Weekly' && (language === 'zh' ? '每周' : 'Weekly')}
            {common.period === 'First Month' && t('maint_period_m1')}
            {common.period === 'Second Month' && t('maint_period_m2')}
            {common.period === 'Third Month' && t('maint_period_m3')}
            {common.period === 'Yearly' && (language === 'zh' ? '每年' : 'Yearly')}
          </div>
        </div>

        <div className="topbar-right">
          <input
            type="date" value={common.date}
            disabled={isEditMode}
            onChange={e => setCommon(prev => ({ ...prev, date: e.target.value }))}
            className="topbar-date"
          />
          <div className="progress-row">
            {MACHINE_CONFIG.map(m => {
              const done = countChecked(machines[m.key], m.key);
              const full = done === getTotalChecks(m.key);
              return (
                <span
                  key={m.key}
                  className="progress-pill"
                  style={full
                    ? { background: m.color, color: 'white', border: `1px solid ${m.color}` }
                    : { background: m.colorLight, color: m.color, border: `1px solid ${m.colorBorder}` }
                  }
                >
                  {full ? '✓' : `${done}/${getTotalChecks(m.key)}`} {m.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="form-body">
        {isReadOnly && !isPendingReview && (
          <div className="inspector-banner" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', marginBottom: '15px' }}>
            👁️ {language === 'zh' ? '只读查看模式 — 保养记录已锁定，不可编辑。' : 'Read-Only Mode — Maintenance record group is locked.'}
          </div>
        )}
        {isReadOnly && isPendingReview && (
          <div className="inspector-banner" style={{ background: '#fffbeb', border: '1px solid #fef3c7', color: '#b45309', marginBottom: '15px' }}>
            🔍 {language === 'zh' ? `审核模式 — 请检查下方 ${MACHINE_CONFIG.length} 台设备的检查结果并在底部签字。` : `Review Mode — Please inspect checklist results for all ${MACHINE_CONFIG.length} machines and sign off below.`}
          </div>
        )}

        <form onSubmit={handleSubmitAll}>
          <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>

            {MACHINE_CONFIG.map((mc) => {
              const data    = machines[mc.key];
              const done    = countChecked(data, mc.key);
              const full    = done === getTotalChecks(mc.key);
              const valid   = isMachineValid(mc.key);
              const uncked  = hasUnchecked(data, mc.key);

              return (
                <div
                  key={mc.key}
                  className={`mcard ${valid ? 'mcard--valid' : ''}`}
                  style={{ borderTopColor: mc.color }}
                >
                  {/* Card header */}
                  <div className="mcard-header" style={{ borderBottomColor: '#f1f5f9' }}>
                    <div className="mcard-header-row">
                       <span className="mcard-title" style={{ color: mc.color }}>
                        {language === 'zh' ? mc.labelZh : mc.label}
                      </span>
                      <span
                        className="mcard-badge"
                        style={full
                          ? { background: '#10b981', color: 'white' }
                          : { background: '#f1f5f9', color: '#64748b' }
                        }
                      >
                        {full ? `✓ ${language === 'zh' ? '完成' : 'Complete'}` : `${done} / ${getTotalChecks(mc.key)}`}
                      </span>
                    </div>
                    <div className="minfo-row">
                      <div className="minfo-field">
                        <label>{t('maint_machine_type')}</label>
                        <input
                          type="text"
                          value={data.machine_type}
                          disabled={isReadOnly}
                          onChange={e => updateMachine(mc.key, 'machine_type', e.target.value)}
                          placeholder={mc.placeholder}
                          required
                        />
                      </div>
                      <div className="minfo-field">
                        <label>{t('maint_machine_name')}</label>
                        <input
                          type="text"
                          value={data.machine_name}
                          disabled={isReadOnly}
                          onChange={e => updateMachine(mc.key, 'machine_name', e.target.value)}
                          placeholder="e.g., 920411"
                          required
                        />
                      </div>
                      <div className="minfo-field">
                        <label>{t('maint_machine_asset')}</label>
                        <input
                          type="text"
                          value={data.machine_asset_no}
                          disabled={isReadOnly}
                          onChange={e => updateMachine(mc.key, 'machine_asset_no', e.target.value)}
                          placeholder="e.g., INFA-01111"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Checks body */}
                  <div className="mcard-body">
                    <div className="checks-wrap">
                      {renderChecks(data, (key) => toggleCheck(mc.key, key), mc)}
                    </div>

                    {/* Premium Image Upload Zone */}
                    <div className="image-upload-section">
                      <ImageUpload 
                        images={data.image_paths || []} 
                        setImages={(setter) => {
                          setMachines(prev => {
                            const currentImages = prev[mc.key].image_paths || [];
                            const newImages = typeof setter === 'function' ? setter(currentImages) : setter;
                            return { ...prev, [mc.key]: { ...prev[mc.key], image_paths: newImages } };
                          });
                        }} 
                        readOnly={isReadOnly} 
                      />
                    </div>

                    

                    {/* Disapproved state rejection reasons */}
                    {isDisapproved && data.rejection_reason && (
                      <div className="rejection-box" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginTop: '12px', fontSize: '0.85rem' }}>
                        <strong>⚠️ {language === 'zh' ? '退回修改原因' : 'Rejection Reason'}:</strong> {data.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            
            {/* Common Remarks Section */}
            <div className="remarks-wrap" style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <label className="remarks-label" style={{ fontSize: '1rem', fontWeight: 'bold', color: anyUnchecked ? '#dc2626' : '#1e3a8a', marginBottom: '10px', display: 'block' }}>
                {anyUnchecked 
                  ? (language === 'zh' ? '⚠️ 备注说明（必填 — 存在未勾选的异常项目）' : '⚠️ Remarks (Required — unchecked items exist)')
                  : (language === 'zh' ? '📝 备注说明（选填）' : '📝 Remarks (Optional)')}
              </label>
              <textarea
                value={common.remarks}
                disabled={isReadOnly}
                onChange={e => setCommon(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder={language === 'zh' ? '请输入整体检查备注或未完成项的原因说明...' : 'Enter overall remarks or explain unchecked items...'}
                rows="3"
                required={anyUnchecked}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical', fontSize: '0.95rem' }}
              />
            </div>

            {/* Common Notes & Instructions */}
            <div className="check-notes check-notes--common ultra-notes">
              <div className="check-notes-title">
                {language === 'zh' ? '📋 注意事项（适用于所有设备）' : '📋 Notes & Instructions — Applies to All Equipment'}
              </div>
              <ol className="check-notes-list">
                <li>
                  {language === 'zh'
                    ? '勾选已完成的项目。若有未完成项目，请保持未勾选并在备注栏说明原因。'
                    : 'Tick the checkbox for completed items. If an item is not done, leave it unchecked and fill in the reason in the Remarks column.'}
                </li>
                <li>
                  {language === 'zh'
                    ? '表格中数据按要求记录。设备异常时，记录异常情况和维护措施。'
                    : 'Record checksheet data as requested. If equipment is abnormal, document the issue and mitigation measures.'}
                </li>
                <li>
                  {language === 'zh'
                    ? '月度保养周期为 25天 ± 5天，第三个月保养需同时完成季度保养内容。'
                    : 'Monthly cycle is 25 days ± 5 days. Third month cycle must cover quarterly checklist items.'}
                </li>
                <li>
                  {language === 'zh'
                    ? '详细保养操作参考对应设备保养手册。'
                    : 'Refer to machine maintenance manuals for detailed checklist operations.'}
                </li>
              </ol>
            </div>

            {/* Actions Footer */}
            {isPendingReview ? (
              <div className="submit-footer submit-footer--review" style={{ borderLeft: '4px solid #f59e0b', background: '#fffbeb', padding: '20px 24px', borderRadius: '12px', border: '1px solid #fef3c7', marginTop: '20px' }}>
                <div className="submit-footer-left" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span className="sig-tag">👤 {language === 'zh' ? '保养提交人签字: ' : 'Submitted By: '}{common.submitted_by}</span>
                  {fullRecord?.engineer_reviewed_by && (
                    <span className="sig-tag">🎓 {language === 'zh' ? '工程师审核签字: ' : 'Eng. Approved: '}{fullRecord.engineer_reviewed_by}</span>
                  )}
                  {userRole === 'engineer' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                        {language === 'zh' ? '指派终审经理:' : 'Designate Final Approval Manager:'}
                      </span>
                      <select
                        value={common.designated_manager_id || ''}
                        onChange={e => setCommon(prev => ({ ...prev, designated_manager_id: e.target.value }))}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                      >
                        <option value="">-- {language === 'zh' ? '选择经理' : 'Select Manager'} --</option>
                        {managers.map(mgr => (
                          <option key={mgr.username} value={mgr.username}>{mgr.full_name} ({mgr.role})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="submit-footer-right" style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn-submit-main"
                    style={{ backgroundColor: '#dc2626', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' }}
                    onClick={() => handleWorkflowReview('disapprove')}
                    disabled={submitting}
                  >
                    ❌ {language === 'zh' ? '不合格退回' : 'Reject / Disapprove'}
                  </button>
                  <button
                    type="button"
                    className="btn-submit-main"
                    style={{ backgroundColor: '#16a34a', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)' }}
                    onClick={() => handleWorkflowReview('approve')}
                    disabled={submitting}
                  >
                    ✓ {language === 'zh' ? '审核签字批准' : 'Approve & Sign-off'}
                  </button>
                </div>
              </div>
            ) : isReadOnly ? (
              <div className="submit-footer submit-footer--readonly" style={{ padding: '20px 24px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginTop: '20px' }}>
                <div className="submit-footer-left" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span className="sig-tag">👤 {language === 'zh' ? '保养提交人: ' : 'Submitted By: '}{common.submitted_by}</span>
                  {fullRecord?.engineer_reviewed_by && (
                    <span className="sig-tag">🎓 {language === 'zh' ? '工程师审核: ' : 'Eng. Reviewer: '}{fullRecord.engineer_reviewed_by}</span>
                  )}
                  {fullRecord?.manager_reviewed_by && (
                    <span className="sig-tag">👑 {language === 'zh' ? '经理终审: ' : 'Mgr. Reviewer: '}{fullRecord.manager_reviewed_by}</span>
                  )}
                </div>
                <div className="submit-footer-right">
                  <button
                    type="button"
                    className="btn-submit-main"
                    style={{ background: '#64748b', boxShadow: 'none' }}
                    onClick={() => navigate('/pending')}
                  >
                    ← {language === 'zh' ? '返回待办列表' : 'Back to Pending Tasks'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="premium-submit-container ready">
                <div className="premium-submit-main">
                  <div className="premium-submit-left">
                    <label className="premium-confirm-box">
                      <input
                        type="checkbox"
                        checked={common.confirmation}
                        onChange={e => setCommon(prev => ({ ...prev, confirmation: e.target.checked }))}
                        className="premium-checkbox"
                      />
                      <span className="premium-confirm-text">{t('maint_confirm_correct')}</span>
                    </label>

                    <div className="premium-assignee-grid">
                      <div className="premium-assignee-field">
                        <label className="premium-assignee-label">
                          🎓 {language === 'zh' ? '审核工程师' : 'Review Engineer'}
                        </label>
                        <select
                          className="premium-select"
                          value={common.designated_engineer_id || ''}
                          onChange={e => setCommon(prev => ({ ...prev, designated_engineer_id: e.target.value }))}
                        >
                          <option value="">-- {language === 'zh' ? '选择工程师' : 'Select Engineer'} --</option>
                          {engineers.map(eng => (
                            <option key={eng.username} value={eng.username}>{eng.full_name} ({eng.role})</option>
                          ))}
                        </select>
                      </div>

                      <div className="premium-assignee-field">
                        <label className="premium-assignee-label">
                          👑 {language === 'zh' ? '终审经理' : 'Final Manager'}
                        </label>
                        <select
                          className="premium-select"
                          value={common.designated_manager_id || ''}
                          onChange={e => setCommon(prev => ({ ...prev, designated_manager_id: e.target.value }))}
                        >
                          <option value="">-- {language === 'zh' ? '选择经理' : 'Select Manager'} --</option>
                          {managers.map(mgr => (
                            <option key={mgr.username} value={mgr.username}>{mgr.full_name} ({mgr.role})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="premium-submit-right">
                    <div className="premium-submitter-badge">
                      <span className="badge-icon">👤</span>
                      <span className="badge-name">{common.submitted_by}</span>
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="premium-btn-submit"
                    >
                      {submitting
                        ? (language === 'zh' ? '提交中...' : 'Submitting…')
                        : isEditMode
                          ? (language === 'zh' ? '重新提交记录' : 'Resubmit Record')
                          : (language === 'zh'
                              ? `🚀 提交 Line ${common.line} 全部 4 份保养记录`
                              : `🚀 Submit All 4 Records — Line ${common.line}`)}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {message && (
              <div className={`msg ${message.startsWith('✓') ? 'msg-ok' : 'msg-err'}`} style={{ marginTop: '12px' }}>
                {message}
              </div>
            )}

          </fieldset>
        </form>
      </div>
      <WorkflowModal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        details={{ line: common.line, period: common.period, date: common.date }}
        onClose={() => setModalConfig({ isOpen: false, type: 'approve' })}
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
    </div>
  );
}
