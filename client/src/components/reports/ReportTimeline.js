import React from 'react';

export default function ReportTimeline({ row = {}, language = 'en' }) {
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString(language === 'zh' ? 'zh-CN' : undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const steps = [];

  // Step 1: Submit
  steps.push({
    key: 'submit',
    titleEn: 'Checksheet Submitted',
    titleZh: '保养记录提交完成',
    done: true,
    user: row.submitted_by || 'Unknown',
    time: formatDateTime(row.created_at || row.date),
    ip: row.submitted_ip || '—',
    icon: '📝',
    color: '#1d4ed8'
  });


  // Step 3: Engineer review
  const engDone = !!row.engineer_reviewed_by || row.status === 'APPROVED' || row.status === 'ENG_APPROVED';
  const engDisapproved = row.status === 'DISAPPROVED' && !row.manager_reviewed_by;
  const isEngPending = row.status === 'SUBMITTED';
  steps.push({
    key: 'engineer',
    titleEn: engDisapproved ? 'Disapproved by Engineer' : 'Engineer Sign-off / Review',
    titleZh: engDisapproved ? '工程师审核不合格退回' : '工程师审核签字',
    done: engDone || engDisapproved,
    isRejected: engDisapproved,
    user: row.engineer_reviewed_by || (isEngPending && row.designated_engineer_id ? `Designated: ${row.designated_engineer_id}` : (engDisapproved ? 'Engineer' : null)),
    time: row.eng_reviewed_at ? formatDateTime(row.eng_reviewed_at) : null,
    ip: row.eng_reviewed_ip || '—',
    icon: engDisapproved ? '❌' : '🎓',
    color: engDisapproved ? '#dc2626' : (engDone ? '#1d4ed8' : (isEngPending ? '#d97706' : '#94a3b8'))
  });

  // Step 4: Manager final review
  const mgrDone = row.status === 'APPROVED';
  const mgrDisapproved = row.status === 'DISAPPROVED' && !!row.manager_reviewed_by;
  const isMgrPending = row.status === 'ENG_APPROVED';
  steps.push({
    key: 'manager',
    titleEn: mgrDisapproved ? 'Disapproved by Manager' : 'Manager Final Sign-off',
    titleZh: mgrDisapproved ? '经理审核不合格退回' : '经理终审签字归档',
    done: mgrDone || mgrDisapproved,
    isRejected: mgrDisapproved,
    user: row.manager_reviewed_by || (isMgrPending && row.designated_manager_id ? `Designated: ${row.designated_manager_id}` : (mgrDisapproved ? 'Manager' : null)),
    time: row.mgr_approved_at ? formatDateTime(row.mgr_approved_at) : null,
    ip: row.mgr_approved_ip || '—',
    icon: mgrDisapproved ? '❌' : '👑',
    color: mgrDisapproved ? '#dc2626' : (mgrDone ? '#16a34a' : (isMgrPending ? '#6d28d9' : '#94a3b8'))
  });

  return (
    <div className="vertical-timeline-wrapper" style={{
      marginTop: '15px',
      paddingLeft: '10px',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        left: '23px',
        top: '20px',
        bottom: '20px',
        width: '3px',
        background: '#e2e8f0',
        zIndex: 0
      }}></div>

      {steps.map((step, index) => {
        const isActive = step.done || step.isRejected;
        return (
          <div key={step.key} style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '20px',
            position: 'relative',
            zIndex: 1
          }}>
            {/* Left Timeline Node icon */}
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: step.isRejected ? '#fee2e2' : (step.done ? '#f0fdf4' : '#f1f5f9'),
              border: `2px solid ${step.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              flexShrink: 0
            }}>
              {step.icon}
            </div>

            {/* Right step details */}
            <div style={{
              background: '#f8fafc',
              border: `1px solid ${step.isRejected ? '#fca5a5' : '#e2e8f0'}`,
              borderRadius: '8px',
              padding: '10px 14px',
              flex: 1
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: step.isRejected ? '#991b1b' : (step.done ? '#1e293b' : '#64748b')
                }}>
                  {language === 'zh' ? step.titleZh : step.titleEn}
                </span>
                {step.time && (
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#94a3b8'
                  }}>
                    {step.time}
                  </span>
                )}
              </div>

              {isActive ? (
                <div style={{
                  fontSize: '0.8rem',
                  color: '#475569',
                  marginTop: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}>
                  {step.user && (
                    <span>
                      👤 <strong>{language === 'zh' ? '经办人员' : 'User'}:</strong> {step.user}
                    </span>
                  )}
                  <span>
                    🌐 <strong>IP Address:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{step.ip}</span>
                  </span>
                </div>
              ) : (
                <div style={{
                  fontSize: '0.78rem',
                  color: '#94a3b8',
                  fontStyle: 'italic',
                  marginTop: '4px'
                }}>
                  {language === 'zh' ? '等待后续操作...' : 'Waiting for action...'}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
