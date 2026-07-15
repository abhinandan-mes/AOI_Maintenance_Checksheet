const fs = require('fs');

// 1. Update LoginPage.js
let jsPath = 'd:\\AOI_Maintenance_Checksheet-main\\client\\src\\components\\LoginPage.js';
let jsContent = fs.readFileSync(jsPath, 'utf8');

// Wrap the return block to separate the footer from the main grid
jsContent = jsContent.replace(
  /<main className="login-page">\s*(<section className="login-shell">[\s\S]*?<\/section>)\s*(<div className="login-footer-info">[\s\S]*?<\/div>)\s*<\/main>/,
  `<div className="login-layout">\n      <main className="login-page">\n        $1\n      </main>\n\n      $2\n    </div>`
);
fs.writeFileSync(jsPath, jsContent);


// 2. Update LoginPage.css
let cssPath = 'd:\\AOI_Maintenance_Checksheet-main\\client\\src\\components\\LoginPage.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

// Add .login-layout
if (!cssContent.includes('.login-layout')) {
  cssContent = `.login-layout {\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n  background: #eef1f8;\n}\n\n` + cssContent;
}

// Update .login-page
cssContent = cssContent.replace(
  /\.login-page\s*\{[\s\S]*?\}/,
  `.login-page {\n  flex: 1;\n  display: grid;\n  place-items: center;\n  padding: 2rem 2rem 1rem 2rem;\n  background: transparent;\n}`
);

// Update footer styling to match the flex bottom behavior
cssContent = cssContent.replace(
  /\.login-footer-info\s*\{[\s\S]*?\}/,
  `.login-footer-info {\n  text-align: center;\n  font-size: 0.78rem;\n  color: #64748b;\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  line-height: 1.4;\n  padding: 1.5rem;\n  background: transparent;\n}`
);

fs.writeFileSync(cssPath, cssContent);
console.log("Successfully patched the login layout!");
