import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import './ActivityLog.css';

// SVG Icons
const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const LoginIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
    <polyline points="10 17 15 12 10 7"/>
    <line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const ListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const ClearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

// Helper: Deterministic avatar color gradient class based on full_name string hash
const getAvatarColorClass = (name) => {
  if (!name) return 'avatar-grad-1';
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  const numGradients = 6;
  const index = (sum % numGradients) + 1;
  return `avatar-grad-${index}`;
};

const getEntityLabel = (type) => {
  if (['LOGIN_SUCCESS', 'FAILED_LOGIN', 'LOGOUT'].includes(type)) return 'Authentication';
  if (['USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'PASSWORD_CHANGE'].includes(type)) return 'User Management';
  if (type === 'SUBMIT') return 'Maintenance Checksheet';
  return 'Review & Approval';
};

const formatTimestampSplit = (ts, language) => {
  if (!ts) return { date: '—', time: '' };
  const dateObj = new Date(ts);
  const dateStr = dateObj.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-CA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeStr = dateObj.toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  return { date: dateStr, time: timeStr };
};


export default function ActivityLog({ currentUser }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [activityEvents, setActivityEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(0);
  const [isCooldown, setIsCooldown] = useState(false);

  // Filter States
  const [userQuery, setUserQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    const updatePageSize = () => {
      // Approx 500px for headers/filters + ~55px per row
      const availableHeight = window.innerHeight - 500;
      let calculatedSize = Math.floor(availableHeight / 55);
      if (calculatedSize < 5) calculatedSize = 5;
      if (calculatedSize > 100) calculatedSize = 100;
      setPageSize(calculatedSize);
    };

    updatePageSize();
    window.addEventListener('resize', updatePageSize);
    return () => window.removeEventListener('resize', updatePageSize);
  }, []);


  const handleRefreshClick = () => {
    const now = Date.now();
    if (now - lastRefresh < 3000) {
      setIsCooldown(true);
      setTimeout(() => setIsCooldown(false), 3000 - (now - lastRefresh));
      return;
    }
    setLastRefresh(now);
    fetchActivityEvents();
  };

  const fetchActivityEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const maintResponse = await apiService.getAllMaintenanceRecords();
      const records = maintResponse.data.data || [];

      let failedLogins = [];
      try {
        const failedResponse = await apiService.getFailedLogins();
        failedLogins = failedResponse.data.data || [];
      } catch (failedErr) {
        console.error('Failed to load failed login attempts:', failedErr);
      }

      let systemEvents = [];
      try {
        const sysResponse = await apiService.getSystemEvents();
        systemEvents = sysResponse.data.data || [];
      } catch (sysErr) {
        console.error('Failed to load system events:', sysErr);
      }

      const rawEvents = [];
      records.forEach(r => {
        // 1. Submit Event
        if (r.created_at) {
          rawEvents.push({
            equipment_type: r.equipment_type,
            line: r.line,
            period: r.period,
            action: 'SUBMIT',
            actionLabelEn: 'Checksheet Submitted',
            actionLabelZh: '提交保养记录',
            user: r.submitted_by || 'Unknown',
            timestamp: r.created_at,
            ip: r.submitted_ip || '—'
          });
        }



        // 3. Engineer Review Event
        if (r.eng_reviewed_at) {
          const isDisapproved = r.status === 'DISAPPROVED' && !r.mgr_approved_at;
          rawEvents.push({
            equipment_type: r.equipment_type,
            line: r.line,
            period: r.period,
            action: isDisapproved ? 'DISAPPROVED_ENG' : 'APPROVE_ENG',
            actionLabelEn: isDisapproved ? 'Disapproved by Engineer' : 'Approved by Engineer',
            actionLabelZh: isDisapproved ? '工程师审核不合格退回' : '工程师审核批准',
            user: r.engineer_reviewed_by || 'Unknown',
            timestamp: r.eng_reviewed_at,
            ip: r.eng_reviewed_ip || '—'
          });
        }

        // 4. Manager Approval Event
        if (r.mgr_approved_at) {
          const isDisapproved = r.status === 'DISAPPROVED';
          rawEvents.push({
            equipment_type: r.equipment_type,
            line: r.line,
            period: r.period,
            action: isDisapproved ? 'DISAPPROVED_MGR' : 'Final Approved by Manager',
            actionLabelEn: isDisapproved ? 'Disapproved by Manager' : 'Final Approved by Manager',
            actionLabelZh: isDisapproved ? '经理审核不合格退回' : '经理终审签字批准',
            user: r.manager_reviewed_by || 'Unknown',
            timestamp: r.mgr_approved_at,
            ip: r.mgr_approved_ip || '—'
          });
        }
      });

      // 5. Failed Login Events
      failedLogins.forEach(f => {
        rawEvents.push({
          equipment_type: 'SYSTEM',
          line: '—',
          period: '—',
          action: 'FAILED_LOGIN',
          actionLabelEn: 'Failed Login Attempt',
          actionLabelZh: '登录失败尝试',
          user: f.username,
          timestamp: f.created_at,
          ip: f.public_ip || '—'
        });
      });

      // 6. Generic System Events (Login Success, Logout, Password Change, User Create/Update/Delete)
      systemEvents.forEach(sys => {
        let labelEn = sys.event_type;
        let labelZh = sys.event_type;
        if (sys.event_type === 'LOGIN_SUCCESS') {
          labelEn = 'Login Successful';
          labelZh = '登录成功';
        } else if (sys.event_type === 'LOGOUT') {
          labelEn = 'Logout';
          labelZh = '退出登录';
        } else if (sys.event_type === 'PASSWORD_CHANGE') {
          labelEn = 'Password Changed';
          labelZh = '密码修改';
        } else if (sys.event_type === 'USER_CREATE') {
          const target = sys.details ? (sys.details.match(/Created user: ([^\s]+)/) || [])[1] : null;
          labelEn = target ? `User Created: ${target}` : 'User Created';
          labelZh = target ? `创建用户: ${target}` : '用户创建';
        } else if (sys.event_type === 'USER_UPDATE') {
          labelEn = 'User Updated';
          labelZh = '用户管理信息更新';
        } else if (sys.event_type === 'USER_DELETE') {
          const target = sys.details ? (sys.details.match(/Deleted user account: ([^\s\(]+)/) || [])[1] : null;
          labelEn = target ? `User Deleted: ${target}` : 'User Deleted';
          labelZh = target ? `用户删除: ${target}` : '用户帐号删除';
        }

        rawEvents.push({
          equipment_type: 'SYSTEM',
          line: '—',
          period: '—',
          action: sys.event_type,
          actionLabelEn: labelEn,
          actionLabelZh: labelZh,
          user: sys.username,
          timestamp: sys.created_at,
          ip: sys.public_ip || '—'
        });
      });

      // Group identical events that happen on the same line, period, user, action, and rounded minute timestamp
      const groupedEventsMap = {};
      rawEvents.forEach(e => {
        const timeMinute = new Date(e.timestamp).toISOString().substring(0, 16);
        const key = `${e.action}-${e.line}-${e.period}-${e.user}-${timeMinute}`;
        
        if (!groupedEventsMap[key]) {
          groupedEventsMap[key] = {
            id: key,
            line: e.line,
            period: e.period,
            action: e.action,
            actionLabelEn: e.actionLabelEn,
            actionLabelZh: e.actionLabelZh,
            user: e.user,
            timestamp: e.timestamp,
            ip: e.ip,
            machines: [e.equipment_type]
          };
        } else {
          if (!groupedEventsMap[key].machines.includes(e.equipment_type)) {
            groupedEventsMap[key].machines.push(e.equipment_type);
          }
        }
      });

      const sorted = Object.values(groupedEventsMap).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setActivityEvents(sorted);
    } catch (err) {
      setError(err.message || 'Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityEvents();
  }, []); // eslint-disable-line

  const getActivityBadgeClass = (action) => {
    if (action === 'Final Approved by Manager' || action === 'LOGIN_SUCCESS') return 'badge-login';
    if (action === 'APPROVE_ENG' || action === 'USER_CREATE' || action === 'USER_UPDATE' || action === 'USER_DELETE') return 'badge-update';
    if (action === 'SUBMIT' || action === 'PASSWORD_CHANGE' || action === 'LOGOUT') return 'badge-submit';
    if (action.startsWith('DISAPPROVED') || action === 'FAILED_LOGIN') return 'badge-failed';
    return 'badge-default';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString(language === 'zh' ? 'zh-CN' : undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Local filtering logic
  const filteredEvents = useMemo(() => {
    return activityEvents.filter(e => {
      const matchUser = e.user.toLowerCase().includes(userQuery.toLowerCase());
      
      let matchAction = true;
      if (selectedAction !== 'ALL') {
        if (selectedAction === 'SUBMIT') matchAction = e.action === 'SUBMIT';
        else if (selectedAction === 'APPROVE') matchAction = e.action === 'APPROVE_ENG' || e.action === 'Final Approved by Manager';
        else if (selectedAction === 'DISAPPROVED') matchAction = e.action.startsWith('DISAPPROVED');
        else if (selectedAction === 'FAILED_LOGIN') matchAction = e.action === 'FAILED_LOGIN';
      }

      let matchPeriod = true;
      if (selectedPeriod !== 'ALL') {
        matchPeriod = e.period === selectedPeriod;
      }

      let matchDate = true;
      if (dateFrom) {
        if (new Date(e.timestamp) < new Date(dateFrom)) matchDate = false;
      }
      if (dateTo) {
        const nextDay = new Date(dateTo);
        nextDay.setDate(nextDay.getDate() + 1);
        if (new Date(e.timestamp) >= nextDay) matchDate = false;
      }

      return matchUser && matchAction && matchPeriod && matchDate;
    });
  }, [activityEvents, userQuery, selectedAction, selectedPeriod, dateFrom, dateTo]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [userQuery, selectedAction, selectedPeriod, dateFrom, dateTo]);

  const clearFilters = () => {
    setUserQuery('');
    setSelectedAction('ALL');
    setSelectedPeriod('ALL');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredEvents.length / pageSize) || 1;
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="activity-container animate-fade-in">
      {/* ── Header ── */}
      <div className="activity-log-header">
        <div className="header-title">
          <span className="subtitle-admin">
            <span className="sub-tag-bullet">✦</span> {language === 'zh' ? '监控日志' : 'MONITORING'}
          </span>
          <h1>
            <span className="title-icon">⏰</span> <span className="premium-heading-gradient">{language === 'zh' ? '系统活动日志' : 'Activity Logs'}</span>
          </h1>
          <p>{language === 'zh' ? '跟踪全系统所有设备的提报、审核签字、指派流转和登录失败安全日志。' : 'Track all equipment checksheet actions, approvals, and system failed login attempts.'}</p>
        </div>
        <button 
          className={`btn-refresh ${loading ? 'is-loading' : ''} ${isCooldown ? 'is-cooldown' : ''}`} 
          onClick={handleRefreshClick} 
          disabled={loading || isCooldown}
          title={isCooldown ? (language === 'zh' ? '请稍后再试' : 'Please wait before refreshing again') : ''}
        >
          <svg className="refresh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          {loading ? t('loading') : (isCooldown ? (language === 'zh' ? '冷却中...' : 'Cooldown...') : (language === 'zh' ? '刷新数据' : 'Refresh Logs'))}
        </button>
      </div>

      {error && <div className="message error">{error}</div>}

      {/* ── Top Stat Cards Grid ── */}
      <div className="activity-stats-grid">
        <div className="activity-stat-card">
          <div className="card-media card-grad-purple">
            <ClockIcon />
          </div>
          <div className="card-info">
            <span className="card-label">{language === 'zh' ? '总事件数' : 'TOTAL EVENTS'}</span>
            <strong className="card-val">{activityEvents.length}</strong>
          </div>
        </div>

        <div className="activity-stat-card">
          <div className="card-media card-grad-rose">
            <LoginIcon />
          </div>
          <div className="card-info">
            <span className="card-label">{language === 'zh' ? '登录失败' : 'FAILED LOGINS'}</span>
            <strong className="card-val">{activityEvents.filter(e => e.action === 'FAILED_LOGIN').length}</strong>
          </div>
        </div>

        <div className="activity-stat-card">
          <div className="card-media card-grad-amber">
            <PlusIcon />
          </div>
          <div className="card-info">
            <span className="card-label">{language === 'zh' ? '待审核' : 'PENDING REVIEWS'}</span>
            <strong className="card-val">{activityEvents.filter(e => e.action === 'SUBMIT').length}</strong>
          </div>
        </div>

        <div className="activity-stat-card">
          <div className="card-media card-grad-green">
            <ClockIcon />
          </div>
          <div className="card-info">
            <span className="card-label">{language === 'zh' ? '已完成审批' : 'FULLY APPROVED'}</span>
            <strong className="card-val">{activityEvents.filter(e => e.action === 'Final Approved by Manager').length}</strong>
          </div>
        </div>
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="activity-filters-card">
        <div className="filters-card-header">
          <FilterIcon />
          <h3>{language === 'zh' ? '筛选条件' : 'Filter Logs'}</h3>
        </div>
        <div className="filters-grid">
          <div className="filter-item">
            <label>{language === 'zh' ? '用户' : 'USER'}</label>
            <input 
              type="text" 
              value={userQuery} 
              onChange={e => setUserQuery(e.target.value)} 
              placeholder={language === 'zh' ? '输入用户名...' : 'Type name...'}
            />
          </div>

          <div className="filter-item">
            <label>{language === 'zh' ? '操作类型' : 'ACTIVITY TYPE'}</label>
            <select value={selectedAction} onChange={e => setSelectedAction(e.target.value)}>
              <option value="ALL">{language === 'zh' ? '所有类型' : 'All Activities'}</option>
              <option value="SUBMIT">{language === 'zh' ? '提交提报' : 'Submissions'}</option>
              <option value="APPROVE">{language === 'zh' ? '审核通过' : 'Approvals'}</option>
              <option value="DISAPPROVED">{language === 'zh' ? '退回修改' : 'Rejections'}</option>
              <option value="FAILED_LOGIN">{language === 'zh' ? '登录失败' : 'Failed Logins'}</option>
            </select>
          </div>
          <div className="filter-item">
            <label>{language === 'zh' ? '保养周期' : 'PERIOD'}</label>
            <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
              <option value="ALL">{language === 'zh' ? '所有周期' : 'All Periods'}</option>
              <option value="—">{language === 'zh' ? '无 (系统事件)' : 'None (System)'}</option>
              <option value="Weekly">{language === 'zh' ? '每周保养' : 'Weekly'}</option>
              <option value="First Month">{language === 'zh' ? '第一月 (M1)' : 'Month 1'}</option>
              <option value="Second Month">{language === 'zh' ? '第二月 (M2)' : 'Month 2'}</option>
              <option value="Third Month">{language === 'zh' ? '第三月 (M3)' : 'Month 3'}</option>
              <option value="Yearly">{language === 'zh' ? '每年保养' : 'Yearly'}</option>
            </select>
          </div>
          
          <div className="filter-item">
            <label>{language === 'zh' ? '开始日期' : 'DATE FROM'}</label>
            <input 
              type="date" 
              value={dateFrom} 
              onChange={e => setDateFrom(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' }}
            />
          </div>

          <div className="filter-item">
            <label>{language === 'zh' ? '结束日期' : 'DATE TO'}</label>
            <input 
              type="date" 
              value={dateTo} 
              onChange={e => setDateTo(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' }}
            />
          </div>

          <div className="filter-actions-row">
            <button className="btn-clear-filters" onClick={clearFilters}>
              <ClearIcon /> {language === 'zh' ? '重置' : 'Clear'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Logs Table ── */}
      <div className="logs-table-card">
        <div className="table-card-header">
          <div className="header-left">
            <ListIcon />
            <h3>{language === 'zh' ? '日志明细' : 'Log Entries'}</h3>
          </div>
          <div className="header-right">
            <span className="results-badge">
              {language === 'zh' ? `${filteredEvents.length} 条记录` : `${filteredEvents.length} event(s)`}
            </span>
          </div>
        </div>

        <div className="logs-table-wrapper">
          <table className="logs-table">
            <thead>
              <tr>
                <th>{language === 'zh' ? '时间' : 'Timestamp'}</th>
                <th>{language === 'zh' ? '线别' : 'Line'}</th>
                <th>{language === 'zh' ? '保养周期' : 'Period'}</th>
                <th>{language === 'zh' ? '操作类型' : 'Activity'}</th>
                <th>{language === 'zh' ? '执行用户' : 'User'}</th>
                <th>{language === 'zh' ? 'IP 地址' : 'IP Address'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    <div className="logs-spinner">{t('loading')}</div>
                  </td>
                </tr>
              ) : paginatedEvents.length > 0 ? (
                paginatedEvents.map(event => {
                  const userInitials = (event.user && event.user !== '—') ? event.user.substring(0, 2).toUpperCase() : 'NA';
                  const colorClass = 'avatar-grad-1';
                  
                  return (
                    <tr key={event.id}>
                      <td>
                        <div className="time-stack">
                          <span className="log-date">{formatDate(event.timestamp)}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#1e3a8a' }}>
                        {event.line === '—' ? '—' : `Line ${event.line}`}
                      </td>
                      <td>
                        {event.period === '—' && '—'}
                        {event.period === 'Weekly' && (language === 'zh' ? '每周' : 'Weekly')}
                        {event.period === 'First Month' && (language === 'zh' ? '第一月 (M1)' : 'Month 1')}
                        {event.period === 'Second Month' && (language === 'zh' ? '第二月 (M2)' : 'Month 2')}
                        {event.period === 'Third Month' && (language === 'zh' ? '第三月 (M3)' : 'Month 3')}
                        {event.period === 'Yearly' && (language === 'zh' ? '每年' : 'Yearly')}
                      </td>
                      <td>
                        <span className={`log-pill ${getActivityBadgeClass(event.action)}`}>
                          {language === 'zh' ? event.actionLabelZh : event.actionLabelEn}
                        </span>
                      </td>
                      <td>
                        <div className="log-user-cell">
                          <div className={`log-avatar ${colorClass}`}>{userInitials}</div>
                          <div className="log-user-info">
                            <strong className="log-user-name">{event.user}</strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code className="log-ip-code">{event.ip}</code>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    {language === 'zh' ? '未找到日志记录' : 'No activity logs found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && filteredEvents.length > 0 && (
          <div className="pagination-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
              {language === 'zh' 
                ? `显示 ${((currentPage - 1) * pageSize) + 1} 到 ${Math.min(currentPage * pageSize, filteredEvents.length)} 条，共 ${filteredEvents.length} 条记录`
                : `Showing ${((currentPage - 1) * pageSize) + 1} to ${Math.min(currentPage * pageSize, filteredEvents.length)} of ${filteredEvents.length} entries`}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f8fafc' : 'white', color: currentPage === 1 ? '#cbd5e1' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                {language === 'zh' ? '上一页' : 'Previous'}
              </button>
              <div style={{ padding: '0 8px', fontWeight: '600', color: '#0f172a' }}>
                {currentPage} / {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f8fafc' : 'white', color: currentPage === totalPages ? '#cbd5e1' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                {language === 'zh' ? '下一页' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
