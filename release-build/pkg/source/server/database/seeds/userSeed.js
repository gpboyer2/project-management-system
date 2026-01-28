// 用户管理模块种子数据初始化脚本
const log4js = require("../../middleware/log4jsPlus")
const defaultLogger = log4js.getLogger("default")
const bcrypt = require('bcryptjs');
const { User, Role, Permission, RolePermission } = require('../models');
const { Op } = require('sequelize');

// 默认角色数据
const defaultRoleList = [
  { role_name: '超级管理员', role_code: 'SUPER_ADMIN', description: '系统超级管理员，拥有所有权限', status: 1 },
  { role_name: '系统管理员', role_code: 'ADMIN', description: '系统管理员，拥有大部分管理权限', status: 1 },
  { role_name: '普通用户', role_code: 'USER', description: '普通用户，拥有基础操作权限', status: 1 },
  { role_name: '访客', role_code: 'GUEST', description: '访客，仅有查看权限', status: 1 }
];

// 默认权限数据
const defaultPermissionList = [
  { permission_name: '系统管理', permission_code: 'SYSTEM', resource_type: 'menu', resource_path: '/system', parent_id: null, sort_order: 1 },
  { permission_name: '用户管理', permission_code: 'SYSTEM:USER', resource_type: 'menu', resource_path: '/system/user', parent_id: 1, sort_order: 1 },
  { permission_name: '查看用户', permission_code: 'SYSTEM:USER:VIEW', resource_type: 'button', resource_path: null, parent_id: 2, sort_order: 1 },
  { permission_name: '创建用户', permission_code: 'SYSTEM:USER:CREATE', resource_type: 'button', resource_path: null, parent_id: 2, sort_order: 2 },
  { permission_name: '编辑用户', permission_code: 'SYSTEM:USER:EDIT', resource_type: 'button', resource_path: null, parent_id: 2, sort_order: 3 },
  { permission_name: '删除用户', permission_code: 'SYSTEM:USER:DELETE', resource_type: 'button', resource_path: null, parent_id: 2, sort_order: 4 },
  { permission_name: '角色管理', permission_code: 'SYSTEM:ROLE', resource_type: 'menu', resource_path: '/system/role', parent_id: 1, sort_order: 2 },
  { permission_name: '查看角色', permission_code: 'SYSTEM:ROLE:VIEW', resource_type: 'button', resource_path: null, parent_id: 7, sort_order: 1 },
  { permission_name: '创建角色', permission_code: 'SYSTEM:ROLE:CREATE', resource_type: 'button', resource_path: null, parent_id: 7, sort_order: 2 },
  { permission_name: '编辑角色', permission_code: 'SYSTEM:ROLE:EDIT', resource_type: 'button', resource_path: null, parent_id: 7, sort_order: 3 },
  { permission_name: '删除角色', permission_code: 'SYSTEM:ROLE:DELETE', resource_type: 'button', resource_path: null, parent_id: 7, sort_order: 4 },
  { permission_name: '权限管理', permission_code: 'SYSTEM:PERMISSION', resource_type: 'menu', resource_path: '/system/permission', parent_id: 1, sort_order: 3 },
  { permission_name: '查看权限', permission_code: 'SYSTEM:PERMISSION:VIEW', resource_type: 'button', resource_path: null, parent_id: 12, sort_order: 1 },
  { permission_name: '体系配置', permission_code: 'ARCH', resource_type: 'menu', resource_path: '/system-level-design', parent_id: null, sort_order: 2 },
  { permission_name: '查看体系', permission_code: 'ARCH:VIEW', resource_type: 'button', resource_path: null, parent_id: 14, sort_order: 1 },
  { permission_name: '编辑体系', permission_code: 'ARCH:EDIT', resource_type: 'button', resource_path: null, parent_id: 14, sort_order: 2 },
  { permission_name: '报文配置', permission_code: 'PACKET', resource_type: 'menu', resource_path: '/packet-config', parent_id: null, sort_order: 3 },
  { permission_name: '查看报文', permission_code: 'PACKET:VIEW', resource_type: 'button', resource_path: null, parent_id: 17, sort_order: 1 },
  { permission_name: '编辑报文', permission_code: 'PACKET:EDIT', resource_type: 'button', resource_path: null, parent_id: 17, sort_order: 2 },
  { permission_name: '导入导出', permission_code: 'PACKET:IMPORT_EXPORT', resource_type: 'button', resource_path: null, parent_id: 17, sort_order: 3 },
  { permission_name: '流程图', permission_code: 'FLOWCHART', resource_type: 'menu', resource_path: '/flowchart', parent_id: null, sort_order: 4 },
  { permission_name: '查看流程图', permission_code: 'FLOWCHART:VIEW', resource_type: 'button', resource_path: null, parent_id: 21, sort_order: 1 },
  { permission_name: '编辑流程图', permission_code: 'FLOWCHART:EDIT', resource_type: 'button', resource_path: null, parent_id: 21, sort_order: 2 },
  { permission_name: '生成代码', permission_code: 'FLOWCHART:GENERATE', resource_type: 'button', resource_path: null, parent_id: 21, sort_order: 3 }
];

