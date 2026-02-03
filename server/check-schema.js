const { sequelize } = require('./database/sequelize');

async function checkTableSchema() {
  try {
    // 查询需求表的结构
    const [results] = await sequelize.query("PRAGMA table_info('requirements');");
    console.log('需求表结构：');
    console.log(results);

    // 查询需求表的外键约束
    const [foreignKeys] = await sequelize.query("PRAGMA foreign_key_list('requirements');");
    console.log('\n需求表外键约束：');
    console.log(foreignKeys);

    // 查询需求类型表的结构
    const [typeResults] = await sequelize.query("PRAGMA table_info('requirement_types');");
    console.log('\n需求类型表结构：');
    console.log(typeResults);

    // 查询需求状态表的结构
    const [statusResults] = await sequelize.query("PRAGMA table_info('requirement_statuses');");
    console.log('\n需求状态表结构：');
    console.log(statusResults);

    // 查询项目表的结构
    const [projectResults] = await sequelize.query("PRAGMA table_info('projects');");
    console.log('\n项目表结构：');
    console.log(projectResults);
  } catch (error) {
    console.error('查询数据库结构失败：', error.message);
  } finally {
    process.exit(0);
  }
}

checkTableSchema();