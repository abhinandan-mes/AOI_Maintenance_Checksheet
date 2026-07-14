import React from 'react';

export default function ReportStats({ rows = [], language = 'en' }) {
  const total = rows.length;
  const approved = rows.filter(r => r.status === 'APPROVED').length;
  const pending = rows.filter(r => r.status === 'SUBMITTED' || r.status === 'ENG_APPROVED').length;
  const rejected = rows.filter(r => r.status === 'DISAPPROVED').length;

  const stats = [
    {
      key: 'total',
      titleEn: 'Total Records',
      titleZh: '总保养记录数',
      value: total,
      color: '#1d4ed8',
      background: '#eff6ff',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      )
    },
    {
      key: 'approved',
      titleEn: 'Approved Sign-offs',
      titleZh: '已签字归档',
      value: approved,
      color: '#16a34a',
      background: '#f0fdf4',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      )
    },
    {
      key: 'pending',
      titleEn: 'Pending Reviews',
      titleZh: '待审核保养',
      value: pending,
      color: '#d97706',
      background: '#fffbeb',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      )
    },
    {
      key: 'rejected',
      titleEn: 'Disapproved / Resubmit',
      titleZh: '被退回修改',
      value: rejected,
      color: '#dc2626',
      background: '#fef2f2',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      )
    }
  ];

  return (
    <div className="report-stats-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '20px',
      marginBottom: '24px'
    }}>
      {stats.map(s => (
        <div key={s.key} className="report-stat-card" style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px 24px',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          transition: 'all 0.25s ease'
        }}>
          <div className="stat-card-icon" style={{
            background: s.background,
            color: s.color,
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {s.icon}
          </div>
          <div className="stat-card-info">
            <h3 style={{
              fontSize: '0.85rem',
              color: '#64748b',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 4px 0'
            }}>
              {language === 'zh' ? s.titleZh : s.titleEn}
            </h3>
            <p style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#0f172a',
              margin: 0,
              lineHeight: 1
            }}>
              {s.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