// 默认用户数据
const defaultUserList = [
  { user_name: 'admin', password: 'admin123', real_name: '超级管理员', email: 'admin@cssc.com', phone: '13800000000', role_id: 1, status: 1 },
  { user_name: 'user', password: '123456', real_name: '测试用户', email: 'user@cssc.com', phone: '13800000001', role_id: 3, status: 1 }
];

// 初始化角色数据
async function initRoleList() {
  try {
    const count = await Role.count();
    if (count > 0) {
      defaultLogger.info('[Seed] 角色数据已存在，跳过初始化');
      return;
    }

    await Role.bulkCreate(defaultRoleList.map(role => ({ ...role, create_time: Date.now() })));
    defaultLogger.info('[Seed] 角色数据初始化完成');
  } catch (error) {
    defaultLogger.error('[Seed] 角色数据初始化失败:', error);
  }
}

// 初始化权限数据
async function initPermissionList() {
  try {
    const count = await Permission.count();
    if (count > 0) {
      defaultLogger.info('[Seed] 权限数据已存在，跳过初始化');
      return;
    }

    await Permission.bulkCreate(defaultPermissionList.map(p => ({ ...p, create_time: Date.now() })));
    defaultLogger.info('[Seed] 权限数据初始化完成');
  } catch (error) {
    defaultLogger.error('[Seed] 权限数据初始化失败:', error);
  }
}

// 初始化角色权限关联
async function initRolePermissionList() {
  try {
    const count = await RolePermission.count();
    if (count > 0) {
      defaultLogger.info('[Seed] 角色权限关联已存在，跳过初始化');
      return;
    }

    const permissionList = await Permission.findAll({ attributes: ['permission_id', 'permission_code'], raw: true });
    const rolePermissionData = [];

    // 超级管理员（role_id=1）拥有所有权限
    permissionList.forEach(p => rolePermissionData.push({ role_id: 1, permission_id: p.permission_id }));

    // 系统管理员（role_id=2）拥有除权限管理外的所有权限
    permissionList.filter(p => ![12, 13].includes(p.permission_id))
      .forEach(p => rolePermissionData.push({ role_id: 2, permission_id: p.permission_id }));

    // 普通用户（role_id=3）拥有查看权限
    const userPermissionCodeList = ['SYSTEM', 'ARCH', 'ARCH:VIEW', 'PACKET', 'PACKET:VIEW', 'FLOWCHART', 'FLOWCHART:VIEW'];
    permissionList.filter(p => userPermissionCodeList.includes(p.permission_code))
      .forEach(p => rolePermissionData.push({ role_id: 3, permission_id: p.permission_id }));

    // 访客（role_id=4）仅有基础查看权限
    const guestPermissionCodeList = ['ARCH', 'ARCH:VIEW', 'PACKET', 'PACKET:VIEW'];
    permissionList.filter(p => guestPermissionCodeList.includes(p.permission_code))
      .forEach(p => rolePermissionData.push({ role_id: 4, permission_id: p.permission_id }));

    await RolePermission.bulkCreate(rolePermissionData);
    defaultLogger.info('[Seed] 角色权限关联初始化完成');
  } catch (error) {
    defaultLogger.error('[Seed] 角色权限关联初始化失败:', error);
  }
}

// 初始化用户数据
async function initUserList() {
  try {
    const count = await User.count();
    if (count === 0) {
      // 表为空，创建所有默认用户
      for (const user of defaultUserList) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await User.create({ ...user, password: hashedPassword, create_time: Date.now() });
      }
      defaultLogger.info('[Seed] 用户数据初始化完成');
    } else {
      // 表不为空，更新 admin 用户的密码（确保测试能够正常运行）
      const adminUser = await User.findOne({ where: { user_name: 'admin' } });
      if (adminUser) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.update(
          { password: hashedPassword },
          { where: { user_name: 'admin' } }
        );
        defaultLogger.info('[Seed] admin 用户密码已更新为: admin123');
      } else {
        // 如果不存在 admin 用户，创建它
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
          user_name: 'admin',
          password: hashedPassword,
          real_name: '超级管理员',
          email: 'admin@cssc.com',
          phone: '13800000000',
          role_id: 1,
          status: 1,
          create_time: Date.now()
        });
        defaultLogger.info('[Seed] admin 用户已创建');
      }
    }
  } catch (error) {
    defaultLogger.error('[Seed] 用户数据初始化失败:', error);
  }
}

// 执行所有种子数据初始化
async function runSeed() {
  defaultLogger.info('[Seed] 开始初始化用户管理模块种子数据...');

  // 按顺序初始化（有依赖关系）
  await initRoleList();
  await initPermissionList();
  await initRolePermissionList();
  await initUserList();

  defaultLogger.info('[Seed] 用户管理模块种子数据初始化完成');
}

module.exports = {
  runSeed,
  initRoleList,
  initPermissionList,
  initRolePermissionList,
  initUserList
};
