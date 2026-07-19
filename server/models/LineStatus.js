const prisma = require('../config/db');

// All 25 production lines
const ALL_LINES = Array.from({ length: 25 }, (_, i) => String(401 + i));

// Lines not installed by default
const DEFAULT_NOT_INSTALLED = ['409', '414', '416', '417', '418', '419', '420'];

const lineStatusModel = {
  /**
   * Seed all lines on startup — idempotent, only inserts missing rows.
   */
  seedLines: async () => {
    for (const line of ALL_LINES) {
      await prisma.lineStatus.upsert({
        where: { line },
        update: {},
        create: {
          line,
          is_installed: !DEFAULT_NOT_INSTALLED.includes(line)
        }
      });
    }
  },

  /**
   * Return all lines with their installation status, ordered by line number.
   */
  getAll: async () => {
    return await prisma.lineStatus.findMany({
      orderBy: { line: 'asc' }
    });
  },

  /**
   * Return only installed lines (for use in form dropdowns).
   */
  getInstalledLines: async () => {
    const rows = await prisma.lineStatus.findMany({
      where: { is_installed: true },
      orderBy: { line: 'asc' },
      select: { line: true }
    });
    return rows.map(r => r.line);
  },

  /**
   * Update installation status of a specific line.
   */
  updateStatus: async (line, is_installed, updated_by) => {
    return await prisma.lineStatus.update({
      where: { line },
      data: { is_installed, updated_by }
    });
  }
};

module.exports = lineStatusModel;
