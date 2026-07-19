import React, { useEffect, useState } from 'react';
import apiService from '../services/api';
import './LineManagement.css';
import { useLanguage } from '../contexts/LanguageContext';

export default function LineManagement({ currentUser }) {
  const { language } = useLanguage();
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [updatingLine, setUpdatingLine] = useState(null); // line being toggled

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchLines();
  }, []);

  const fetchLines = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiService.getAllLines();
      setLines(res.data.data || []);
    } catch (err) {
      setError(language === 'zh' ? '无法加载产线数据' : 'Failed to load line data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (line, currentStatus) => {
    if (!isAdmin) return;
    const newStatus = !currentStatus;
    setUpdatingLine(line);
    setSuccessMsg('');
    setError('');

    try {
      await apiService.updateLineStatus(line, { is_installed: newStatus });
      setLines(prev =>
        prev.map(l => l.line === line ? { ...l, is_installed: newStatus } : l)
      );
      const label = newStatus
        ? (language === 'zh' ? '已安装' : 'Installed')
        : (language === 'zh' ? '未安装' : 'Not Installed');
      setSuccessMsg(
        language === 'zh'
          ? `产线 ${line} 已标记为【${label}】`
          : `Line ${line} marked as ${label}`
      );
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(
        language === 'zh'
          ? `更新产线 ${line} 状态失败`
          : `Failed to update Line ${line} status`
      );
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdatingLine(null);
    }
  };

  const installedCount = lines.filter(l => l.is_installed).length;
  const notInstalledCount = lines.filter(l => !l.is_installed).length;

  if (loading) {
    return (
      <div className="line-mgmt-container">
        <div className="line-mgmt-loading">
          {language === 'zh' ? '⏳ 加载中...' : '⏳ Loading line data...'}
        </div>
      </div>
    );
  }

  return (
    <div className="line-mgmt-container">

      {/* Header */}
      <div className="line-mgmt-header">
        <div className="line-mgmt-header-left">
          <h1>{language === 'zh' ? '产线管理' : 'Line Management'}</h1>
          <p>
            {language === 'zh'
              ? '管理各产线的安装状态，未安装产线将不显示在填报表单中。'
              : 'Manage installation status for each production line. Uninstalled lines are hidden from submission forms.'}
          </p>
        </div>
        <div className="line-mgmt-summary">
          <span className="summary-badge installed">
            ✅ {installedCount} {language === 'zh' ? '已安装' : 'Installed'}
          </span>
          <span className="summary-badge not-installed">
            ⛔ {notInstalledCount} {language === 'zh' ? '未安装' : 'Not Installed'}
          </span>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && <div className="line-mgmt-alert success">✅ {successMsg}</div>}
      {error      && <div className="line-mgmt-alert error">❌ {error}</div>}

      {/* Line Cards Grid */}
      <div className="line-mgmt-grid">
        {lines.map(({ line, is_installed, updated_by, updated_at }) => (
          <div
            key={line}
            className={`line-card ${is_installed ? 'installed' : 'not-installed'}`}
          >
            <div className="line-card-top">
              <span className="line-number">{line}</span>
              <span className={`line-status-badge ${is_installed ? 'installed' : 'not-installed'}`}>
                {is_installed
                  ? (language === 'zh' ? '已安装' : 'Installed')
                  : (language === 'zh' ? '未安装' : 'Not Installed')}
              </span>
            </div>

            <div className="line-card-bottom">
              <span className="line-toggle-label">
                {is_installed
                  ? (language === 'zh' ? '点击停用' : 'Click to disable')
                  : (language === 'zh' ? '点击启用' : 'Click to enable')}
              </span>
              <label className="toggle-switch" title={isAdmin ? '' : (language === 'zh' ? '无权限' : 'No permission')}>
                <input
                  type="checkbox"
                  checked={is_installed}
                  disabled={!isAdmin || updatingLine === line}
                  onChange={() => handleToggle(line, is_installed)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {updated_by && (
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '-0.5rem' }}>
                {language === 'zh' ? '更新者: ' : 'By: '}{updated_by}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
