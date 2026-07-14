import React, { useState, useEffect, useMemo } from 'react';
import apiService from '../services/api';
import './UserManagement.css';
import { useLanguage } from '../contexts/LanguageContext';

export default function UserManagement({ currentUser }) {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal Visibility States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Form States
  const [targetUser, setTargetUser] = useState(null);
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'inspector',
    password: '',
    confirmPassword: ''
  });

  const [showFormPassword, setShowFormPassword] = useState(false);

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const currentUserId = currentUser?.id;

  const isManager = currentUser?.role === 'manager';

  const baseRoleOptions = useMemo(() => [
    { value: 'technician', label: t('um_role_technician') },
    { value: 'inspector', label: t('um_role_inspector') }
  ], [t]);

  const roleOptions = useMemo(() => isSuperAdmin || isManager
    ? [
        { value: 'super_admin', label: t('um_role_super_admin') },
        // Admin role removed per system rules
        { value: 'manager', label: t('um_role_manager') },
        { value: 'engineer', label: t('um_role_engineer') },
        ...baseRoleOptions
      ]
    : baseRoleOptions, [isSuperAdmin, isManager, baseRoleOptions, t]);

  // Fetch all users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiService.getAllUsers();
      setUsers(response.data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    }
  };

  const canEditUser = (target) => {
    if (target.id === currentUserId) return true; // Can edit yourself
    if (isSuperAdmin) return true;
    if (isManager && ['inspector', 'technician'].includes(target.role)) return true;
    return false;
  };

  const canDeleteUser = (target) => {
    if (target.id === currentUserId) return false; // Can't delete yourself
    if (isSuperAdmin) return true;
    if (isManager && ['inspector', 'technician'].includes(target.role)) return true;
    return false;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
    if (message || error) {
      setMessage('');
      setError('');
    }
  };

  const openCreateModal = () => {
    setForm({
      username: '',
      fullName: '',
      email: '',
      phone: '',
      role: 'inspector',
      password: '',
      confirmPassword: ''
    });
    setError('');
    setMessage('');
    setShowFormPassword(false);
    setShowCreateModal(true);
  };

  const openEditModal = (user) => {
    setTargetUser(user);
    setForm({
      username: user.username,
      fullName: user.full_name,
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      password: '',
      confirmPassword: ''
    });
    setError('');
    setMessage('');
    setShowEditModal(true);
  };

  const openPasswordModal = (user) => {
    setTargetUser(user);
    setForm({
      username: user.username,
      fullName: user.full_name,
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      password: '',
      confirmPassword: ''
    });
    setError('');
    setMessage('');
    setShowFormPassword(false);
    setShowPasswordModal(true);
  };

  const handleDelete = async (userId) => {
    const superAdmins = users.filter(u => u.role === 'super_admin');
    const target = users.find(u => u.id === userId);
    if (target?.role === 'super_admin' && superAdmins.length <= 1) {
      setError(
        language === 'zh'
          ? '无法删除唯一的超级管理员账号。'
          : 'Cannot delete the only Super Admin account.'
      );
      return;
    }

    if (!window.confirm(t('um_confirm_delete'))) return;
    
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiService.deleteUser(userId);
      setMessage(t('um_msg_delete_success'));
      fetchUsers();
    } catch (err) {
      setError(err.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (form.password !== form.confirmPassword) {
      setError(language === 'zh' ? '两次输入的密码不一致。' : 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await apiService.createUser({
        username: form.username,
        password: form.password,
        fullName: form.fullName,
        role: form.role,
        email: form.email || null,
        phone: form.phone || null
      });
      setMessage(t('um_msg_create_success'));
      setShowCreateModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const payload = {
        fullName: form.fullName,
        role: form.role,
        email: form.email || null,
        phone: form.phone || null
      };

      await apiService.updateUser(targetUser.id, payload);
      
      if (targetUser.id === currentUserId) {
        setMessage(language === 'zh' 
          ? `用户 ${form.username} 更新成功。正在重新加载页面以应用更改...`
          : `User ${form.username} updated successfully. Reloading page to apply changes...`
        );
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage(t('um_msg_update_success'));
      }
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (form.password !== form.confirmPassword) {
      setError(language === 'zh' ? '两次输入的密码不一致。' : 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        password: form.password
      };

      await apiService.updateUser(targetUser.id, payload);
      setMessage(language === 'zh' ? '密码重置成功。' : 'Password reset successfully.');
      setShowPasswordModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  // Helper for deterministic avatar color backgrounds
  const getAvatarColorClass = (name) => {
    const colors = ['purple', 'blue', 'green', 'orange', 'indigo', 'rose', 'teal'];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return `avatar-bg-${colors[sum % colors.length]}`;
  };

  // Helper for formatting date strings
  const formatCreatedDate = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hour = d.getHours();
    const min = String(d.getMinutes()).padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${day} ${month} ${year} ${String(hour).padStart(2, '0')}:${min} ${ampm}`;
  };

  // Filter & Search Logic
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        u.username.toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        u.role.toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery]);

  // Pagination Logic
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  // Stat Card Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.session_status === 'active').length;
    const inactive = total - active;
    const admins = users.filter(u => ['super_admin', 'admin'].includes(u.role)).length;
    return { total, active, inactive, admins };
  }, [users]);

  // Localized Role Labels
  const getRoleLabel = (roleKey) => {
    switch (roleKey) {
      case 'super_admin': return language === 'zh' ? '超级管理员' : 'SUPER ADMIN';
      case 'admin': return language === 'zh' ? '管理员' : 'ADMIN';
      case 'technician': return language === 'zh' ? '技术员' : 'TECHNICIAN';
      case 'inspector': return language === 'zh' ? '检验员' : 'INSPECTOR';
      case 'operator': return language === 'zh' ? '操作工' : 'OPERATOR';
      default: return roleKey.toUpperCase();
    }
  };

  return (
    <div className="user-management-container">
      {/* Upper Navigation Indicator & Header Title */}
      <div className="um-header">
        <div className="header-left">
          <span className="subtitle-admin">{language === 'zh' ? '系统管理' : 'ADMINISTRATION'}</span>
          <h1><span className="premium-heading-gradient">{t('um_title')}</span></h1>
          <p className="desc-admin">{language === 'zh' ? '管理系统用户账号、角色权限以及安全设置。' : 'Manage system users and roles'}</p>
        </div>
        <div className="header-right">
          <button type="button" className="btn-add-user" onClick={openCreateModal}>
            <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '8px', fill: 'currentColor' }}>
              <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            {language === 'zh' ? '添加新用户' : 'Add New User'}
          </button>
        </div>
      </div>

      {error && <div className="login-error um-message-alert">{error}</div>}
      {message && <div className="login-success um-message-alert">{message}</div>}

      {/* ── Stat Cards Panel ── */}
      <div className="um-stats-grid">
        <div className="unified-stat-card accent-violet">
          <div className="unified-icon-block icon-violet">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <div className="unified-stat-content">
            <span className="unified-stat-label">{language === 'zh' ? '总用户数' : 'TOTAL USERS'}</span>
            <span className="unified-stat-value">{metrics.total}</span>
          </div>
        </div>

        <div className="unified-stat-card accent-emerald">
          <div className="unified-icon-block icon-emerald">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div className="unified-stat-content">
            <span className="unified-stat-label">{language === 'zh' ? '在线' : 'ACTIVE'}</span>
            <span className="unified-stat-value">{metrics.active}</span>
          </div>
        </div>

        <div className="unified-stat-card accent-rose">
          <div className="unified-icon-block icon-rose">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-6.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
            </svg>
          </div>
          <div className="unified-stat-content">
            <span className="unified-stat-label">{language === 'zh' ? '离线' : 'INACTIVE'}</span>
            <span className="unified-stat-value">{metrics.inactive}</span>
          </div>
        </div>

        <div className="unified-stat-card accent-amber">
          <div className="unified-icon-block icon-amber">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 12c-2.7 0-5.8-1.28-6-2v-1c0-1.33 2.67-2 4-2 .26 0 .61.03.97.08-.24.58-.37 1.24-.37 1.92 0 1 .3 1.93.81 2.73-.42.17-.89.27-1.41.27z"/>
            </svg>
          </div>
          <div className="unified-stat-content">
            <span className="unified-stat-label">{language === 'zh' ? '管理员' : 'ADMINS'}</span>
            <span className="unified-stat-value">{metrics.admins}</span>
          </div>
        </div>
      </div>

      {/* ── Main Data Panel ── */}
      <div className="um-table-card global-table-container">
        {/* Panel Header */}
        <div className="table-card-header">
          <div className="header-title-wrapper">
            <svg viewBox="0 0 24 24" width="18" height="18" style={{ fill: '#415fff', marginRight: '10px' }}>
              <path d="M4 14h6v-4H4v4zm0 5h6v-4H4v4zM4 9h6V5H4v4zm9 10h7v-4h-7v4zm0-9h7V5h-7v4zm0 5h7v-4h-7v4z"/>
            </svg>
            <h3>{language === 'zh' ? '所有用户' : 'All Users'}</h3>
            <span className="badge-count-users">{users.length} {language === 'zh' ? '用户' : 'users'}</span>
          </div>
        </div>

        {/* Toolbar: Page size entries + Search filter */}
        <div className="table-toolbar">
          <div className="toolbar-left">
            <span className="show-label">{language === 'zh' ? '显示' : 'Show'}</span>
            <select className="select-page-size" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="entries-label">{language === 'zh' ? '条记录' : 'entries'}</span>
          </div>
          <div className="toolbar-right">
            <div className="search-input-wrapper">
              <svg className="search-icon-svg" viewBox="0 0 24 24" width="14" height="14">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input 
                type="text" 
                className="search-quick-filter" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder={language === 'zh' ? '快速筛选表格...' : 'Quick filter table...'}
              />
            </div>
          </div>
        </div>

        {/* Redesigned Users List Table */}
        <div className="um-table-wrapper">
          {filteredUsers.length === 0 ? (
            <div className="no-records-wrapper">
              <p className="no-users">{language === 'zh' ? '未找到用户记录。' : 'No users found.'}</p>
            </div>
          ) : (
            <table className="um-table">
              <thead>
                <tr>
                  <th>{language === 'zh' ? '用户' : 'USER'}</th>
                  <th>{language === 'zh' ? '邮箱' : 'EMAIL'}</th>
                  <th>{language === 'zh' ? '电话' : 'PHONE'}</th>
                  <th>{language === 'zh' ? '角色' : 'ROLE'}</th>
                  <th>{language === 'zh' ? '状态' : 'STATUS'}</th>
                  <th>{language === 'zh' ? '创建时间' : 'CREATED'}</th>
                  <th>{language === 'zh' ? '最后登录' : 'LAST LOGIN'}</th>
                  <th style={{ textAlign: 'right' }}>{language === 'zh' ? '操作' : 'ACTIONS'}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map(user => {
                  const avatarInitials = getInitials(user.full_name);
                  const avatarBgClass = getAvatarColorClass(user.full_name);
                  const isActive = user.session_status === 'active';
                  
                  return (
                    <tr key={user.id}>
                      {/* USER details and avatar initials */}
                      <td className="user-profile-cell">
                        <div className={`user-avatar-initials ${avatarBgClass}`}>
                          {avatarInitials}
                        </div>
                        <div className="user-profile-meta">
                          <span className="user-meta-fullname">{user.full_name}</span>
                          <span className="user-meta-username">ID: {user.username}</span>
                        </div>
                      </td>
                      <td>{user.email || '—'}</td>
                      <td>{user.phone || '—'}</td>
                      <td>
                        <span className={`role-badge-pill role-${user.role}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge-dot ${isActive ? 'active' : 'inactive'}`}>
                          <span className="status-badge-dot-bullet" />
                          {isActive ? (language === 'zh' ? '在线' : 'Active') : (language === 'zh' ? '离线' : 'Inactive')}
                        </span>
                      </td>
                      <td className="time-display-cell">
                        {formatCreatedDate(user.created_at)}
                      </td>
                      <td className="time-display-cell">
                        {user.last_login ? formatCreatedDate(user.last_login) : <span className="text-never">{language === 'zh' ? '从未登录' : 'Never'}</span>}
                      </td>
                      <td className="actions-cell-right">
                        <div className="actions-flex-wrapper">
                          {canEditUser(user) && (
                            <button 
                              type="button"
                              className="btn-action-um edit"
                              title={t('edit')}
                              onClick={() => openEditModal(user)}
                              disabled={loading}
                            >
                              ✏️
                            </button>
                          )}
                          {canEditUser(user) && (
                            <button 
                              type="button"
                              className="btn-action-um password"
                              title={language === 'zh' ? '重置密码' : 'Reset Password'}
                              onClick={() => openPasswordModal(user)}
                              disabled={loading}
                            >
                              🛡️
                            </button>
                          )}
                          {canDeleteUser(user) && (
                            <button 
                              type="button"
                              className="btn-action-um delete"
                              title={t('delete')}
                              onClick={() => handleDelete(user.id)}
                              disabled={loading}
                            >
                              ❌
                            </button>
                          )}
                          {!canEditUser(user) && !canDeleteUser(user) && (
                            <span className="no-permission">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Toolbar Footer */}
        {filteredUsers.length > 0 && (
          <div className="table-pagination-footer">
            <div className="pagination-info">
              {language === 'zh'
                ? `显示第 ${Math.min(filteredUsers.length, (currentPage - 1) * pageSize + 1)} 至 ${Math.min(filteredUsers.length, currentPage * pageSize)} 条，共 ${filteredUsers.length} 条记录`
                : `Showing ${Math.min(filteredUsers.length, (currentPage - 1) * pageSize + 1)} to ${Math.min(filteredUsers.length, currentPage * pageSize)} of ${filteredUsers.length} entries`
              }
            </div>
            <div className="pagination-controls-wrapper">
              <button 
                type="button" 
                className="btn-paginate"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                {language === 'zh' ? '上一页' : 'Previous'}
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNo => (
                <button
                  key={pageNo}
                  type="button"
                  className={`btn-paginate number-btn ${currentPage === pageNo ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNo)}
                >
                  {pageNo}
                </button>
              ))}

              <button 
                type="button" 
                className="btn-paginate"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                {language === 'zh' ? '下一页' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Overlay: Create User ── */}
      {showCreateModal && (
        <div className="global-modal-overlay">
          <div className="modal-content submit-confirm-modal">
            <div className="confirm-modal-icon-wrapper">
              <div className="confirm-modal-icon">
                👤
              </div>
            </div>
            
            <div className="confirm-modal-header">
              <h2>{language === 'zh' ? '添加新用户' : 'Add New User'}</h2>
              <p>{language === 'zh' ? '请填写以下新用户信息以创建账号' : 'Please provide the user details below to create a new account'}</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="modal-form-fields-wrapper">
              <div className="form-field-group-modal">
                <label htmlFor="modal-create-fullname">{t('profile_fullname')} *</label>
                <input 
                  id="modal-create-fullname" 
                  name="fullName" 
                  value={form.fullName} 
                  onChange={handleInputChange} 
                  placeholder={language === 'zh' ? '例如: 张伟' : 'e.g. John Doe'}
                  required 
                />
              </div>

              <div className="form-field-group-modal">
                <label htmlFor="modal-create-username">{t('um_username')} *</label>
                <input 
                  id="modal-create-username" 
                  name="username" 
                  value={form.username} 
                  onChange={handleInputChange} 
                  placeholder={language === 'zh' ? '员工卡号或账号' : 'Employee username or card ID'}
                  required 
                />
              </div>

              <div className="form-field-group-modal">
                <label htmlFor="modal-create-email">{language === 'zh' ? '电子邮件' : 'Email Address'}</label>
                <input 
                  id="modal-create-email" 
                  type="email"
                  name="email" 
                  value={form.email} 
                  onChange={handleInputChange} 
                  placeholder="e.g. name@domain.com"
                />
              </div>

              <div className="form-field-group-modal">
                <label htmlFor="modal-create-phone">{language === 'zh' ? '电话号码' : 'Phone Number'}</label>
                <input 
                  id="modal-create-phone" 
                  name="phone" 
                  value={form.phone} 
                  onChange={handleInputChange} 
                  placeholder="e.g. +91XXXXXXXXXX"
                />
              </div>

              <div className="form-field-group-modal">
                <label htmlFor="modal-create-role">{t('profile_role')}</label>
                <select id="modal-create-role" name="role" value={form.role} onChange={handleInputChange}>
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-field-group-modal">
                <label htmlFor="modal-create-password">{t('um_password')} *</label>
                <div className="modal-password-input-row">
                  <input 
                    id="modal-create-password" 
                    name="password" 
                    type={showFormPassword ? 'text' : 'password'}
                    value={form.password} 
                    onChange={handleInputChange} 
                    required 
                    placeholder={language === 'zh' ? '最少 6 位字符' : 'Minimum 6 characters'}
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn-modal"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                  >
                    {showFormPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-field-group-modal">
                <label htmlFor="modal-create-confirmpassword">{language === 'zh' ? '确认密码 *' : 'Confirm Password *'}</label>
                <input 
                  id="modal-create-confirmpassword" 
                  name="confirmPassword" 
                  type={showFormPassword ? 'text' : 'password'}
                  value={form.confirmPassword} 
                  onChange={handleInputChange} 
                  placeholder={language === 'zh' ? '请再次输入密码' : 'Re-enter password'}
                  required 
                />
              </div>

              <div className="confirm-modal-actions" style={{ marginTop: '1.75rem' }}>
                <button 
                  type="button" 
                  className="confirm-btn-cancel" 
                  onClick={() => setShowCreateModal(false)}
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit" 
                  className="confirm-btn-submit-active"
                  disabled={loading}
                >
                  {loading ? (language === 'zh' ? '创建中...' : 'Creating...') : (language === 'zh' ? '确认创建' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Overlay: Edit User Details ── */}
      {showEditModal && (
        <div className="global-modal-overlay">
          <div className="modal-content submit-confirm-modal">
            <div className="confirm-modal-icon-wrapper">
              <div className="confirm-modal-icon">
                📝
              </div>
            </div>
            
            <div className="confirm-modal-header">
              <h2>{language === 'zh' ? '编辑用户信息' : 'Edit User Info'}</h2>
              <p>{language === 'zh' ? '修改已选中账号的配置信息' : 'Modify configuration settings for the selected account'}</p>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-form-fields-wrapper">
              <div className="form-field-group-modal">
                <label htmlFor="modal-edit-fullname">{t('profile_fullname')} *</label>
                <input 
                  id="modal-edit-fullname" 
                  name="fullName" 
                  value={form.fullName} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>

              <div className="form-field-group-modal">
                <label htmlFor="modal-edit-username">{t('um_username')}</label>
                <input 
                  id="modal-edit-username" 
                  name="username" 
                  value={form.username} 
                  disabled 
                  style={{ background: '#f1f5f9', cursor: 'not-allowed', color: '#94a3b8' }}
                />
              </div>

              <div className="form-field-group-modal">
                <label htmlFor="modal-edit-email">{language === 'zh' ? '电子邮件' : 'Email Address'}</label>
                <input 
                  id="modal-edit-email" 
                  type="email"
                  name="email" 
                  value={form.email} 
                  onChange={handleInputChange} 
                  placeholder="e.g. name@domain.com"
                />
              </div>

              <div className="form-field-group-modal">
                <label htmlFor="modal-edit-phone">{language === 'zh' ? '电话号码' : 'Phone Number'}</label>
                <input 
                  id="modal-edit-phone" 
                  name="phone" 
                  value={form.phone} 
                  onChange={handleInputChange} 
                  placeholder="e.g. +91XXXXXXXXXX"
                />
              </div>

              <div className="form-field-group-modal">
                <label htmlFor="modal-edit-role">{t('profile_role')}</label>
                <select 
                  id="modal-edit-role" 
                  name="role" 
                  value={form.role} 
                  onChange={handleInputChange}
                  disabled={targetUser && targetUser.id === currentUserId}
                >
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="confirm-modal-actions" style={{ marginTop: '1.75rem' }}>
                <button 
                  type="button" 
                  className="confirm-btn-cancel" 
                  onClick={() => setShowEditModal(false)}
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit" 
                  className="confirm-btn-submit-active"
                  disabled={loading}
                >
                  {loading ? (language === 'zh' ? '保存中...' : 'Saving...') : (language === 'zh' ? '保存修改' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Overlay: Reset Password ── */}
      {showPasswordModal && (
        <div className="global-modal-overlay">
          <div className="modal-content submit-confirm-modal">
            <div className="confirm-modal-icon-wrapper">
              <div className="confirm-modal-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
                🔑
              </div>
            </div>
            
            <div className="confirm-modal-header">
              <h2>{language === 'zh' ? '重置用户密码' : 'Reset Password'}</h2>
              <p>
                {language === 'zh' 
                  ? `正在重置用户 "${form.fullName}" 的登录密码` 
                  : `Resetting login credentials for user "${form.fullName}"`
                }
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="modal-form-fields-wrapper">
              <div className="form-field-group-modal">
                <label htmlFor="modal-reset-password">{language === 'zh' ? '新密码 *' : 'New Password *'}</label>
                <div className="modal-password-input-row">
                  <input 
                    id="modal-reset-password" 
                    name="password" 
                    type={showFormPassword ? 'text' : 'password'}
                    value={form.password} 
                    onChange={handleInputChange} 
                    required 
                    placeholder={language === 'zh' ? '最少 6 位字符' : 'Minimum 6 characters'}
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn-modal"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                  >
                    {showFormPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-field-group-modal">
                <label htmlFor="modal-reset-confirmpassword">{language === 'zh' ? '确认新密码 *' : 'Confirm New Password *'}</label>
                <input 
                  id="modal-reset-confirmpassword" 
                  name="confirmPassword" 
                  type={showFormPassword ? 'text' : 'password'}
                  value={form.confirmPassword} 
                  onChange={handleInputChange} 
                  placeholder={language === 'zh' ? '请再次输入新密码' : 'Re-enter new password'}
                  required 
                />
              </div>

              <div className="confirm-modal-actions" style={{ marginTop: '1.75rem' }}>
                <button 
                  type="button" 
                  className="confirm-btn-cancel" 
                  onClick={() => setShowPasswordModal(false)}
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit" 
                  className="confirm-btn-submit-active linestop-theme"
                  disabled={loading}
                >
                  {loading ? (language === 'zh' ? '保存中...' : 'Saving...') : (language === 'zh' ? '确认重置' : 'Start Reset')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
