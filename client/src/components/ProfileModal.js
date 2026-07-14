import React, { useState } from 'react';
import apiService from '../services/api';
import './ProfileModal.css';
import { useLanguage } from '../contexts/LanguageContext';

export default function ProfileModal({ user, onClose, onLogout }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changePasswordEnabled, setChangePasswordEnabled] = useState(false);
  const [showPwd, setShowPwd] = useState({ current: false, newp: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!changePasswordEnabled) return;
    if (form.newPassword !== form.confirmPassword) {
      setError(t('profile_pwd_match_err'));
      return;
    }
    if (form.newPassword.length < 6) {
      setError(t('profile_pwd_length_err'));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      setSuccess(t('profile_success'));
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangePasswordEnabled(false);
    } catch (err) {
      setError(err.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('profile_title')}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">&times;</button>
        </div>
        <div className="modal-body">
          <div className="user-profile-summary">
            <div className="profile-details-left">
              <p><strong>{t('profile_fullname')}:</strong> {user.full_name}</p>
              <p><strong>{t('profile_username')}:</strong> @{user.username}</p>
              <p><strong>{t('profile_role')}:</strong> <span className={`role-badge role-${user.role}`}>{t('um_role_' + user.role)}</span></p>
            </div>
            <button type="button" className="modal-logout-btn" onClick={() => { onClose(); onLogout(); }}>
              🚪 {t('nav_logout')}
            </button>
          </div>
          <hr />
          <form onSubmit={handleSubmit} className="change-password-form">
            <div className="change-password-header">
              <h3>{t('profile_change_pwd')}</h3>
              {!changePasswordEnabled && (
                <button
                  type="button"
                  className="btn-enable-change"
                  onClick={() => setChangePasswordEnabled(true)}
                >
                  🔑 {t('profile_change_pwd')}
                </button>
              )}
            </div>
            <label className={!changePasswordEnabled ? 'disabled-label' : ''} htmlFor="profile-current-pwd">
              {t('profile_current_pwd')}
              <div className="password-input-container">
                <input
                  id="profile-current-pwd"
                  type={showPwd.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  placeholder={t('profile_current_pwd_placeholder')}
                  required={changePasswordEnabled}
                  disabled={!changePasswordEnabled}
                />
                {changePasswordEnabled && (
                  <button type="button" className="password-toggle-btn" onClick={() => setShowPwd(p => ({ ...p, current: !p.current }))} aria-label="Toggle password">
                    {showPwd.current ? '🙈' : '👁️'}
                  </button>
                )}
              </div>
            </label>
            <label className={!changePasswordEnabled ? 'disabled-label' : ''} htmlFor="profile-new-pwd">
              {t('profile_new_pwd')}
              <div className="password-input-container">
                <input
                  id="profile-new-pwd"
                  type={showPwd.newp ? 'text' : 'password'}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder={t('profile_new_pwd_placeholder')}
                  required={changePasswordEnabled}
                  disabled={!changePasswordEnabled}
                />
                {changePasswordEnabled && (
                  <button type="button" className="password-toggle-btn" onClick={() => setShowPwd(p => ({ ...p, newp: !p.newp }))} aria-label="Toggle password">
                    {showPwd.newp ? '🙈' : '👁️'}
                  </button>
                )}
              </div>
            </label>
            <label className={!changePasswordEnabled ? 'disabled-label' : ''} htmlFor="profile-confirm-pwd">
              {t('profile_confirm_pwd')}
              <div className="password-input-container">
                <input
                  id="profile-confirm-pwd"
                  type={showPwd.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder={t('profile_confirm_pwd_placeholder')}
                  required={changePasswordEnabled}
                  disabled={!changePasswordEnabled}
                />
                {changePasswordEnabled && (
                  <button type="button" className="password-toggle-btn" onClick={() => setShowPwd(p => ({ ...p, confirm: !p.confirm }))} aria-label="Toggle password">
                    {showPwd.confirm ? '🙈' : '👁️'}
                  </button>
                )}
              </div>
            </label>
            {error && <div className="profile-error">{error}</div>}
            {success && <div className="profile-success">{success}</div>}
            <div className="modal-actions">
              {changePasswordEnabled && (
                <button type="submit" disabled={loading} className="btn-save">
                  {loading ? t('profile_btn_updating') : t('profile_btn_update')}
                </button>
              )}
              <button type="button" onClick={onClose} className="btn-cancel">
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
