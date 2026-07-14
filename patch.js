const fs = require('fs');

// 1. Update Backend (auth.js)
let authPath = 'd:\\AOI_Maintenance_Checksheet-main\\server\\routes\\auth.js';
let authContent = fs.readFileSync(authPath, 'utf8');

// Fix: Manager can assign/edit/delete up to manager role
authContent = authContent.replace(
  /req\.user\.role === 'admin'\s*\?\s*\['manager', 'engineer', 'technician', 'inspector'\]/g,
  `req.user.role === 'admin' || req.user.role === 'manager'\n      ? ['manager', 'engineer', 'technician', 'inspector']`
);
authContent = authContent.replace(
  /\['engineer', 'technician', 'inspector'\]\.includes\(targetUser\.role\)/g,
  `['manager', 'engineer', 'technician', 'inspector'].includes(targetUser.role)`
);

// Fix: Log username during USER_DELETE
authContent = authContent.replace(
  /select: \{\s*role: true\s*\}/g,
  `select: { role: true, username: true }`
);
authContent = authContent.replace(
  /`Deleted user account: ID \$\{targetId\}`/g,
  `\`Deleted user account: \${targetUser.username} (ID \${targetId})\``
);
fs.writeFileSync(authPath, authContent);

// 2. Update Frontend (UserManagement.js)
let umPath = 'd:\\AOI_Maintenance_Checksheet-main\\client\\src\\components\\UserManagement.js';
let umContent = fs.readFileSync(umPath, 'utf8');

const oldRoleOptions = /const roleOptions = useMemo\(\(\) => isSuperAdmin \|\| isManager[\s\S]*?: baseRoleOptions, \[isSuperAdmin, isManager, baseRoleOptions, t\]\);/;
const newRoleOptions = `const roleOptions = useMemo(() => {
    if (isSuperAdmin) {
      return [
        { value: 'super_admin', label: t('um_role_super_admin') },
        { value: 'manager', label: t('um_role_manager') },
        { value: 'engineer', label: t('um_role_engineer') },
        ...baseRoleOptions
      ];
    } else if (isManager) {
      return [
        { value: 'manager', label: t('um_role_manager') },
        { value: 'engineer', label: t('um_role_engineer') },
        ...baseRoleOptions
      ];
    }
    return baseRoleOptions;
  }, [isSuperAdmin, isManager, baseRoleOptions, t]);`;

umContent = umContent.replace(oldRoleOptions, newRoleOptions);
fs.writeFileSync(umPath, umContent);

// 3. Update Frontend (ActivityLog.js)
let alPath = 'd:\\AOI_Maintenance_Checksheet-main\\client\\src\\components\\ActivityLog.js';
let alContent = fs.readFileSync(alPath, 'utf8');

const oldCreateLabel = `} else if (sys.event_type === 'USER_CREATE') {
          labelEn = 'User Created';
          labelZh = '用户创建';`;
const newCreateLabel = `} else if (sys.event_type === 'USER_CREATE') {
          const target = sys.details ? (sys.details.match(/Created user: ([^\\s]+)/) || [])[1] : null;
          labelEn = target ? \`User Created: \${target}\` : 'User Created';
          labelZh = target ? \`创建用户: \${target}\` : '用户创建';`;

const oldDeleteLabel = `} else if (sys.event_type === 'USER_DELETE') {
          labelEn = 'User Deleted';
          labelZh = '用户帐号删除';`;
const newDeleteLabel = `} else if (sys.event_type === 'USER_DELETE') {
          const target = sys.details ? (sys.details.match(/Deleted user account: ([^\\s\\(]+)/) || [])[1] : null;
          labelEn = target ? \`User Deleted: \${target}\` : 'User Deleted';
          labelZh = target ? \`用户删除: \${target}\` : '用户帐号删除';`;

alContent = alContent.replace(oldCreateLabel, newCreateLabel);
alContent = alContent.replace(oldDeleteLabel, newDeleteLabel);
fs.writeFileSync(alPath, alContent);

console.log("Successfully patched all files!");
