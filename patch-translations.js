const fs = require('fs');

const jsFile = 'D:\\AOI_Maintenance_Checksheet-main\\client\\src\\translations.js';
let js = fs.readFileSync(jsFile, 'utf8');

// Replace English monthly labels
js = js.replace(
  'm1_label: "Check the machine\'s internal test area for foreign objects",',
  'm1_label: "Clean the scattered materials",'
);
js = js.replace(
  'm2_label: "Clean the inside of the machine and wipe the sensor",',
  'm2_label: "Clean the dust inside ; Wipe track and stop plate sensor",'
);
js = js.replace(
  'm3_label: "Check if there are any items in the equipment box",',
  'm3_label: "Clean the sundries",'
);
js = js.replace(
  'm4_label: "Check that the ribbon inside and outside the fan is fluttering, then remove the filter to clean the dust",',
  'm4_label: "Clean filter cotton",'
);
js = js.replace(
  'm5_label: "Check if the belt is dirty",',
  'm5_label: "Check belt no dirty or damaged",'
);
js = js.replace(
  'm6_label: "Check that the equipment rails are smooth",',
  'm6_label: "Check track runs smoothly",'
);
js = js.replace(
  'm7_label: "Check that the tank chain of the moving parts of the equipment is normal",',
  'm7_label: "Check tank chain is normal",'
);
js = js.replace(
  'm8_label: "Whether the machine is jittering when testing X and Y axes",',
  'm8_label: "No shaft shaking during machine running",'
);

// Replace English quarterly labels
js = js.replace(
  'q1_label: "Clean the dust in the pre-filter of the equipment chassis, galvanometer and smoke purifier",',
  'q1_label: "Clean the dust in the equipment cabinet",'
);
js = js.replace(
  'q2_label: "Inspect the belt for cleaning or replacement",',
  'q2_label: "inspect the belt for cleaning or replacement",'
);
js = js.replace(
  'q3_label: "Screws and rails: remove oil, add new lubricant (Include Z axis)",',
  'q3_label: "X, Y, Z shaft screw rod and guide rail decontamination and oil filling",'
);

// Replace Chinese monthly labels
js = js.replace(
  'm1_label: "检查设备内部测试区域有无异物",',
  'm1_label: "清理散落物料",'
);
js = js.replace(
  'm2_label: "清洁设备内部及擦拭传感器",',
  'm2_label: "清理内部灰尘；擦拭轨道和挡板传感器",'
);
js = js.replace(
  'm3_label: "检查设备箱体内是否有物品",',
  'm3_label: "清理杂物",'
);
js = js.replace(
  'm4_label: "检查风扇内外飘带是否飘动，拆下过滤网清洁灰尘",',
  'm4_label: "清洁过滤棉",'
);
js = js.replace(
  'm5_label: "检查皮带是否脏污",',
  'm5_label: "检查皮带无脏污或破损",'
);
js = js.replace(
  'm6_label: "检查设备轨道是否顺畅",',
  'm6_label: "检查轨道运行顺畅",'
);
js = js.replace(
  'm7_label: "检查设备运动部件坦克链状态是否正常",',
  'm7_label: "检查坦克链正常",'
);
js = js.replace(
  'm8_label: "测试X轴和Y轴时设备运行是否有抖动",',
  'm8_label: "机器运行时轴无抖动",'
);

// Replace Chinese quarterly labels
js = js.replace(
  'q1_label: "清理设备机箱预过滤网、振镜及烟雾净化器粉尘",',
  'q1_label: "清理设备机柜内的灰尘",'
);
js = js.replace(
  'q2_label: "检查皮带，决定是否清洗或更换",',
  'q2_label: "检查皮带进行清洁或更换",'
);
js = js.replace(
  'q3_label: "丝杆、导轨去油，加新润滑脂（包含Z轴）",',
  'q3_label: "X、Y、Z轴丝杆及导轨去污加油",'
);

fs.writeFileSync(jsFile, js, 'utf8');
console.log('✅ translations.js updated successfully.');
