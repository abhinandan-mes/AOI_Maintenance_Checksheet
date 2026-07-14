import React from 'react';

export default function ReportFilters({
  filters,
  onFilterChange,
  onClear,
  lineOptions = [],
  language = 'en',
  t
}) {
  const isFiltered = Object.values(filters).some(v => v !== 'ALL' && v !== '');

  return (
    <div className="report-filters-card" style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
      padding: '24px',
      marginBottom: '20px'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '20px',
        alignItems: 'end'
      }}>
        {/* Search Input */}
        <div className="filter-group" style={{ gridColumn: 'span 2' }}>
          <label style={{
            display: 'block',
            fontWeight: 600,
            fontSize: '0.85rem',
            color: '#475569',
            marginBottom: '8px'
          }}>
            🔍 {language === 'zh' ? '搜索设备信息/人员' : 'Search Info/User'}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={onFilterChange}
              placeholder={language === 'zh' ? '输入序列号/资产/型号/提交人...' : 'Enter Serial, Asset, Type, Tech...'}
              className="search-input"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Date From */}
        <div className="filter-group">
          <label style={{
            display: 'block',
            fontWeight: 600,
            fontSize: '0.85rem',
            color: '#475569',
            marginBottom: '8px'
          }}>
            📅 {t('rep_filter_from')}
          </label>
          <input
            type="date"
            name="from"
            value={filters.from}
            onChange={onFilterChange}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Date To */}
        <div className="filter-group">
          <label style={{
            display: 'block',
            fontWeight: 600,
            fontSize: '0.85rem',
            color: '#475569',
            marginBottom: '8px'
          }}>
            📅 {t('rep_filter_to')}
          </label>
          <input
            type="date"
            name="to"
            value={filters.to}
            onChange={onFilterChange}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>



        {/* Line select */}
        <div className="filter-group">
          <label style={{
            display: 'block',
            fontWeight: 600,
            fontSize: '0.85rem',
            color: '#475569',
            marginBottom: '8px'
          }}>
            📍 {t('rep_filter_line')}
          </label>
          <select
            name="line"
            value={filters.line}
            onChange={onFilterChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              outline: 'none',
              background: '#ffffff',
              boxSizing: 'border-box'
            }}
          >
            <option value="">{language === 'zh' ? '全部线别' : 'All lines'}</option>
            {lineOptions.map(line => (
              <option key={line} value={line}>{line}</option>
            ))}
          </select>
        </div>

        {/* Period select */}
        <div className="filter-group">
          <label style={{
            display: 'block',
            fontWeight: 600,
            fontSize: '0.85rem',
            color: '#475569',
            marginBottom: '8px'
          }}>
            ⏱️ {language === 'zh' ? '保养周期' : 'Period'}
          </label>
          <select
            name="period"
            value={filters.period}
            onChange={onFilterChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              outline: 'none',
              background: '#ffffff',
              boxSizing: 'border-box'
            }}
          >
            <option value="">{language === 'zh' ? '全部周期' : 'All periods'}</option>
            <option value="First Month">{t('maint_period_m1')}</option>
            <option value="Second Month">{t('maint_period_m2')}</option>
            <option value="Third Month">{t('maint_period_m3')}</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {isFiltered && (
          <div className="filter-group" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="clear-filters"
              onClick={onClear}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#64748b',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                width: '100%',
                justifyContent: 'center',
                boxSizing: 'border-box'
              }}
            >
              ✕ {t('clear')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
