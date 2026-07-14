import React, { useState, useEffect } from 'react';

export default function WorkflowModal({
  isOpen,
  type, // 'approve' | 'disapprove' | 'success'
  details = {}, // { line, period, date }
  onClose,
  onConfirm,
  language = 'en',
  loading = false,
  apiError = ''
}) {
  const [remarks, setRemarks] = useState('');
  const [validationError, setValidationError] = useState('');

  // Reset state when type or open status changes
  useEffect(() => {
    if (isOpen) {
      setRemarks('');
      setValidationError('');
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'disapprove') {
      if (!remarks.trim()) {
        setValidationError(language === 'zh' ? '退回原因不能为空！' : 'Rejection reason is required!');
        return;
      }
    }
    onConfirm(type, remarks);
  };

  const getPeriodLabel = (period) => {
    if (period === 'First Month') return language === 'zh' ? '月度保养 (M1)' : 'Month 1';
    if (period === 'Second Month') return language === 'zh' ? '月度保养 (M2)' : 'Month 2';
    if (period === 'Third Month') return language === 'zh' ? '季度保养 (M3)' : 'Month 3 (Quarterly)';
    return period;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.25s ease-out'
    }} onClick={type !== 'success' ? onClose : undefined}>
      
      <div 
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '480px',
          padding: '24px 30px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Success Alert View */}
        {type === 'success' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#ecfdf5',
              border: '2px solid #10b981',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 16px auto',
              animation: 'scaleIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
              ✓
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 800, margin: '0 0 8px 0' }}>
              {language === 'zh' ? '操作成功！' : 'Action Successful!'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
              {language === 'zh' ? '保养单审核状态已更新。' : 'The maintenance checksheet status has been updated.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: type === 'approve' ? '#ecfdf5' : '#fee2e2',
                color: type === 'approve' ? '#10b981' : '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0
              }}>
                {type === 'approve' ? '✓' : '⚠️'}
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: '#1e293b', fontWeight: 800, margin: 0 }}>
                  {type === 'approve' 
                    ? (language === 'zh' ? '审核签字批准' : 'Approve & Sign-off')
                    : (language === 'zh' ? '退回修改' : 'Reject & Disapprove')
                  }
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', display: 'inline-block' }}>
                  Line {details.line} · {getPeriodLabel(details.period)}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ marginBottom: '22px' }}>
              {apiError && (
                <div style={{
                  background: '#fef2f2',
                  border: '1.5px solid #fca5a5',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  fontSize: '0.82rem',
                  color: '#dc2626',
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '1rem', marginTop: '-1px' }}>⚠️</span>
                  <span>{apiError}</span>
                </div>
              )}

              {type === 'approve' ? (
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                  {language === 'zh' 
                    ? '您确定要签字批准该保养记录吗？如有需要，您可以填写审核备注（选填）。' 
                    : 'Are you sure you want to approve this checksheet? You may optionally provide remarks below.'
                  }
                </p>
              ) : (
                <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.4, margin: '0 0 12px 0' }}>
                  {language === 'zh'
                    ? '请在下方填写退回原因或不合格项修改说明。填写后该检查表将被退回至技术员：'
                    : 'Please specify the rejection reason or required modifications. The checksheet will be routed back to the technician:'
                  }
                </p>
              )}
              
              <div>
                <textarea
                  value={remarks}
                  onChange={(e) => {
                    setRemarks(e.target.value);
                    if (e.target.value.trim()) setValidationError('');
                  }}
                  placeholder={
                    type === 'approve'
                      ? (language === 'zh' ? '填写审核备注（选填）...' : 'Enter approval remarks (optional)...')
                      : (language === 'zh' ? '请输入具体的不合格项说明... *' : 'Enter modification notes... *')
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1.5px solid ${validationError ? '#ef4444' : '#cbd5e1'}`,
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    minHeight: '90px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s ease'
                  }}
                  autoFocus
                />
                {validationError && (
                  <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                    ⚠️ {validationError}
                  </span>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn-review-sign"
                style={{
                  background: '#f1f5f9',
                  color: '#64748b',
                  border: '1px solid #cbd5e1',
                  margin: 0,
                  boxShadow: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
                onClick={onClose}
                disabled={loading}
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="btn-review-sign"
                style={{
                  background: type === 'approve' ? '#16a34a' : '#dc2626',
                  color: '#ffffff',
                  margin: 0,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.8 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                disabled={loading}
              >
                {loading && (
                  <span className="loading-spinner" style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                    display: 'inline-block'
                  }}></span>
                )}
                {loading
                  ? (type === 'approve' 
                      ? (language === 'zh' ? '正在提交...' : 'Approving...') 
                      : (language === 'zh' ? '正在退回...' : 'Rejecting...'))
                  : (type === 'approve'
                      ? (language === 'zh' ? '确定批准' : 'Approve')
                      : (language === 'zh' ? '确认退回' : 'Reject'))
                }
              </button>
            </div>
          </form>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
}
