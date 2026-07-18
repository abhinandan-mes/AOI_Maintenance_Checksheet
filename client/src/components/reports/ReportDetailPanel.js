import React, { useState } from 'react';
import ReportChecklistTable from './ReportChecklistTable';
import ReportTimeline from './ReportTimeline';
import ImageUpload from '../ImageUpload';
import apiService from '../../services/api';

export default function ReportDetailPanel({
  group = {},
  currentUser = {},
  language = 'en',
  t,
  monthlyChecks = [],
  quarterlyChecks = [],
  potentialAssignees = [],
  navigate,
  fetchRecords,
  setExpandedRowId,
  showConfirm,
  showAlert,
  onTriggerReview,
  formatDate
}) {
  const primaryRecord = group.records[0] || {};
  const laserRec = group.records.find(r => r.equipment_type === 'LASER' || r.equipment_type === 'Laser') || null;
  const spiRec = group.records.find(r => r.equipment_type === 'SPI') || null;
  const preAoiRec = group.records.find(r => r.equipment_type === 'PRE_AOI' || r.equipment_type === 'Pre-AOI') || null;
  const postAoiRec = group.records.find(r => r.equipment_type === 'POST_AOI' || r.equipment_type === 'Post-AOI') || null;

  const isEngineer = currentUser?.role === 'engineer';
  const isManager  = currentUser?.role === 'manager';
  const isAdmin    = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [activeTab, setActiveTab] = useState(() => {
    if (laserRec) return 'Laser';
    if (spiRec) return 'SPI';
    if (preAoiRec) return 'Pre-AOI';
    if (postAoiRec) return 'Post-AOI';
    return 'Laser';
  });

  const renderMachineDetails = () => {
    const tabs = [
      { id: 'Laser', rec: laserRec, color: '#b45309' },
      { id: 'SPI', rec: spiRec, color: '#6d28d9' },
      { id: 'Pre-AOI', rec: preAoiRec, color: '#1d4ed8' },
      { id: 'Post-AOI', rec: postAoiRec, color: '#065f46' }
    ];

    const activeRecData = tabs.find(t => t.id === activeTab);
    const rec = activeRecData?.rec;
    const color = activeRecData?.color || '#334155';

    return (
      <div className="machine-tabs-container">
        {/* Premium Tab Navigation */}
        <div className="machine-tabs-header premium-tabs-wrapper">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`premium-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="premium-tab-dot" style={{ 
                backgroundColor: tab.color,
                boxShadow: activeTab === tab.id ? `0 0 8px ${tab.color}80` : 'none'
              }}></span>
              {tab.id}
              {!tab.rec && <span className="premium-tab-na">({language === 'zh' ? '无' : 'N/A'})</span>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {!rec ? (
           <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
             {language === 'zh' ? `没有该线路的 ${activeTab} 设备保养记录。` : `No maintenance record for ${activeTab} on this line.`}
           </div>
        ) : (
          <div className="premium-machine-card">
            {/* Color Accent line on the left */}
            <div className="premium-machine-accent" style={{ backgroundColor: color }}></div>
            
            <div className="premium-machine-main">
              <div className="premium-machine-header">
                <h4 style={{ color: color }}>
                  {activeTab}
                </h4>
                <span className={`status-badge status-${rec.status.toLowerCase()}`}>
                  {rec.status === 'SUBMITTED' && (language === 'zh' ? '待审核' : 'Pending')}
                  {rec.status === 'ENG_APPROVED' && (language === 'zh' ? '待终审' : 'Eng Approved')}
                  {rec.status === 'DISAPPROVED' && (language === 'zh' ? '被退回' : 'Rejected')}
                  {rec.status === 'APPROVED' && (language === 'zh' ? '已归档' : 'Approved')}
                </span>
              </div>
              
              <div className="premium-machine-meta-grid">
                <div className="meta-item">
                  <span className="meta-label">{language === 'zh' ? '设备型号' : 'Machine Type'}</span>
                  <span className="meta-value">{rec.machine_type || '—'}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">{language === 'zh' ? '资产编号' : 'Asset No.'}</span>
                  <span className="meta-value">{rec.machine_asset_no || '—'}</span>
                </div>
                <div className="meta-item full-width">
                  <span className="meta-label">{language === 'zh' ? '设备序列号' : 'Machine Serial'}</span>
                  <span className="meta-value mono">{rec.machine_name || '—'}</span>
                </div>
              </div>

              {rec.status === 'DISAPPROVED' && rec.rejection_reason && (
                <div className="premium-rejection-box">
                  <span className="rejection-icon">⚠️</span>
                  <div>
                    <strong className="rejection-title">{language === 'zh' ? '退回原因' : 'Rejection Reason'}</strong>
                    {rec.rejection_reason}
                  </div>
                </div>
              )}
            </div>

            <div className="premium-machine-remarks-wrapper">
              <div className="premium-machine-remarks">
                <strong className="remarks-title">
                  <span className="remarks-icon">💬</span> {language === 'zh' ? '保养备注' : 'Remarks'}
                </strong>
                <p className={`remarks-content ${rec.remarks ? '' : 'placeholder'}`}>
                  {rec.remarks || (language === 'zh' ? '本次保养未提交任何备注。' : 'No remarks were submitted for this maintenance check.')}
                </p>
              </div>
            </div>

            {/* Display Attached Images */}
            {Array.isArray(rec.image_paths) && rec.image_paths.length > 0 && (
              <div className="premium-machine-images" style={{ padding: '0 24px 24px 24px' }}>
                <ImageUpload 
                  images={rec.image_paths.map(p => ({ url: `http://localhost:5010${p}` }))} 
                  setImages={() => {}} 
                  readOnly={true} 
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleBatchDelete = () => {
    showConfirm(
      language === 'zh' ? '删除确认' : 'Delete Confirm',
      language === 'zh' 
        ? `警告：确定要永久删除该保养记录组吗？（这会删除 Line ${group.line} 在 ${formatDate(group.date)} 的 ${group.records.length} 份设备保养数据）` 
        : `WARNING: Are you sure you want to permanently delete this checksheet group? (This will delete all ${group.records.length} machine records for Line ${group.line} on ${formatDate(group.date)})`,
      async () => {
        try {
          const idsToDelete = group.records.map(r => r.id);
          await apiService.batchDeleteRecords({ ids: idsToDelete });
          showAlert(
            language === 'zh' ? '成功' : 'Success',
            language === 'zh' ? '该保养单记录组已被成功删除！' : 'Checksheet group deleted successfully!'
          );
          setExpandedRowId(null);
          fetchRecords();
        } catch (err) {
          showAlert('Error', err.message);
        }
      },
      true // isDanger
    );
  };



  return (
    <tr className="expanded-row-child">
      <td colSpan="8">
        <div className="expanded-maint-details animated-fade-in" onClick={(e) => e.stopPropagation()}>
          {/* Title */}
          <h3 className="details-title-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px', marginBottom: '24px' }}>
            <span style={{ fontSize: '1.4rem', color: '#1e40af' }}>📄</span>
            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.2rem', letterSpacing: '-0.5px' }}>
              Line {group.line} {language === 'zh' ? '设备保养详情' : 'Equipment Maintenance Details'} <span className="text-gray-400 mx-2 font-normal">|</span> <span className="text-blue-600">{formatDate(group.date)}</span>
            </span>
          </h3>

          {/* Tabbed General Info Deck */}
          <div className="details-meta-deck-tabbed mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            {renderMachineDetails()}
          </div>

          {/* Two-Column Table & Actions Layout */}
          <div className="details-grid-layout">
            {/* Left Column: Excel-Style Unified Checklist */}
            <div className="details-checklist-col panel-container">
              <h4 className="panel-title">
                📋 {language === 'zh' ? '各设备保养检查执行结果' : 'Checklist Execution Results'}
              </h4>
              <ReportChecklistTable
                records={group.records}
                monthlyChecks={monthlyChecks}
                quarterlyChecks={quarterlyChecks}
                language={language}
                t={t}
                activeTab={activeTab}
              />
            </div>

            {/* Right Column: Workflow timeline & Action items */}
            <div className="details-meta-col" style={{ position: 'sticky', top: '24px', alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Signature progress timeline */}
              <div className="panel-container">
                <h4 className="panel-title">
                  ⏳ {language === 'zh' ? '流程签字审核记录轴' : 'Audit Signature Timeline'}
                </h4>
                <ReportTimeline row={primaryRecord} language={language} />
              </div>

              {/* Review Actions Panel */}
              {((isEngineer || isAdmin) && primaryRecord.status === 'SUBMITTED') && (
                <div className="review-action-panel review-action-panel--review">
                  <button
                    type="button"
                    className="btn-submit-main btn-action-disapprove"
                    onClick={() => onTriggerReview(primaryRecord.id, 'disapprove', { line: primaryRecord.line, period: primaryRecord.period, date: primaryRecord.date })}
                  >
                    ❌ {language === 'zh' ? '不合格退回' : 'Reject / Return'}
                  </button>
                  <button
                    type="button"
                    className="btn-submit-main btn-action-approve"
                    onClick={() => onTriggerReview(primaryRecord.id, 'approve', { line: primaryRecord.line, period: primaryRecord.period, date: primaryRecord.date })}
                  >
                    ✓ {language === 'zh' ? '签字批准' : 'Approve & Sign'}
                  </button>
                </div>
              )}

              {((isManager || isAdmin) && primaryRecord.status === 'ENG_APPROVED') && (
                <div className="review-action-panel review-action-panel--review">
                  <button
                    type="button"
                    className="btn-submit-main btn-action-disapprove"
                    onClick={() => onTriggerReview(primaryRecord.id, 'disapprove', { line: primaryRecord.line, period: primaryRecord.period, date: primaryRecord.date })}
                  >
                    ❌ {language === 'zh' ? '不合格退回' : 'Reject / Return'}
                  </button>
                  <button
                    type="button"
                    className="btn-submit-main btn-action-approve"
                    onClick={() => onTriggerReview(primaryRecord.id, 'approve', { line: primaryRecord.line, period: primaryRecord.period, date: primaryRecord.date })}
                  >
                    ✓ {language === 'zh' ? '经理终审签字' : 'Mgr. Final Approve'}
                  </button>
                </div>
              )}

              {(primaryRecord.status === 'DISAPPROVED' && primaryRecord.submitted_by && primaryRecord.submitted_by.includes(`(${currentUser?.username})`)) && (
                <div className="review-action-panel">
                  <button
                    type="button"
                    className="btn-submit-main btn-action-modify-re"
                    onClick={() => navigate(`/edit-maintenance/${primaryRecord.id}`)}
                  >
                    ✏️ {language === 'zh' ? '去修改并重新提交' : 'Resubmit Record'}
                  </button>
                </div>
              )}

              {(isSuperAdmin && primaryRecord.status !== 'APPROVED') && (
                <div className="review-action-panel review-action-panel--danger">
                  <button
                    type="button"
                    className="btn-submit-main btn-action-delete"
                    onClick={handleBatchDelete}
                  >
                    🗑️ {language === 'zh' ? '删除该保养记录组' : 'Delete Checksheet Group'}
                  </button>
                </div>
              )}


            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}
