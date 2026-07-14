import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environmental variables from server's .env file
dotenv.config({ path: path.join(__dirname, '../../server/.env') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('🌱 Starting comprehensive shopfloor test-data seeding...');

  // 1. Ensure seed users are fully populated
  const users = [
    { username: 'tech1', full_name: 'Technician One', role: 'technician' },
    { username: 'eng1', full_name: 'Engineer One', role: 'engineer' },
    { username: 'mgr1', full_name: 'Manager One', role: 'manager' },
    { username: 'ins1', full_name: 'Inspector One', role: 'inspector' }
  ];

  // Dummy BCrypt hash for "password123"
  const passwordHash = '$2b$10$vM6wO8uUjM67eX.FmUHeKevL2G35tC4vCgZf3XU0/h7uXU98LqO6G';

  for (const u of users) {
    await prisma.appUser.upsert({
      where: { username: u.username },
      update: { full_name: u.full_name, role: u.role },
      create: {
        username: u.username,
        password_hash: passwordHash,
        full_name: u.full_name,
        role: u.role
      }
    });
  }
  console.log('✓ Test users verified');

  // Clear previous test-generated records to avoid duplicate primary keys
  await prisma.aoiSpiMaintenanceRecord.deleteMany({
    where: {
      remarks: {
        contains: '[SEEDED_TEST_DATA]'
      }
    }
  });

  const now = new Date();
  const currentMonthStr = now.toISOString().substring(0, 7); // YYYY-MM
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);

  // 2. Mock Maintenance Records
  const records = [
    // ── APPROVED MONTHLY LOGS ──
    {
      equipment_type: 'AOI',
      machine_name: 'Jutze AOI-1',
      machine_type: 'POST_AOI',
      machine_asset_no: 'AOI-PA-991',
      line: '401',
      date: new Date(`${currentMonthStr}-02T00:00:00Z`),
      period: 'First Month',
      submitted_by: 'Technician One (tech1)',
      engineer_reviewed_by: 'Engineer One (eng1)',
      manager_reviewed_by: 'Manager One (mgr1)',
      status: 'APPROVED',
      remarks: 'All items verified. Belt running smoothly. [SEEDED_TEST_DATA]',
      m1_clean_test_area: true,
      m2_clean_inside_wipe_sensor: true,
      m3_check_equipment_box: true,
      m4_clean_filter_cotton: true,
      m5_check_belt_dirty_damaged: true,
      m6_check_rails_smooth: true,
      m7_check_tank_chain: true,
      m8_check_no_jitter: true,
      m9_clean_dust_collector: true,
      m10_exhaust_pipe_damaged: false,
      created_at: new Date(`${currentMonthStr}-02T08:30:00Z`),
      eng_reviewed_at: new Date(`${currentMonthStr}-02T10:15:00Z`),
      mgr_approved_at: new Date(`${currentMonthStr}-02T14:20:00Z`),
      submitted_ip: '127.0.0.1',
      eng_reviewed_ip: '127.0.0.1',
      mgr_approved_ip: '127.0.0.1'
    },
    {
      equipment_type: 'SPI',
      machine_name: 'Kohyoung SPI-2',
      machine_type: 'SPI',
      machine_asset_no: 'SPI-KY-481',
      line: '405',
      date: new Date(`${currentMonthStr}-05T00:00:00Z`),
      period: 'Second Month',
      submitted_by: 'Technician One (tech1)',
      engineer_reviewed_by: 'Engineer One (eng1)',
      manager_reviewed_by: 'Manager One (mgr1)',
      status: 'APPROVED',
      remarks: 'Filter cotton replaced. Sensor clean. [SEEDED_TEST_DATA]',
      m1_clean_test_area: true,
      m2_clean_inside_wipe_sensor: true,
      m3_check_equipment_box: true,
      m4_clean_filter_cotton: true,
      m5_check_belt_dirty_damaged: true,
      m6_check_rails_smooth: true,
      m7_check_tank_chain: true,
      m8_check_no_jitter: true,
      m9_clean_dust_collector: true,
      m10_exhaust_pipe_damaged: false,
      created_at: new Date(`${currentMonthStr}-05T09:12:00Z`),
      eng_reviewed_at: new Date(`${currentMonthStr}-05T11:40:00Z`),
      mgr_approved_at: new Date(`${currentMonthStr}-05T16:05:00Z`),
      submitted_ip: '127.0.0.1',
      eng_reviewed_ip: '127.0.0.1',
      mgr_approved_ip: '127.0.0.1'
    },

    // ── QUARTERLY INSPECTION ──
    {
      equipment_type: 'AOI',
      machine_name: 'Jutze AOI-2',
      machine_type: 'PRE_AOI',
      machine_asset_no: 'AOI-PR-002',
      line: '402',
      date: new Date(`${currentMonthStr}-08T00:00:00Z`),
      period: 'Third Month',
      submitted_by: 'Technician One (tech1)',
      engineer_reviewed_by: 'Engineer One (eng1)',
      manager_reviewed_by: 'Manager One (mgr1)',
      status: 'APPROVED',
      remarks: 'Lubricated all rails and checked cabinet dust filters. [SEEDED_TEST_DATA]',
      m1_clean_test_area: true,
      m2_clean_inside_wipe_sensor: true,
      m3_check_equipment_box: true,
      m4_clean_filter_cotton: true,
      m5_check_belt_dirty_damaged: true,
      m6_check_rails_smooth: true,
      m7_check_tank_chain: true,
      m8_check_no_jitter: true,
      m9_clean_dust_collector: true,
      m10_exhaust_pipe_damaged: false,
      q1_clean_cabinet_dust: true,
      q2_inspect_belt: true,
      q3_screws_rails_lubricant: true,
      q4_replace_filter_screen: true,
      created_at: new Date(`${currentMonthStr}-08T07:45:00Z`),
      eng_reviewed_at: new Date(`${currentMonthStr}-08T10:00:00Z`),
      mgr_approved_at: new Date(`${currentMonthStr}-08T13:30:00Z`),
      submitted_ip: '127.0.0.1',
      eng_reviewed_ip: '127.0.0.1',
      mgr_approved_ip: '127.0.0.1'
    },

    // ── PENDING ENGINEER REVIEW ──
    {
      equipment_type: 'LASER',
      machine_name: 'SMT Laser Marker 1',
      machine_type: 'LASER',
      machine_asset_no: 'LSR-SM-884',
      line: '412',
      date: new Date(`${currentMonthStr}-11T00:00:00Z`),
      period: 'First Month',
      submitted_by: 'Technician One (tech1)',
      designated_engineer_id: 'eng1',
      designated_manager_id: 'mgr1',
      status: 'SUBMITTED',
      remarks: 'Awaiting engineer audit review. [SEEDED_TEST_DATA]',
      m1_clean_test_area: true,
      m2_clean_inside_wipe_sensor: true,
      m3_check_equipment_box: true,
      m4_clean_filter_cotton: true,
      m5_check_belt_dirty_damaged: true,
      m6_check_rails_smooth: true,
      m7_check_tank_chain: true,
      m8_check_no_jitter: true,
      m9_clean_dust_collector: true,
      m10_exhaust_pipe_damaged: false,
      created_at: new Date(`${currentMonthStr}-11T14:15:00Z`),
      submitted_ip: '127.0.0.1'
    },

    // ── PENDING MANAGER APPROVAL ──
    {
      equipment_type: 'SPI',
      machine_name: 'Sinictek SPI-3',
      machine_type: 'SPI',
      machine_asset_no: 'SPI-ST-125',
      line: '410',
      date: new Date(`${currentMonthStr}-10T00:00:00Z`),
      period: 'Second Month',
      submitted_by: 'Technician One (tech1)',
      engineer_reviewed_by: 'Engineer One (eng1)',
      designated_manager_id: 'mgr1',
      status: 'ENG_APPROVED',
      remarks: 'Engineer confirmed. Needs managerial signature. [SEEDED_TEST_DATA]',
      m1_clean_test_area: true,
      m2_clean_inside_wipe_sensor: true,
      m3_check_equipment_box: true,
      m4_clean_filter_cotton: true,
      m5_check_belt_dirty_damaged: true,
      m6_check_rails_smooth: true,
      m7_check_tank_chain: true,
      m8_check_no_jitter: true,
      m9_clean_dust_collector: true,
      m10_exhaust_pipe_damaged: false,
      created_at: new Date(`${currentMonthStr}-10T11:00:00Z`),
      eng_reviewed_at: new Date(`${currentMonthStr}-10T15:30:00Z`),
      submitted_ip: '127.0.0.1',
      eng_reviewed_ip: '127.0.0.1'
    },

    // ── DISAPPROVED / REJECTED LOG ──
    {
      equipment_type: 'AOI',
      machine_name: 'Jutze AOI-3',
      machine_type: 'POST_AOI',
      machine_asset_no: 'AOI-PA-993',
      line: '415',
      date: new Date(`${currentMonthStr}-04T00:00:00Z`),
      period: 'First Month',
      submitted_by: 'Technician One (tech1)',
      engineer_reviewed_by: 'Engineer One (eng1)',
      status: 'DISAPPROVED',
      rejection_reason: 'Filter screen cotton was dirty and not cleaned or replaced as stated.',
      remarks: 'Needs cleaning first. Rejecting checksheet. [SEEDED_TEST_DATA]',
      m1_clean_test_area: true,
      m2_clean_inside_wipe_sensor: false, // Not completed
      m3_check_equipment_box: true,
      m4_clean_filter_cotton: false, // Not completed
      m5_check_belt_dirty_damaged: true,
      m6_check_rails_smooth: true,
      m7_check_tank_chain: true,
      m8_check_no_jitter: true,
      m9_clean_dust_collector: true,
      m10_exhaust_pipe_damaged: false,
      created_at: new Date(`${currentMonthStr}-04T08:00:00Z`),
      eng_reviewed_at: new Date(`${currentMonthStr}-04T09:30:00Z`),
      submitted_ip: '127.0.0.1',
      eng_reviewed_ip: '127.0.0.1'
    },

    // ── PAST MONTH HISTORICAL LOG ──
    {
      equipment_type: 'AOI',
      machine_name: 'Jutze AOI-4',
      machine_type: 'PRE_AOI',
      machine_asset_no: 'AOI-PR-004',
      line: '401',
      date: prevMonth,
      period: 'First Month',
      submitted_by: 'Technician One (tech1)',
      engineer_reviewed_by: 'Engineer One (eng1)',
      manager_reviewed_by: 'Manager One (mgr1)',
      status: 'APPROVED',
      remarks: 'Completed past month checklist report. [SEEDED_TEST_DATA]',
      m1_clean_test_area: true,
      m2_clean_inside_wipe_sensor: true,
      m3_check_equipment_box: true,
      m4_clean_filter_cotton: true,
      m5_check_belt_dirty_damaged: true,
      m6_check_rails_smooth: true,
      m7_check_tank_chain: true,
      m8_check_no_jitter: true,
      m9_clean_dust_collector: true,
      m10_exhaust_pipe_damaged: false,
      created_at: new Date(prevMonth.getTime() + 8 * 60 * 60 * 1000),
      eng_reviewed_at: new Date(prevMonth.getTime() + 10 * 60 * 60 * 1000),
      mgr_approved_at: new Date(prevMonth.getTime() + 14 * 60 * 60 * 1000),
      submitted_ip: '127.0.0.1',
      eng_reviewed_ip: '127.0.0.1',
      mgr_approved_ip: '127.0.0.1'
    }
  ];

  for (const r of records) {
    await prisma.aoiSpiMaintenanceRecord.create({
      data: r
    });
  }

  // 3. Mock System Event Logs
  await prisma.systemEventLog.deleteMany({
    where: {
      details: {
        contains: '[SEEDED_TEST_DATA]'
      }
    }
  });

  const events = [
    { event_type: 'LOGIN_SUCCESS', username: 'tech1', public_ip: '127.0.0.1', details: 'Successful technician login session [SEEDED_TEST_DATA]' },
    { event_type: 'LOGIN_SUCCESS', username: 'eng1', public_ip: '127.0.0.1', details: 'Successful engineer login session [SEEDED_TEST_DATA]' },
    { event_type: 'USER_CREATE', username: 'abhinandan', public_ip: '127.0.0.1', details: 'Created test user ins1 [SEEDED_TEST_DATA]' }
  ];

  for (const e of events) {
    await prisma.systemEventLog.create({
      data: e
    });
  }

  // 4. Mock Failed Logins
  await prisma.failedLoginAttempt.deleteMany({
    where: {
      username: {
        contains: 'seed_fake_user'
      }
    }
  });

  await prisma.failedLoginAttempt.create({
    data: {
      username: 'seed_fake_user',
      public_ip: '127.0.0.1'
    }
  });

  console.log('✅ Seed successful! Loaded multiple inspection checklists, logs, and simulated approvals.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
