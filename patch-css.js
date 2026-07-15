const fs = require('fs');

let cssPath = 'd:\\AOI_Maintenance_Checksheet-main\\client\\src\\components\\LoginPage.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

// 1. Fix alignment for the left blue panel
cssContent = cssContent.replace(
  /(\.login-copy\s*\{[\s\S]*?)(justify-content:\s*center;)([\s\S]*?\})/,
  '$1justify-content: flex-start;$3'
);
cssContent = cssContent.replace(
  /padding:\s*2\.5rem 2\.25rem 3rem;/,
  'padding: 3rem 2.25rem 3rem;'
);

// 2. Fix alignment for the right white panel
cssContent = cssContent.replace(
  /(\.login-form-panel\s*\{[\s\S]*?)(justify-content:\s*center;)([\s\S]*?\})/,
  '$1justify-content: flex-start;$3'
);
cssContent = cssContent.replace(
  /padding:\s*2\.25rem 2\.5rem 2\.5rem;/,
  'padding: 3.25rem 2.5rem 2.5rem;'
);

fs.writeFileSync(cssPath, cssContent);
console.log("Successfully aligned the login panels!");
