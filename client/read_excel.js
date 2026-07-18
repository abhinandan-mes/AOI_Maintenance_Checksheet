const xlsx = require('xlsx');

const file = process.argv[2];
const workbook = xlsx.readFile(file);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
data.slice(0, 30).forEach(row => console.log(JSON.stringify(row)));
