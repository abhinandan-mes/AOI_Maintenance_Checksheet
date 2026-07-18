import React from 'react';

export default function ReportChecklistTable({
  records = [],
  language = 'en',
  t,
  activeTab
}) {
  const primaryRecord = records[0] || {};
  const isThirdMonth = primaryRecord.period === 'Third Month' || primaryRecord.period === 'Yearly';

  const laserRec = records.find(r => r.equipment_type === 'LASER' || r.equipment_type === 'Laser') || null;
  const spiRec = records.find(r => r.equipment_type === 'SPI') || null;
  const preAoiRec = records.find(r => r.equipment_type === 'PRE_AOI' || r.equipment_type === 'Pre-AOI') || null;
  const postAoiRec = records.find(r => r.equipment_type === 'POST_AOI' || r.equipment_type === 'Post-AOI') || null;

  const consolidatedMonthlyChecks = [
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

  const consolidatedQuarterlyChecks = [
    { key: 'q1_clean_cabinet_dust',       label: t('q1_label'),  detail: t('q1_detail') },
    { key: 'q2_inspect_belt',             label: t('q2_label'),  detail: t('q2_detail') },
    { key: 'q3_screws_rails_lubricant',   label: t('q3_label'),  detail: t('q3_detail') },
    { key: 'q4_replace_filter_screen',    label: t('q4_label'),  detail: t('q4_detail') },
  ];

  const renderResultCell = (rec, key) => {
    if (!rec) {
      return <span style={{ color: '#94a3b8' }}>—</span>;
    }
    const val = rec[key];
    if (val === null || val === undefined) {
      return <span style={{ color: '#94a3b8' }}>—</span>;
    }
    const isPassed = val === true;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        background: isPassed ? '#e2fbee' : '#fee2e2',
        color: isPassed ? '#15803d' : '#b91c1c',
        fontWeight: 800,
        fontSize: '0.8rem',
        border: isPassed ? '1px solid #bbf7d0' : '1px solid #fecaca'
      }}>
        {isPassed ? '✓' : '✗'}
      </span>
    );
  };

  return (
    <div className="report-checklist-table-wrapper" style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      marginTop: '15px'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontSize: '0.85rem'
      }}>
        <thead>
          <tr style={{
            background: '#f1f5f9',
            borderBottom: '2px solid #e2e8f0',
            color: '#475569',
            fontWeight: 700
          }}>
            <th style={{ padding: '12px 16px', width: '80px' }}>
              {language === 'zh' ? '保养周期' : 'Cycle'}
            </th>
            <th style={{ padding: '12px 16px', width: '40px', textAlign: 'center' }}>#</th>
            <th style={{ padding: '12px 16px' }}>
              {language === 'zh' ? '保养检查内容' : 'Maintenance Check Content'}
            </th>
            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>
              {language === 'zh' ? '月度/季度操作项' : 'Monthly/Quarterly Details'}
            </th>
            <th style={{ padding: '12px 16px', width: '120px', textAlign: 'center', borderLeft: '1px solid #e2e8f0', color: '#1e40af' }}>
              {primaryRecord.period === 'First Month' && (language === 'zh' ? '第一月 (结果)' : 'First Month (Result)')}
              {primaryRecord.period === 'Second Month' && (language === 'zh' ? '第二月 (结果)' : 'Second Month (Result)')}
              {primaryRecord.period === 'Third Month' && (language === 'zh' ? '第三月 (结果)' : 'Third Month (Result)')}
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Monthly Checks */}
          {consolidatedMonthlyChecks.map((check, idx) => {
            return (
              <tr key={check.key} style={{
                borderBottom: '1px solid #e2e8f0',
                background: '#ffffff'
              }}>
                <td style={{ padding: '10px 16px', fontWeight: 600, color: '#1e3a8a' }}>
                  {idx === 0 && (
                    <span style={{
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      border: '1px solid #bfdbfe'
                    }}>
                      {language === 'zh' ? '月度' : 'Monthly'}
                    </span>
                  )}
                </td>
                <td style={{ padding: '10px 16px', color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>
                  {idx + 1}
                </td>
                <td style={{ padding: '10px 16px', color: '#334155' }}>
                  {check.label}
                </td>
                <td style={{ padding: '10px 16px', color: '#64748b', fontSize: '0.85rem' }}>
                  {check.detail}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'center', borderLeft: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  {activeTab === 'Laser' ? renderResultCell(laserRec, check.key) :
                   activeTab === 'SPI' ? renderResultCell(spiRec, check.key) :
                   activeTab === 'Pre-AOI' ? renderResultCell(preAoiRec, check.key) :
                   renderResultCell(postAoiRec, check.key)}
                </td>
              </tr>
            );
          })}

          {/* Quarterly Checks (M3 only) */}
          {isThirdMonth && consolidatedQuarterlyChecks.map((check, idx) => {
            return (
              <tr key={check.key} style={{
                borderBottom: '1px solid #e2e8f0',
                background: '#ffffff'
              }}>
                <td style={{ padding: '10px 16px', fontWeight: 600, color: '#6d28d9' }}>
                  {idx === 0 && (
                    <span style={{
                      background: '#f5f3ff',
                      color: '#6d28d9',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      border: '1px solid #ddd6fe'
                    }}>
                      {language === 'zh' ? '季度' : 'Quarterly'}
                    </span>
                  )}
                </td>
                <td style={{ padding: '10px 16px', color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>
                  {consolidatedMonthlyChecks.length + idx + 1}
                </td>
                <td style={{ padding: '10px 16px', color: '#334155' }}>
                  {check.label}
                </td>
                <td style={{ padding: '10px 16px', color: '#64748b', fontSize: '0.85rem' }}>
                  {check.detail}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'center', borderLeft: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  {activeTab === 'Laser' ? renderResultCell(laserRec, check.key) :
                   activeTab === 'SPI' ? renderResultCell(spiRec, check.key) :
                   activeTab === 'Pre-AOI' ? renderResultCell(preAoiRec, check.key) :
                   renderResultCell(postAoiRec, check.key)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
