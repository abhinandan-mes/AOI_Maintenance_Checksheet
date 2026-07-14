import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import './Home.css';
import { useLanguage } from '../contexts/LanguageContext';
import ConfirmModal from './ConfirmModal';

export default function Home({ currentUser }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [usersSummary, setUsersSummary] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [allRecords, setAllRecords] = useState([]);

  const [dashboardStats, setDashboardStats] = useState({
    totalSubmissionsToday: 0,
    pendingEngCount: 0,
    pendingMgrCount: 0,
    activeLinesToday: 0,
    activeLinesList: ''
  });

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

  useEffect(() => {
    fetchDashboardData();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!allRecords) return;
    const year = parseInt(selectedMonth.split('-')[0], 10);
    const month = parseInt(selectedMonth.split('-')[1], 10) - 1; // 0-indexed

    const uniqueGroups = {
      total: new Set(),
      pendingEng: new Set(),
      pendingMgr: new Set(),
      approved: new Set()
    };

    allRecords.forEach(r => {
      if (r.created_at) {
        const logDate = new Date(r.created_at);
        if (logDate.getMonth() === month && logDate.getFullYear() === year) {
          const dateStr = r.date ? r.date.split('T')[0] : '';
          const groupId = `${r.line}_${r.period}_${dateStr}_${r.submitted_by}`;
          
          uniqueGroups.total.add(groupId);
          if (r.status === 'SUBMITTED') uniqueGroups.pendingEng.add(groupId);
          if (r.status === 'ENG_APPROVED') uniqueGroups.pendingMgr.add(groupId);
          if (r.status === 'APPROVED') uniqueGroups.approved.add(groupId);
        }
      }
    });

    setDashboardStats({
      totalSubmissionsMonth: uniqueGroups.total.size,
      pendingEngCount: uniqueGroups.pendingEng.size,
      pendingMgrCount: uniqueGroups.pendingMgr.size,
      finishedMaintenanceCount: uniqueGroups.approved.size
    });
  }, [allRecords, selectedMonth]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      if (isSuperAdmin) {
        const response = await apiService.getAllSessionsSummary();
        const sortedUsers = (response.data.users || []).sort((a, b) => {
          if (!a.last_login && !b.last_login) return 0;
          if (!a.last_login) return 1;
          if (!b.last_login) return -1;
          return new Date(b.last_login) - new Date(a.last_login);
        });
        setUsersSummary(sortedUsers);
      } else {
        const response = await apiService.getMySessions();
        setSessions(response.data.sessions || []);
      }

      // Load maintenance records for notification checking
      const maintResponse = await apiService.getAllMaintenanceRecords();
      const records = maintResponse.data.data || [];



      // Populate activityLog from records, failed logins, and system events
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


      // Group identical events that happen on the same line, period, user, action, and rounded minute timestamp
      const groupedEventsMap = {};
      rawEvents.forEach(e => {
        const timeMinute = new Date(e.timestamp).toISOString().substring(0, 16); // e.g. "2026-07-02T02:30"
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

      // Store all records to allow client-side month filtering
      setAllRecords(records);

      const events = Object.values(groupedEventsMap);

      // Sort events chronologically (newest first)
      events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setActivityLog(events.slice(0, 5)); // limit to top 5 recent actions for home page
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = (sessionId, isCurrent) => {
    const msg = isCurrent ? t('home_confirm_revoke_current') : t('home_confirm_revoke_other');

    const executeRevoke = async () => {
      try {
        setError('');
        setSuccessMsg('');
        await apiService.revokeSession(sessionId);
        setSuccessMsg(t('home_success_revoke'));
        
        if (isCurrent && sessionId === currentUser?.session_id) {
          window.location.reload();
        } else {
          await fetchDashboardData();
        }
      } catch (err) {
        setError(err.message || t('error'));
      }
    };

    showConfirm(
      language === 'zh' ? '注销确认' : 'Revoke Confirm',
      msg,
      executeRevoke,
      true // isDanger
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return language === 'zh' ? '从未' : 'Never';
    return new Date(dateStr).toLocaleString(language === 'zh' ? 'zh-CN' : undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActivityBadgeClass = (action) => {
    if (action === 'Final Approved by Manager' || action === 'LOGIN_SUCCESS') return 'status-approved';
    if (action === 'APPROVE_ENG' || action === 'USER_CREATE' || action === 'USER_UPDATE' || action === 'USER_DELETE') return 'status-eng_approved';
    if (action === 'SUBMIT' || action === 'PASSWORD_CHANGE' || action === 'LOGOUT') return 'status-submitted';
    if (action.startsWith('DISAPPROVED') || action === 'FAILED_LOGIN') return 'status-disapproved';
    return '';
  };

  const toggleUserExpand = (userId) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin': return t('um_role_super_admin');
      case 'admin': return t('um_role_admin');
      case 'inspector': return t('um_role_inspector');
      case 'technician': return t('um_role_technician');
      case 'engineer': return t('um_role_engineer');
      case 'manager': return t('um_role_manager');
      default: return role;
    }
  };

  if (loading && sessions.length === 0 && usersSummary.length === 0) {
    return <div className="home-loading">{t('home_loading')}</div>;
  }

  // Calculate quick stats
  const totalUsersCount = usersSummary.length;
  const activeSessionsSystemCount = usersSummary.reduce((acc, u) => acc + (u.active_sessions_count || 0), 0);
  
  const myTotalSessions = sessions.length;
  const myActiveSessions = sessions.filter(s => s.status === 'active').length;
  const currentIp = sessions.find(s => s.session_id === currentUser?.session_id)?.public_ip || 'Unknown';

  return (
    <div className="home-container">
      {/* Redesigned Mockup Welcome Banner */}
      <div className="home-header-row">
        <div className="header-greeting-meta">
          <span className="greet-sub-tag">
            <span className="sub-tag-bullet">✦</span> {language === 'zh' ? '欢迎回来' : 'WELCOME BACK'}
          </span>
          <h1>
            <span className="wave-greet-icon">👋</span>
            <span className="greet-name-text premium-heading-gradient">{currentUser?.full_name || currentUser?.username || 'User'}</span>
          </h1>
        </div>
        <div className="header-pill-badges">
          <div className="unified-header-pill">
            📊 {language === 'zh' ? '分析月份: ' : 'Stats Month: '}
            <input 
              type="month"
              className="month-picker-input"
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="unified-header-pill">
            📅 {new Date().toLocaleDateString(language === 'zh' ? 'zh-CN' : undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div className="unified-header-pill role-pill-badge">
            🛡️ {getRoleLabel(currentUser?.role)}
          </div>
        </div>
      </div>

      {successMsg && <div className="home-alert alert-success">{successMsg}</div>}
      {error && <div className="home-alert alert-danger">{error}</div>}

      {/* ── Redesigned Stat Cards Grid ── */}
      <div className="home-stats-grid">
        {/* Card 1 (Purple): Total Submissions */}
        <div className="unified-stat-card accent-violet">
          
          <div className="unified-icon-block icon-violet"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg></div><div className="unified-stat-content"><span className="unified-stat-label">{language === 'zh' ? '本月提交总数' : 'MONTH TOTAL'}</span><span className="unified-stat-value">{dashboardStats?.totalSubmissionsMonth || 0}</span></div>
          
        </div>

        {/* Card 2 (Blue): Pending Engineer */}
        <div className="unified-stat-card accent-amber">
          
          <div className="unified-icon-block icon-amber"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg></div><div className="unified-stat-content"><span className="unified-stat-label">{language === 'zh' ? '待审核' : 'PENDING REVIEW'}</span><span className="unified-stat-value">{dashboardStats?.pendingEngCount || 0}</span></div>
          
        </div>

        {/* Card 3 (Rose): Pending Manager */}
        <div className="unified-stat-card accent-blue">
          
          <div className="unified-icon-block icon-blue"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div><div className="unified-stat-content"><span className="unified-stat-label">{language === 'zh' ? '待审批' : 'PENDING APPROVAL'}</span><span className="unified-stat-value">{dashboardStats?.pendingMgrCount || 0}</span></div>
          
        </div>

        {/* Card 4 (Orange): Maintenance Finished */}
        <div className="unified-stat-card accent-emerald">
          
          <div className="unified-icon-block icon-emerald"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div><div className="unified-stat-content"><span className="unified-stat-label">{language === 'zh' ? '已完成保养' : 'COMPLETED'}</span><span className="unified-stat-value">{dashboardStats?.finishedMaintenanceCount || 0}</span></div>
          
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-content">
{activityLog.length > 0 && (
          <div className="dashboard-card pending-card animate-slide-up" style={{ gridColumn: 'span 2', marginTop: '20px' }}>
            <div className="card-header pending-header" style={{ borderLeft: '4px solid #1d4ed8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>📋 {language === 'zh' ? '设备保养审核活动日志' : 'Equipment Maintenance Activity Log'}</h2>
              <button 
                type="button" 
                className="refresh-btn" 
                style={{ padding: '6px 14px', fontSize: '0.85rem' }} 
                onClick={() => navigate('/activity-log')}
              >
                {language === 'zh' ? '查看全部 →' : 'View All →'}
              </button>
            </div>
            <p className="card-subtitle">
              {language === 'zh' 
                ? '显示系统内最近 5 条设备保养记录的操作日志与登录失败记录。' 
                : 'Showing the last 5 equipment maintenance actions and failed login records.'}
            </p>
            <div className="table-responsive">
              <table className="dashboard-table">
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
                  {activityLog.map(event => (
                    <tr key={event.id}>
                      <td>{formatDate(event.timestamp)}</td>
                      <td style={{ fontWeight: 700, color: '#1e3a8a' }}>
                        {event.line === '—' ? '—' : `Line ${event.line}`}
                      </td>
                      <td>
                        {event.period === '—' && '—'}
                        {event.period === 'First Month' && (language === 'zh' ? '第一月 (M1)' : 'Month 1')}
                        {event.period === 'Second Month' && (language === 'zh' ? '第二月 (M2)' : 'Month 2')}
                        {event.period === 'Third Month' && (language === 'zh' ? '第三月 (M3)' : 'Month 3')}
                      </td>
                      <td>
                        <span className={`status-badge ${getActivityBadgeClass(event.action)}`}>
                          {language === 'zh' ? event.actionLabelZh : event.actionLabelEn}
                        </span>
                      </td>
                      <td>{event.user}</td>
                      <td className="ip-cell">{event.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isSuperAdmin ? (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>{t('home_sessions_all_title')}</h2>
              <button className="refresh-btn" onClick={fetchDashboardData}>{language === 'zh' ? '同步数据' : 'Sync Data'}</button>
            </div>
            <p className="card-subtitle">{language === 'zh' ? '显示系统中的所有用户、其最后登录详情以及活动登录会话。' : 'Showing all users in the system, their last login details, and active login sessions.'}</p>
            
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>{t('home_th_user')}</th>
                    <th>{t('profile_role')}</th>
                    <th>{language === 'zh' ? '最后登录时间' : 'Last Login Time'}</th>
                    <th>{language === 'zh' ? '最后登录 IP' : 'Last Login IP'}</th>
                    <th>{t('home_active_sessions')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {usersSummary.map((user) => {
                    const isExpanded = expandedUser === user.id;
                    return (
                      <React.Fragment key={user.id}>
                        <tr className={isExpanded ? 'expanded-row-parent' : ''}>
                          <td>
                            <div className="user-identity">
                              <span className="user-fullname">{user.full_name}</span>
                              <span className="user-username">@{user.username}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`role-badge role-${user.role}`}>{getRoleLabel(user.role)}</span>
                          </td>
                          <td>{formatDate(user.last_login)}</td>
                          <td className="ip-cell">{user.last_ip || '—'}</td>
                          <td>
                            <span className={`active-sessions-count ${user.active_sessions_count > 0 ? 'has-active' : ''}`}>
                              {user.active_sessions_count} {language === 'zh' ? '个活动' : 'active'}
                            </span>
                          </td>
                          <td>
                            <button 
                              className={`toggle-details-btn ${isExpanded ? 'active' : ''}`}
                              onClick={() => toggleUserExpand(user.id)}
                            >
                              {isExpanded ? (language === 'zh' ? '隐藏详情' : 'Hide Details') : (language === 'zh' ? '管理会话' : 'Manage Sessions')}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="expanded-row-child">
                            <td colSpan="6">
                              <div className="expanded-session-details">
                                <h4>{language === 'zh' ? `${user.full_name} 的活动登录会话` : `Active Sessions for ${user.full_name}`}</h4>
                                {user.active_sessions.length === 0 ? (
                                  <p className="no-active-sessions">{t('home_no_sessions')}</p>
                                ) : (
                                  <table className="nested-sessions-table">
                                    <thead>
                                      <tr>
                                        <th>{t('home_th_ip')}</th>
                                        <th>{t('home_th_login_time')}</th>
                                        <th>Session ID</th>
                                        <th>{language === 'zh' ? '操作' : 'Action'}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {user.active_sessions.map(session => {
                                        const isMyCurrent = session.session_id === currentUser?.session_id;
                                        return (
                                          <tr key={session.session_id} className={isMyCurrent ? 'highlight-session' : ''}>
                                            <td className="ip-cell">
                                              <div className="ip-wrapper">
                                                {session.public_ip}
                                                {isMyCurrent && <span className="current-badge">{language === 'zh' ? '当前会话' : 'Your Current Session'}</span>}
                                              </div>
                                            </td>
                                            <td>{formatDate(session.login_time)}</td>
                                            <td className="session-id-cell"><span title={session.session_id}>{session.session_id.slice(0, 8)}&hellip;</span></td>
                                            <td>
                                              <button
                                                className="revoke-btn-danger"
                                                onClick={() => handleRevokeSession(session.session_id, isMyCurrent)}
                                              >
                                                {language === 'zh' ? '强制下线' : 'Terminate'}
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>{t('home_sessions_title')}</h2>
              <button className="refresh-btn" onClick={fetchDashboardData}>{language === 'zh' ? '同步数据' : 'Sync Data'}</button>
            </div>
            <p className="card-subtitle">{language === 'zh' ? '为您账户记录的所有登录会话列表。您可以终止其他活动会话以保护您的账户安全。' : 'A list of all login sessions recorded for your account. You can terminate other active sessions to secure your account.'}</p>

            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>{t('home_th_status')}</th>
                    <th>{t('home_th_login_time')}</th>
                    <th>{language === 'zh' ? '登出时间' : 'Logout Time'}</th>
                    <th>{t('home_th_ip')}</th>
                    <th>Session ID</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => {
                    const isActive = session.status === 'active';
                    const isCurrent = session.session_id === currentUser?.session_id;
                    return (
                      <tr key={session.session_id} className={isCurrent ? 'highlight-session' : ''}>
                        <td>
                          <div className="status-cell">
                            <span className={`session-status-dot status-${session.status}`}></span>
                            <span className="status-text capitalize">
                              {isCurrent ? (language === 'zh' ? '活动 (当前)' : 'Active (Current)') : (session.status === 'active' ? (language === 'zh' ? '活动' : 'Active') : (language === 'zh' ? '已注销' : 'Logged Out'))}
                            </span>
                          </div>
                        </td>
                        <td>{formatDate(session.login_time)}</td>
                        <td>{isActive ? '—' : formatDate(session.logout_time)}</td>
                        <td className="ip-cell">{session.public_ip}</td>
                        <td className="session-id-cell"><span title={session.session_id}>{session.session_id.slice(0, 8)}&hellip;</span></td>
                        <td>
                          {isActive ? (
                            <button
                              className="revoke-btn-danger"
                              onClick={() => handleRevokeSession(session.session_id, isCurrent)}
                              disabled={isCurrent}
                              title={isCurrent ? (language === 'zh' ? "您无法在此终止当前会话，请使用注销按钮。" : "You cannot terminate your current session from here. Use the standard Logout.") : (language === 'zh' ? "远程终止此会话" : "Terminate this session remotely")}
                            >
                              {isCurrent ? (language === 'zh' ? '当前会话' : 'Current Session') : (language === 'zh' ? '下线' : 'Terminate')}
                            </button>
                          ) : (
                            <span className="logged-out-placeholder">{language === 'zh' ? '已结束' : 'Ended'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

              </div>
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
