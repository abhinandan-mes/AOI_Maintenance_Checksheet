const fs = require('fs');

const jsFile = 'D:\\AOI_Maintenance_Checksheet-main\\client\\src\\components\\MaintenanceForm.js';
let js = fs.readFileSync(jsFile, 'utf8');

// Find and replace renderExcelChecks function with the original renderChecks
const OLD_EXCEL_START = js.indexOf('  // ── Excel-style 4-column Check Table');
const OLD_EXCEL_END   = js.indexOf('\n  };', OLD_EXCEL_START) + '\n  };'.length;

if (OLD_EXCEL_START === -1) {
  console.error('Could not find renderExcelChecks! Aborting.');
  process.exit(1);
}

const ORIGINAL_RENDER = `  // ── Reusable Check table ──────────────────────────────────────────────────
  const renderChecks = (data, onToggle, mc) => (
    <>
      <div className="check-table">
        <div className="check-table-head">
          <div className="cthead-cycle">{language === 'zh' ? '保养周期' : 'Cycle'}</div>
          <div className="cthead-content">{language === 'zh' ? '保养检查内容' : 'Maintenance Check Content'}</div>
          <div className="cthead-status">{language === 'zh' ? '状态' : 'Status'}</div>
        </div>

        {getMonthlyChecks(mc.key).map((c, idx) => (
          <div
            key={c.key}
            className={\`check-row \${data[c.key] ? 'check-row--done' : ''}\`}
            style={data[c.key] ? { borderLeftColor: mc.color } : {}}
            onClick={() => !isReadOnly && onToggle(c.key)}
          >
            <div className="check-row-cycle">
              {idx === 0 && (
                <span className="cycle-badge" style={{ color: mc.color }}>
                  {language === 'zh' ? '月度' : 'Monthly'}
                </span>
              )}
            </div>
            <div className="check-row-content">
              <span className="check-row-num">{idx + 1}</span>
              <span className="check-row-text">{c.label}</span>
            </div>
            <div className="check-row-status">
              <span
                className={\`check-mark \${data[c.key] ? 'check-mark--done' : ''}\`}
                style={data[c.key] ? { background: mc.color, borderColor: mc.color, color: 'white' } : {}}
              >
                {data[c.key] ? '\\u2713' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      {isThirdMonth && (
        <div className="check-table check-table--quarterly">
          {getQuarterlyChecks(mc.key).map((c, idx) => (
            <div
              key={c.key}
              className={\`check-row \${data[c.key] ? 'check-row--done' : ''}\`}
              style={data[c.key] ? { borderLeftColor: '#6d28d9' } : {}}
              onClick={() => !isReadOnly && onToggle(c.key)}
            >
              <div className="check-row-cycle">
                {idx === 0 && (
                  <span className="cycle-badge cycle-badge--quarterly" style={{ color: '#6d28d9' }}>
                    {language === 'zh' ? '季度' : 'Quarterly'}
                  </span>
                )}
              </div>
              <div className="check-row-content">
                <span className="check-row-num">{getMonthlyChecks(mc.key).length + idx + 1}</span>
                <span className="check-row-text">{c.label}</span>
              </div>
              <div className="check-row-status">
                <span
                  className={\`check-mark \${data[c.key] ? 'check-mark--done' : ''}\`}
                  style={data[c.key] ? { background: '#6d28d9', borderColor: '#6d28d9', color: 'white' } : {}}
                >
                  {data[c.key] ? '\\u2713' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );`;

js = js.slice(0, OLD_EXCEL_START) + ORIGINAL_RENDER + js.slice(OLD_EXCEL_END);

// Fix the call site back to renderChecks
js = js.replace(
  '{renderExcelChecks(data, (key) => toggleCheck(mc.key, key), mc)}',
  '{renderChecks(data, (key) => toggleCheck(mc.key, key), mc)}'
);

fs.writeFileSync(jsFile, js, 'utf8');
console.log('✅ Reverted to original renderChecks successfully.');
