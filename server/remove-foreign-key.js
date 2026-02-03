const { sequelize } = require('./database/sequelize');
const fs = require('fs');
const path = require('path');

async function removeForeignKey() {
  try {
    // 1. 备份需求表数据
    const [requirementsData] = await sequelize.query('SELECT * FROM requirements;');
    const backupFile = path.join(__dirname, 'data', 'requirements-backup.json');
    fs.writeFileSync(backupFile, JSON.stringify(requirementsData, null, 2));
    console.log('需求表数据已备份到：', backupFile);

    // 2. 删除需求表
    await sequelize.query('DROP TABLE IF EXISTS requirements;');
    console.log('需求表已删除');

    // 3. 重新创建需求表，不包含外键约束
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS requirements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        type_id INTEGER NOT NULL,
        description TEXT,
        priority INTEGER NOT NULL,
        status_id INTEGER NOT NULL,
        current_assignee_id INTEGER,
        reporter_id INTEGER NOT NULL,
        project_id INTEGER,
        planned_version VARCHAR(255),
        actual_version VARCHAR(255),
        create_time INTEGER,
        update_time INTEGER
      );
    `);
    console.log('需求表已重新创建（无外键约束）');

    // 4. 恢复需求表数据
    if (requirementsData.length > 0) {
      for (const requirement of requirementsData) {
        await sequelize.query(`
          INSERT INTO requirements (
            id, name, type_id, description, priority, status_id, current_assignee_id,
            reporter_id, project_id, planned_version, actual_version, create_time, update_time
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, {
          replacements: [
            requirement.id,
            requirement.name,
            requirement.type_id,
            requirement.description,
            requirement.priority,
            requirement.status_id,
            requirement.current_assignee_id,
            requirement.reporter_id,
            requirement.project_id,
            requirement.planned_version,
            requirement.actual_version,
            requirement.create_time,
            requirement.update_time
          ]
        });
      }
      console.log('需求表数据已恢复');
    }

    console.log('外键约束已成功删除');
  } catch (error) {
    console.error('删除外键约束失败：', error.message);
  } finally {
    process.exit(0);
  }
}

removeForeignKey();