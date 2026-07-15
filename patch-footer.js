const fs = require('fs');

// 1. Update LoginPage.js footer
let loginPath = 'd:\\AOI_Maintenance_Checksheet-main\\client\\src\\components\\LoginPage.js';
if (fs.existsSync(loginPath)) {
  let loginContent = fs.readFileSync(loginPath, 'utf8');
  loginContent = loginContent.replace(
    /Equipment Maintenance Checksheet &copy; 2026 Vivo/g,
    'AOI Maintenance Checksheet &copy; 2026 VIVO'
  );
  fs.writeFileSync(loginPath, loginContent);
}

// 2. Update App.js footer
let appPath = 'd:\\AOI_Maintenance_Checksheet-main\\client\\src\\App.js';
if (fs.existsSync(appPath)) {
  let appContent = fs.readFileSync(appPath, 'utf8');
  appContent = appContent.replace(
    /Equipment Maintenance Checksheet &copy; 2026 Vivo/g,
    'AOI Maintenance Checksheet &copy; 2026 VIVO'
  );
  fs.writeFileSync(appPath, appContent);
}

console.log("Successfully renamed the footers on all pages!");
