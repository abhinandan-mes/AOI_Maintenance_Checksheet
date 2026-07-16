const fs = require('fs');

let schemaPath = 'd:\\AOI_Maintenance_Checksheet-main\\server\\config\\schema.js';
if (fs.existsSync(schemaPath)) {
  let content = fs.readFileSync(schemaPath, 'utf8');
  // Comment out the migrate deploy line
  content = content.replace(
    /execSync\('npx prisma migrate deploy', { stdio: 'inherit' }\);/g,
    '// execSync(\'npx prisma migrate deploy\', { stdio: \'inherit\' });'
  );
  fs.writeFileSync(schemaPath, content);
  console.log("Successfully patched schema.js to prevent migration crash on startup.");
} else {
  console.error("schema.js not found.");
}
