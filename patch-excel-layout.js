
const fs = require('fs');
const path = require('path');

const jsFile = 'D:\\AOI_Maintenance_Checksheet-main\\client\\src\\components\\MaintenanceForm.js';
const cssFile = 'D:\\AOI_Maintenance_Checksheet-main\\client\\src\\components\\MaintenanceForm.css';

// ── 1. PATCH JS: replace renderChecks with renderExcelChecks ──────────────
let js = fs.readFileSync(jsFile, 'utf8');

const OLD_RENDER = `  // ── Reusable Check table ──────────────────────────────────────────────────
  const renderChecks = (data, onToggle, mc) => (`;

const NEW_RENDER_FN = `  // ── Excel-style 4-column Check Table ─────────────────────────────────────
  // Columns: Cycle | Maintenance Check Content | First Month | Second Month | Third Month
  // Only the currently selected period column is interactive; others are greyed out placeholders.
  const renderExcelChecks = (data, onToggle, mc) => {
    const monthlyChecks = getMonthlyChecks(mc.key);
    const quarterlyChecks = getQuarterlyChecks(mc.key);
    const periods = ['First Month', 'Second Month', 'Third Month'];
    const activePeriod = common.period;

    const monthlyHeader = language === 'zh'
      ? '月度保养结果确认记录：'
      : '__ Monthly maintenance result confirmation record:';

    const quarterlyHeader = language === 'zh'
      ? '季度保养结果确认记录：'
      : 'Quarterly Maintenance Result Confirmation Record:';

    return (
      <div className="excel-table-wrap">
        {/* ── TABLE HEADER ─────────────────────────────── */}
        <div className="excel-table-grid">
          <div className="excel-th excel-th-cycle">{language === 'zh' ? '保养周期' : 'Cycle'}</div>
          <div className="excel-th excel-th-content">{language === 'zh' ? '保养检查内容' : 'Maintenance Check Content'}</div>
          {periods.map(p => (
            <div
              key={p}
              className={\`excel-th excel-th-month \${p === activePeriod ? 'excel-th-month--active' : 'excel-th-month--inactive'}\`}
              style={p === activePeriod ? { background: mc.colorLight, color: mc.color, borderTop: \`3px solid \${mc.color}\` } : {}}
            >
              {p === 'First Month'  && (language === 'zh' ? '第一个月' : 'First Month')}
              {p === 'Second Month' && (language === 'zh' ? '第二个月' : 'Second Month')}
              {p === 'Third Month'  && (language === 'zh' ? '第三个月' : 'Third Month')}
              {p === activePeriod && <span className="excel-active-dot" style={{ background: mc.color }} />}
            </div>
          ))}
        </div>

        {/* ── MONTHLY RESULT HEADER ROW ─────────────────── */}
        <div className="excel-table-grid excel-section-header-row">
          <div className="excel-cycle-cell excel-cycle-monthly" style={{ color: mc.color }}>
            {language === 'zh' ? '月度' : 'Monthly'}
          </div>
          <div className="excel-content-cell excel-content-cell--filler" />
          {periods.map(p => (
            <div
              key={p}
              className={\`excel-month-col-header \${p === activePeriod ? 'excel-month-col-header--active' : 'excel-month-col-header--inactive'}\`}
              style={p === activePeriod ? { color: mc.color } : {}}
            >
              {monthlyHeader}
            </div>
          ))}
        </div>

        {/* ── MONTHLY CHECK ROWS ────────────────────────── */}
        {monthlyChecks.map((c, idx) => (
          <div key={c.key} className="excel-table-grid excel-check-row">
            <div className="excel-cycle-cell" />
            <div className="excel-content-cell">
              <span className="excel-content-num">{idx + 1}.</span>
              <span className="excel-content-text">{c.label}</span>
            </div>
            {periods.map(p => {
              const isActive = p === activePeriod;
              const isChecked = isActive && data[c.key];
              return (
                <div
                  key={p}
                  className={\`excel-month-cell \${isActive ? 'excel-month-cell--active' : 'excel-month-cell--inactive'}\`}
                  onClick={() => isActive && !isReadOnly && onToggle(c.key)}
                  title={isActive && !isReadOnly ? (isChecked ? 'Click to uncheck' : 'Click to check') : ''}
                >
                  <span
                    className={\`excel-checkbox \${isActive ? 'excel-checkbox--active' : 'excel-checkbox--grey'} \${isChecked ? 'excel-checkbox--checked' : ''}\`}
                    style={isChecked ? { background: mc.color, borderColor: mc.color } : {}}
                  >
                    {isChecked ? '\\u2713' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        ))}

        {/* ── MONTHLY REMARKS ROW ───────────────────────── */}
        <div className="excel-table-grid excel-remarks-row">
          <div className="excel-cycle-cell" />
          <div className="excel-content-cell excel-content-cell--filler" />
          {periods.map(p => (
            <div key={p} className={\`excel-month-footer-cell \${p === activePeriod ? 'excel-month-footer-cell--active' : 'excel-month-footer-cell--inactive'}\`}>
              <span className="excel-footer-label">{language === 'zh' ? '备注：' : 'Remarks:'}</span>
            </div>
          ))}
        </div>

        {/* ── MONTHLY DATE & SIGNATURE ROW ─────────────── */}
        <div className="excel-table-grid excel-date-row">
          <div className="excel-cycle-cell" />
          <div className="excel-content-cell excel-content-cell--filler" />
          {periods.map(p => (
            <div key={p} className={\`excel-month-footer-cell excel-month-footer-cell--datesig \${p === activePeriod ? 'excel-month-footer-cell--active' : 'excel-month-footer-cell--inactive'}\`}>
              <div className="excel-footer-date">{language === 'zh' ? '保养日期：_____' : 'Maintenance date: _____'}</div>
              <div className="excel-footer-sig">{language === 'zh' ? '人员签字：___' : 'Personnel signature: ___'}</div>
            </div>
          ))}
        </div>

        {/* ── QUARTERLY SECTION (Third Month only) ─────── */}
        {isThirdMonth && (
          <>
            <div className="excel-table-grid excel-quarterly-header-row">
              <div className="excel-cycle-cell excel-cycle-quarterly">
                {language === 'zh' ? '季度' : 'Quarterly'}
              </div>
              <div className="excel-content-cell excel-content-cell--filler" />
              <div className="excel-quarterly-block-header">
                {quarterlyHeader}
              </div>
            </div>

            {quarterlyChecks.map((c, idx) => (
              <div key={c.key} className="excel-table-grid excel-check-row excel-check-row--quarterly">
                <div className="excel-cycle-cell" />
                <div className="excel-content-cell">
                  <span className="excel-content-num excel-content-num--quarterly">{idx + 1}.</span>
                  <span className="excel-content-text excel-content-text--quarterly">{c.label}</span>
                </div>
                <div className="excel-month-cell excel-month-cell--inactive excel-quarterly-na">
                  <span className="excel-quarterly-na-label">—</span>
                </div>
                <div className="excel-month-cell excel-month-cell--inactive excel-quarterly-na">
                  <span className="excel-quarterly-na-label">—</span>
                </div>
                <div
                  className="excel-month-cell excel-month-cell--active excel-month-cell--quarterly"
                  onClick={() => !isReadOnly && onToggle(c.key)}
                >
                  <span
                    className={\`excel-checkbox excel-checkbox--active \${data[c.key] ? 'excel-checkbox--checked excel-checkbox--quarterly-checked' : ''}\`}
                    style={data[c.key] ? { background: '#6d28d9', borderColor: '#6d28d9' } : { borderColor: '#7c3aed' }}
                  >
                    {data[c.key] ? '\\u2713' : ''}
                  </span>
                </div>
              </div>
            ))}

            <div className="excel-table-grid excel-quarterly-footer-row">
              <div className="excel-cycle-cell" />
              <div className="excel-content-cell excel-content-cell--filler" />
              <div className="excel-quarterly-footer-block">
                <span className="excel-footer-label">{language === 'zh' ? '备注：' : 'Remarks:'}</span>
                <div className="excel-footer-date" style={{ marginTop: '8px' }}>{language === 'zh' ? '保养日期：_________' : 'Maintenance date: _________'}</div>
                <div className="excel-footer-sig">{language === 'zh' ? '人员签字：______' : 'Personnel signature: ______'}</div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };`;

