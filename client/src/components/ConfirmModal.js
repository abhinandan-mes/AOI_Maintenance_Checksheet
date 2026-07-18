import React from 'react';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  showCancel = true,
  isDanger = false,
  language = 'en'
}) {
  if (!isOpen) return null;

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
      zIndex: 2000,
      animation: 'fadeInConfirm 0.2s ease-out'
    }} onClick={showCancel ? onCancel : undefined}>
      
      <div 
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '95%',
          maxWidth: '500px',
          padding: '24px 28px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          animation: 'slideUpConfirm 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: isDanger ? '#fee2e2' : '#f0fdf4',
            color: isDanger ? '#ef4444' : '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0
          }}>
            {isDanger ? '⚠️' : 'ℹ️'}
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 800, margin: '0 0 6px 0' }}>
              {title}
            </h3>
            <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.4, margin: 0, whiteSpace: 'pre-wrap' }}>
              {message}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          {showCancel && (
            <button
              type="button"
              className="btn-review-sign"
              style={{
                background: '#f1f5f9',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                padding: '8px 16px',
                fontSize: '0.85rem',
                margin: 0,
                boxShadow: 'none',
                cursor: 'pointer'
              }}
              onClick={onCancel}
            >
              {cancelText || (language === 'zh' ? '取消' : 'Cancel')}
            </button>
          )}
          <button
            type="button"
            className="btn-review-sign"
            style={{
              background: isDanger ? '#dc2626' : '#1d4ed8',
              color: '#ffffff',
              padding: '8px 16px',
              fontSize: '0.85rem',
              margin: 0,
              cursor: 'pointer'
            }}
            onClick={onConfirm}
          >
            {confirmText || (language === 'zh' ? '确定' : 'Confirm')}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInConfirm {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUpConfirm {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  );
}
