import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import vivoLogo from '../assets/vivo-logo.svg';
import './LoginPage.css';

export default function LoginPage({ onLogin }) {
  const { language, changeLanguage, t } = useLanguage();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleDeveloperClick = (e) => {
    e.preventDefault();
    const url = "http://localhost:8951/?action=talkapi&toUserCode=95003989";
    const newWindow = window.open(url, "_blank");
    
    if (newWindow) {
      const messageListener = (event) => {
        if (event.origin === "http://localhost:8951") {
          newWindow.close();
          window.removeEventListener("message", messageListener);
        }
      };
      window.addEventListener("message", messageListener);

      setTimeout(() => {
        if (newWindow && !newWindow.closed) {
          newWindow.close();
        }
        window.removeEventListener("message", messageListener);
      }, 2500);
    }
  };

  const handleChange = event => {
    const { name, value } = event.target;
    setCredentials(current => ({ ...current, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onLogin({
        username: credentials.username,
        password: credentials.password
      });
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 400) {
        setError(t('login_error_credentials'));
      } else if (status === 429) {
        setError(t('login_error_ratelimit'));
      } else if (!err.response) {
        setError(t('login_error_network'));
      } else {
        setError(t('login_error_server'));
      }
    } finally {
      setLoading(false);
    }
  };

  const EyeOpen = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  const EyeOff = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  return (
    <main className="login-page">
      <section className="login-shell">

        {/* ── Left Panel: Brand Row ── */}
        <div className="login-brand">
          <img src={vivoLogo} alt="vivo" />
          <span aria-hidden="true" />
          <strong>{language === 'zh' ? 'AOI 团队保养检查表管理系统' : 'AOI Team Maintenance Checksheet Management System'}</strong>
        </div>

        {/* ── Left Panel: Hero Copy ── */}
        <div className="login-copy">
          <div className="login-copy-badge">
            {language === 'zh' ? '✦ SMT AOI 团队设备保养系统' : '✦ SMT AOI Team Maintenance System'}
          </div>
          <h1>{t('login_title')}</h1>
          <p>{t('login_desc')}</p>
          <div className="login-copy-features">
            {(language === 'zh'
              ? ['月度与季度保养记录', '设备异常备注与追溯', '实时会话状态管理', '基于角色的访问控制']
              : ['Monthly & quarterly maintenance checks', 'Anomalies recording & traceability', 'Real-time session status management', 'Role-based access control']
            ).map(f => (
              <div className="login-copy-feature" key={f}>
                <span className="login-copy-feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Panel: Form ── */}
        <div className="login-form-panel">

          {/* Language switcher — top of white panel, always visible */}
          <div className="login-form-topbar">
            <div className="login-lang-selector" role="group" aria-label="Language selector">
              <button
                type="button"
                className={`login-lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => changeLanguage('en')}
                aria-pressed={language === 'en'}
              >
                EN
              </button>
              <button
                type="button"
                className={`login-lang-btn ${language === 'zh' ? 'active' : ''}`}
                onClick={() => changeLanguage('zh')}
                aria-pressed={language === 'zh'}
              >
                中文
              </button>
            </div>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-form-heading">
              <h2>{t('login_secure_heading')}</h2>
              <p>{t('login_authorized_only')}</p>
            </div>

            <div className="form-group-accessible">
              <label htmlFor="username-input">{t('login_username')}</label>
              <input
                id="username-input"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                autoComplete="username"
                placeholder={t('login_username_placeholder')}
                required
              />
            </div>

            <div className="form-group-accessible">
              <label htmlFor="password-input">{t('login_password')}</label>
              <div className="password-input-container">
                <input
                  id="password-input"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  placeholder={t('login_password_placeholder')}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !credentials.username || !credentials.password}
            >
              {loading ? t('login_btn_loading') : t('login_btn')}
            </button>

            <div className="login-forgot-pwd">
              {t('login_forgot_pwd')}
            </div>

            <div className="login-error-container">
              {error && <div className="login-error">{error}</div>}
            </div>
          </form>
        </div>

      </section>

      <div className="login-footer-info">
        <p>Equipment Maintenance Checksheet &copy; 2026 Vivo</p>
        <p className="footer-credit">
          Designed, Developed &amp; Maintained by{" "}
          <a 
            href="http://localhost:8951/?action=talkapi&toUserCode=95003989" 
            onClick={handleDeveloperClick}
            className="developer-link"
          >
            Abhinandan Kumar
          </a>
        </p>
      </div>
    </main>
  );
}