// Find the old function start and end, replace it
const oldStart = js.indexOf('  // ── Reusable Check table ──────────────────────────────────────────────────');
const oldEnd = js.indexOf('\n  );\n', oldStart) + '\n  );\n'.length;

if (oldStart === -1) {
  console.error('Could not find old renderChecks function start!');
  process.exit(1);
}

js = js.slice(0, oldStart) + NEW_RENDER_FN + js.slice(oldEnd);

// Replace the renderChecks call inside the mcard-body
js = js.replace(
  '{renderChecks(data, (key) => toggleCheck(mc.key, key), mc)}',
  '{renderExcelChecks(data, (key) => toggleCheck(mc.key, key), mc)}'
);

fs.writeFileSync(jsFile, js, 'utf8');
console.log('✅ MaintenanceForm.js patched successfully.');

// ── 2. PATCH CSS: add Excel table styles ─────────────────────────────────
const EXCEL_CSS = `

/* ═══════════════════════════════════════════════════════════════════
   EXCEL-STYLE CHECKSHEET TABLE
   Matches physical SMT AOI/SPI maintenance inspection Excel sheet
   Columns: Cycle | Content | First Month | Second Month | Third Month
   ═══════════════════════════════════════════════════════════════════ */

.excel-table-wrap {
  border-top: 1px solid #e2e8f0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Base grid: 5 columns — cycle | content | m1 | m2 | m3 */
.excel-table-grid {
  display: grid;
  grid-template-columns: 90px 1fr 1fr 1fr 1fr;
  min-width: 700px;
  border-bottom: 1px solid #e9edf2;
}

/* ── TABLE HEADER ROW ──────────────────────────────────────────────── */
.excel-th {
  padding: 10px 12px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #64748b;
  background: #f8fafc;
  border-right: 1px solid #e9edf2;
  display: flex;
  align-items: center;
  gap: 6px;
}

.excel-th-cycle  { border-right: 1px solid #e9edf2; justify-content: center; }
.excel-th-content { border-right: 1px solid #e9edf2; }

.excel-th-month {
  justify-content: center;
  font-size: 11px;
  letter-spacing: 0.5px;
  flex-direction: column;
  gap: 4px;
  text-align: center;
  position: relative;
}

.excel-th-month--active {
  font-weight: 800;
  border-top: 3px solid;
}

.excel-th-month--inactive {
  color: #cbd5e1;
  background: #fafbfc;
}

.excel-active-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

/* ── MONTHLY SECTION HEADER ROW ───────────────────────────────────── */
.excel-section-header-row {
  background: #fafbfc;
  border-bottom: 1px solid #e9edf2;
}

.excel-cycle-cell {
  padding: 8px 6px;
  border-right: 1px solid #e9edf2;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.excel-cycle-monthly {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding-top: 12px;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  min-height: 48px;
  justify-content: center;
  align-items: center;
}

.excel-cycle-quarterly {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding-top: 12px;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  color: #6d28d9;
  min-height: 40px;
  justify-content: center;
  align-items: center;
}

.excel-content-cell--filler {
  border-right: 1px solid #e9edf2;
}

.excel-month-col-header {
  padding: 8px 12px;
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.45;
  border-right: 1px solid #e9edf2;
}

.excel-month-col-header--active {
  background: #fdfeff;
}

.excel-month-col-header--inactive {
  color: #b0bec5;
  background: #fafbfc;
}

/* ── MONTHLY CHECK ROWS ────────────────────────────────────────────── */
.excel-check-row {
  background: white;
  transition: background 0.1s ease;
  min-height: 44px;
}

.excel-check-row:hover {
  background: #fafcff;
}

.excel-check-row--quarterly {
  background: #fdf8ff;
}
.excel-check-row--quarterly:hover {
  background: #f5f0fe;
}

.excel-content-cell {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 12px;
  border-right: 1px solid #e9edf2;
  min-height: 44px;
}

.excel-content-num {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  min-width: 16px;
  flex-shrink: 0;
  padding-top: 1px;
  font-variant-numeric: tabular-nums;
}

.excel-content-num--quarterly {
  color: #7c3aed;
}

.excel-content-text {
  font-size: 12.5px;
  font-weight: 500;
  color: #334155;
  line-height: 1.5;
}

.excel-content-text--quarterly {
  color: #5b21b6;
  font-weight: 600;
}

/* ── MONTH CELLS (checkbox columns) ────────────────────────────────── */
.excel-month-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  border-right: 1px solid #e9edf2;
  min-height: 44px;
  position: relative;
}

.excel-month-cell--active {
  background: white;
  cursor: pointer;
}

.excel-month-cell--active:hover {
  background: #f0f9ff;
}

.excel-month-cell--inactive {
  background: #f7f8fa;
  cursor: default;
}

.excel-month-cell--quarterly {
  background: #faf5ff;
  cursor: pointer;
}

.excel-month-cell--quarterly:hover {
  background: #f3e8ff;
}

/* The checkbox element */
.excel-checkbox {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 2px solid #e2e8f0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  color: white;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
  user-select: none;
}

.excel-checkbox--active {
  border-color: #94a3b8;
}

.excel-checkbox--grey {
  border-color: #d4d8de;
  background: #f7f8fa;
}

.excel-checkbox--checked {
  transform: scale(1.1);
  box-shadow: 0 3px 10px rgba(0,0,0,0.15);
}

.excel-checkbox--quarterly-checked {
  box-shadow: 0 3px 10px rgba(109,40,217,0.25);
}

/* ── REMARKS ROW ───────────────────────────────────────────────────── */
.excel-remarks-row {
  background: #fffdf5;
  min-height: 36px;
}

.excel-month-footer-cell {
  padding: 8px 12px;
  border-right: 1px solid #e9edf2;
  display: flex;
  align-items: center;
  font-size: 11.5px;
}

.excel-month-footer-cell--active {
  background: #fffdf5;
}

.excel-month-footer-cell--inactive {
  background: #f7f8fa;
}

.excel-month-footer-cell--datesig {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 10px 12px;
}

.excel-footer-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #64748b;
}

.excel-footer-date {
  font-size: 11px;
  color: #64748b;
  font-family: monospace;
}

.excel-footer-sig {
  font-size: 11px;
  color: #64748b;
  font-family: monospace;
}

/* ── DATE ROW ──────────────────────────────────────────────────────── */
.excel-date-row {
  border-bottom: 2px solid #e2e8f0;
}

/* ── QUARTERLY SECTION ─────────────────────────────────────────────── */
.excel-quarterly-header-row {
  background: #faf5ff;
  border-top: 2px dashed #ddd6fe;
}

.excel-quarterly-block-header {
  grid-column: 3 / 6;
  padding: 10px 14px;
  font-size: 11.5px;
  font-weight: 700;
  color: #6d28d9;
  background: #faf5ff;
  border-left: 1px solid #e9edf2;
}

.excel-quarterly-na {
  background: #f5f3ff;
}

.excel-quarterly-na-label {
  font-size: 14px;
  color: #c4b5fd;
  font-weight: 300;
}

.excel-quarterly-footer-row {
  background: #faf5ff;
  border-top: 1px solid #ddd6fe;
}

.excel-quarterly-footer-block {
  grid-column: 3 / 6;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-left: 1px solid #e9edf2;
}

/* ── RESPONSIVE ────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .excel-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .excel-table-grid {
    min-width: 640px;
  }
  .excel-th, .excel-content-cell, .excel-month-footer-cell {
    padding: 6px 8px;
  }
  .excel-content-text {
    font-size: 11.5px;
  }
}
`;

let css = fs.readFileSync(cssFile, 'utf8');
// Append the new CSS if it hasn't been added already
if (!css.includes('.excel-table-wrap')) {
  css += EXCEL_CSS;
  fs.writeFileSync(cssFile, css, 'utf8');
  console.log('✅ MaintenanceForm.css patched successfully.');
} else {
  console.log('ℹ️  CSS already contains excel styles, skipping.');
}

console.log('Done! All patches applied successfully.');
