import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import './Home.css';
import { useLanguage } from '../contexts/LanguageContext';
import ConfirmModal from './ConfirmModal';

export default function PendingRecords({ currentUser }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [pendingRecords, setPendingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isSuperAdmin = currentUser?.role === 'super_admin';

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

  const handleDeleteGroup = (group) => {
    const confirmMsg = language === 'zh'
      ? `警告：确定要永久删除该保养记录组吗？这会永久移除 Line ${group.line} 在 ${group.date} 的 ${group.records.length} 份设备保养记录。`
      : `WARNING: Are you sure you want to permanently delete this checksheet group? This will delete all ${group.records.length} machines for Line ${group.line} on ${group.date}.`;

    const executeDelete = async () => {
      setLoading(true);
      setError('');
      try {
        for (const rec of group.records) {
          await apiService.deleteMaintenanceRecord(rec.id);
        }
        showAlert(
          language === 'zh' ? '成功' : 'Success',
          language === 'zh' ? '该保养单记录组已被成功删除！' : 'Checksheet group deleted successfully!'
        );
        fetchPendingRecords();
      } catch (err) {
        setError(err.message || 'Failed to delete checksheet group.');
        showAlert('Error', err.message);
      } finally {
        setLoading(false);
      }
    };

    showConfirm(
      language === 'zh' ? '删除确认' : 'Delete Confirm',
      confirmMsg,
      executeDelete,
      true // isDanger
    );
  };

  const fetchPendingRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiService.getAllMaintenanceRecords();
      const allRecords = response.data.data || [];
      
      let filtered = [];
      const username = currentUser?.username;
      
      if (currentUser?.role === 'technician') {
        filtered = allRecords.filter(r => 
          r.status === 'DISAPPROVED' && 
          r.submitted_by && 
          r.submitted_by.includes(`(${username})`)
        );
      } else if (currentUser?.role === 'engineer') {
        filtered = allRecords.filter(r => r.status === 'SUBMITTED');
      } else if (currentUser?.role === 'manager') {
        filtered = allRecords.filter(r => r.status === 'ENG_APPROVED');
      } else if (currentUser?.role === 'super_admin' || currentUser?.role === 'admin') {
        filtered = allRecords.filter(r => 
          r.status === 'SUBMITTED' || 
          r.status === 'ENG_APPROVED' || 
          (r.status === 'DISAPPROVED' && r.submitted_by && r.submitted_by.includes(`(${username})`))
        );
      }
      
      setPendingRecords(filtered);
    } catch (err) {
      setError(err.message || 'Failed to fetch pending records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRecords();
  }, []); // eslint-disable-line

  // Consolidate individual machine records into unified 3-in-1 checksheet groups
  const groupedRecords = useMemo(() => {
    const groups = {};
    pendingRecords.forEach(r => {
      const dateStr = r.date.split('T')[0];
      const key = `${dateStr}-${r.line}-${r.period}-${r.submitted_by}`;
      if (!groups[key]) {
        groups[key] = {
          date: dateStr,
          line: r.line,
          period: r.period,
          status: r.status,
          submitted_by: r.submitted_by,
          designated_engineer_id: r.designated_engineer_id,
          designated_manager_id: r.designated_manager_id,
          engineer_reviewed_by: r.engineer_reviewed_by,
          manager_reviewed_by: r.manager_reviewed_by,
          time: new Date(r.created_at || r.date).toLocaleTimeString(language === 'zh' ? 'zh-CN' : undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          id: r.id, // Primary record id to navigate to form
          records: [r]
        };
      } else {
        groups[key].records.push(r);
      }
    });
    return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [pendingRecords, language]);

  const getPeriodLabel = (period) => {
    if (period === 'First Month') return t('maint_period_m1');
    if (period === 'Second Month') return t('maint_period_m2');
    if (period === 'Third Month') return t('maint_period_m3');
    return period;
  };

  return (
    <div className="home-container animate-fade-in">
      {/* Header section */}
      <div className="home-header" style={{ marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <h1 className="premium-heading-gradient" style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
          {language === 'zh' ? '待处理保养任务' : 'Pending Maintenance Tasks'}
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '6px', marginBottom: 0 }}>
          {language === 'zh'
            ? '此处显示当前登录账户需要处理、审核或修改的设备保养表单。'
            : 'Checksheets currently waiting for your review, approval signature, or technician resubmission.'}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748b', fontSize: '1.1rem' }}>
          <span className="loading-spinner" style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid #cbd5e1', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '10px', verticalAlign: 'middle' }}></span>
          {t('loading')}
        </div>
      ) : error ? (
        <div className="msg msg-err" style={{ margin: '20px 0', padding: '16px 20px', borderRadius: '12px' }}>
          ⚠️ {error}
        </div>
      ) : groupedRecords.length === 0 ? (
        <div 
          className="home-alert alert-success animate-slide-down" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            width: '100%',
            padding: '24px 30px', 
            borderRadius: '16px', 
            background: '#ecfdf5', 
            borderLeft: '5px solid #10b981',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)' 
          }}
        >
          <span style={{ fontSize: '1.8rem', marginRight: '16px' }}>✅</span>
          <div>
            <strong style={{ color: '#065f46', fontSize: '1.05rem', display: 'block' }}>
              {language === 'zh' ? '太棒了！您当前没有待处理的保养事项' : 'Excellent! You are all caught up'}
            </strong>
            <span style={{ color: '#047857', fontSize: '0.92rem', marginTop: '4px', display: 'inline-block' }}>
              {language === 'zh' 
                ? '所有提交给您的保养表均已签字批准。您可以前往“保养报表”中查阅历史归档。' 
                : 'All maintenance checksheets assigned to you are reviewed. Visit the Reports section to view archives.'}
            </span>
          </div>
        </div>
      ) : (
        <div className="dashboard-card pending-card animate-slide-up" style={{ width: '100%', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', borderRadius: '16px', overflow: 'hidden' }}>
          <div className="card-header pending-header" style={{ borderLeft: '4px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#1e3a8a', fontWeight: 700, margin: 0 }}>
              📁 {language === 'zh' ? `待处理保养记录 (${groupedRecords.length})` : `Pending Maintenance Records (${groupedRecords.length})`}
            </h2>
            <button className="refresh-btn" onClick={fetchPendingRecords} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
              {language === 'zh' ? '刷新' : 'Refresh'}
            </button>
          </div>
          <div className="table-responsive" style={{ marginTop: '15px' }}>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>{language === 'zh' ? '保养日期' : 'Date'}</th>
                  <th>{language === 'zh' ? '生产线别' : 'Line'}</th>
                  <th>{language === 'zh' ? '审核状态' : 'Status'}</th>
                  <th>{language === 'zh' ? '登记/审核人员' : 'Submitted/Review By'}</th>
                  <th>{language === 'zh' ? '登记时间' : 'Time'}</th>
                  <th>{language === 'zh' ? '操作' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {groupedRecords.map(group => (
                  <tr key={group.id} style={{ transition: 'background-color 0.15s ease' }}>
                    <td data-label={language === 'zh' ? '保养日期' : 'Date'} style={{ fontWeight: 600, color: '#334155' }}>
                      {new Date(group.date).toLocaleDateString(language === 'zh' ? 'zh-CN' : undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td data-label={language === 'zh' ? '生产线别' : 'Line'}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ background: '#f1f5f9', color: '#1e3a8a', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem', width: 'fit-content' }}>
                          Line {group.line}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {getPeriodLabel(group.period)}
                        </span>
                      </div>
                    </td>
                    <td data-label={language === 'zh' ? '审核状态' : 'Status'}>
                      <span className={`status-badge status-${group.status.toLowerCase()}`}>
                        {group.status === 'DISAPPROVED' && (language === 'zh' ? '已退回' : 'Rejected')}
                        {group.status === 'SUBMITTED' && (language === 'zh' ? '待审核' : 'Pending Review')}
                        {group.status === 'ENG_APPROVED' && (language === 'zh' ? '待审批' : 'Pending Approval')}
                      </span>
                    </td>
                    <td data-label={language === 'zh' ? '登记/审核人员' : 'Submitted/Review By'}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                        <span>👤 <strong style={{ color: '#475569' }}>{language === 'zh' ? '提交人' : 'Submitter'}:</strong> {group.submitted_by}</span>
                        {group.status === 'ENG_APPROVED' && group.engineer_reviewed_by && (
                          <span>🎓 <strong style={{ color: '#475569' }}>{language === 'zh' ? '审核人' : 'Reviewer'}:</strong> {group.engineer_reviewed_by}</span>
                        )}
                        {group.status === 'ENG_APPROVED' && (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.78rem' }}>
                            {language === 'zh' ? '⏳ 待审批' : '⏳ Waiting Mgr. review'}
                            {group.designated_manager_id && (
                              <span style={{ color: '#3b82f6', fontWeight: 600, marginLeft: '4px' }}>
                                (指定: {group.designated_manager_id})
                              </span>
                            )}
                          </span>
                        )}
                        {group.status === 'SUBMITTED' && (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.78rem' }}>
                            {language === 'zh' ? '⏳ 待审核签字' : '⏳ Waiting Eng. review'}
                            {group.designated_engineer_id && (
                              <span style={{ color: '#3b82f6', fontWeight: 600, marginLeft: '4px' }}>
                                (指定: {group.designated_engineer_id})
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </td>
                    <td data-label={language === 'zh' ? '登记时间' : 'Time'} style={{ fontFamily: 'monospace', fontWeight: 500, color: '#475569' }}>
                      {group.time}
                    </td>
                    <td data-label={language === 'zh' ? '操作' : 'Action'} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {group.status === 'DISAPPROVED' ? (
                        <button
                          className="btn-review-sign btn-action-modify"
                          onClick={() => navigate(`/edit-maintenance/${group.id}`)}
                        >
                          ✏️ {language === 'zh' ? '去修改' : 'Modify'}
                        </button>
                      ) : group.status === 'SUBMITTED' && group.submitted_by && group.submitted_by.includes(`(${currentUser?.username})`) ? (
                        <button
                          className="btn-review-sign btn-action-edit-submit"
                          onClick={() => navigate(`/edit-maintenance/${group.id}`)}
                        >
                          ✏️ {language === 'zh' ? '填写提交' : 'Edit & Submit'}
                        </button>
                      ) : (
                        <button
                          className="btn-review-sign btn-action-review"
                          onClick={() => navigate(`/edit-maintenance/${group.id}`)}
                        >
                          🔍 {language === 'zh' ? '签字审核' : 'Review'}
                        </button>
                      )}
                      {isSuperAdmin && (
                        <button
                          type="button"
                          className="btn-review-sign"
                          style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fca5a5',
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                            margin: 0
                          }}
                          onClick={() => handleDeleteGroup(group)}
                        >
                          🗑️ {language === 'zh' ? '删除' : 'Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
