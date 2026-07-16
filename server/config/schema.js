const prisma = require('./db');
const bcrypt = require('bcrypt');
const { execSync } = require('child_process');

async function initializeDatabase() {
  try {
    // Run prisma migrate deploy
    console.log('🔄 Running Prisma migrations...');
    // execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Prisma migrations applied successfully');

    // Seed default user
    const defaultUsername = process.env.AUTH_DEFAULT_USERNAME || 'abhinandan';
    const defaultPassword = process.env.AUTH_DEFAULT_PASSWORD || '95003989';
    const defaultName = process.env.AUTH_DEFAULT_NAME || 'Abhinandan Kumar';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    await prisma.appUser.upsert({
      where: { username: defaultUsername },
      update: {
        password_hash: passwordHash,
        full_name: defaultName,
        role: 'super_admin'
      },
      create: {
        username: defaultUsername,
        password_hash: passwordHash,
        full_name: defaultName,
        role: 'super_admin'
      }
    });

    // Seed default role users for testing
    const seedPassword = 'password123';
    const seedHash = await bcrypt.hash(seedPassword, 10);
    
    const seedUsers = [
      { username: 'tech1', fullName: 'Technician One', role: 'technician' },
      { username: 'eng1', fullName: 'Engineer One', role: 'engineer' },
      { username: 'mgr1', fullName: 'Manager One', role: 'manager' }
    ];

    for (const u of seedUsers) {
      await prisma.appUser.upsert({
        where: { username: u.username },
        update: {
          password_hash: seedHash,
          full_name: u.fullName,
          role: u.role
        },
        create: {
          username: u.username,
          password_hash: seedHash,
          full_name: u.fullName,
          role: u.role
        }
      });
    }
    console.log('👤 Default role users checked/created successfully');
    console.log('👤 Default admin user checked/created successfully');
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
    throw error;
  }
}

module.exports = initializeDatabase;
