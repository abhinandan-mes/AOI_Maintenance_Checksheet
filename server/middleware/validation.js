const validateString = (val, maxLen, isRequired = false) => {
  if (val === undefined || val === null || val === '') {
    return isRequired ? 'is required' : null;
  }
  if (typeof val !== 'string') {
    return 'must be a string';
  }
  if (val.trim().length === 0 && isRequired) {
    return 'cannot be empty';
  }
  if (val.length > maxLen) {
    return `cannot exceed ${maxLen} characters`;
  }
  return null;
};

const validateDate = (val) => {
  if (!val) return 'is required';
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    return 'must be a valid date';
  }
  return null;
};

const validateCreateUser = (req, res, next) => {
  const { username, password, fullName, role } = req.body;
  const errors = {};

  const userErr = validateString(username, 100, true);
  if (userErr) errors.username = userErr;
  else if (username.trim().length < 3) errors.username = 'must be at least 3 characters long';

  const passErr = validateString(password, 100, true);
  if (passErr) errors.password = passErr;
  else if (password.length < 6) errors.password = 'must be at least 6 characters long';

  const nameErr = validateString(fullName, 150, true);
  if (nameErr) errors.fullName = nameErr;

  const roleErr = validateString(role, 50, true);
  if (roleErr) errors.role = roleErr;
  else if (!['super_admin', 'admin', 'inspector', 'technician', 'operator', 'engineer', 'manager'].includes(role.trim())) {
    errors.role = 'is invalid';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, error: 'Validation failed', validationErrors: errors });
  }

  next();
};

const validateUpdateUser = (req, res, next) => {
  const { username, password, fullName, role } = req.body;
  const errors = {};

  if (username !== undefined) {
    const err = validateString(username, 100, true);
    if (err) errors.username = err;
    else if (username.trim().length < 3) errors.username = 'must be at least 3 characters long';
  }

  if (password !== undefined && password !== '') {
    const err = validateString(password, 100, true);
    if (err) errors.password = err;
    else if (password.length < 6) errors.password = 'must be at least 6 characters long';
  }

  if (fullName !== undefined) {
    const err = validateString(fullName, 150, true);
    if (err) errors.fullName = err;
  }

  if (role !== undefined) {
    const err = validateString(role, 50, true);
    if (err) errors.role = err;
    else if (!['super_admin', 'admin', 'inspector', 'technician', 'operator', 'engineer', 'manager'].includes(role.trim())) {
      errors.role = 'is invalid';
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, error: 'Validation failed', validationErrors: errors });
  }

  next();
};

const validateMaintenanceRecord = (req, res, next) => {
  const { equipment_type, machine_name, machine_type, machine_asset_no, line, date, period, submitted_by } = req.body;
  const errors = {};

  const typeErr = validateString(equipment_type, 50, true);
  if (typeErr) errors.equipment_type = typeErr;
  else if (!['AOI', 'SPI', 'PRE_AOI', 'POST_AOI', 'LASER'].includes(equipment_type)) {
    errors.equipment_type = 'must be AOI, SPI, PRE_AOI, POST_AOI or LASER';
  }

  const nameErr = validateString(machine_name, 100, true);
  if (nameErr) errors.machine_name = nameErr;

  const mTypeErr = validateString(machine_type, 100, true);
  if (mTypeErr) errors.machine_type = mTypeErr;

  const assetErr = validateString(machine_asset_no, 100, true);
  if (assetErr) errors.machine_asset_no = assetErr;

  const lineErr = validateString(line, 50, true);
  if (lineErr) errors.line = lineErr;

  const dateErr = validateDate(date);
  if (dateErr) errors.date = dateErr;

  const periodErr = validateString(period, 50, true);
  if (periodErr) errors.period = periodErr;
  else if (!['Weekly', 'First Month', 'Second Month', 'Third Month', 'Yearly'].includes(period)) {
    errors.period = 'must be Weekly, First Month, Second Month, Third Month or Yearly';
  }

  const subByErr = validateString(submitted_by, 150);
  if (subByErr) errors.submitted_by = subByErr;

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, error: 'Validation failed', validationErrors: errors });
  }

  next();
};

module.exports = {
  validateCreateUser,
  validateUpdateUser,
  validateMaintenanceRecord
};
