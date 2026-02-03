/**
 * 角色模型，处理角色的CRUD操作和权限关联
 */
const log4js = require("../../middleware/log4jsPlus");
const logger = log4js.getLogger("default");
const { Role, Permission, RolePermission, User } = require("../../database/models");
const { sequelize } = require("../../database/sequelize");
const { Op } = require("sequelize");

class RoleModel {
  // 超级管理员角色ID（系统约定）
  static SUPER_ADMIN_ROLE_ID = 1;

  // 获取角色列表（根据当前用户权限过滤）
  static async findAll(status = null, currentUser = null) {
    try {
      const where = {};
      
      // 核心安全逻辑：永远不返回超级管理员角色
      where.id = { [Op.ne]: this.SUPER_ADMIN_ROLE_ID };
      
      // 权限过滤：只能看到比自己角色级别低的角色
      if (currentUser && currentUser.id) {
        where.id = { 
          [Op.and]: [
            { [Op.ne]: this.SUPER_ADMIN_ROLE_ID },
            { [Op.gt]: currentUser.id }
          ]
        };
      }
      
      if (status !== null) {
        where.status = status;
      }
      
      const roleList = await Role.findAll({
        where,
        order: [['create_time', 'ASC']],
        raw: true
      });
      
      for (const role of roleList) {
        const userCount = await User.count({ where: { id: role.id } });
        role.user_count = userCount;
      }
      
      return { list: roleList };
    } catch (error) {
      logger.error("获取角色列表失败:", error);
      throw error;
    }
  }

  // 根据角色ID获取角色详情
  static async findByRoleId(roleId) {
    try {
      return await Role.findByPk(roleId, { raw: true });
    } catch (error) {
      logger.error("获取角色详情失败:", error);
      throw error;
    }
  }

  // 根据角色代码获取角色
  static async findByRoleCode(roleCode) {
    try {
      return await Role.findOne({ where: { role_code: roleCode }, raw: true });
    } catch (error) {
      logger.error("根据角色代码获取角色失败:", error);
      throw error;
    }
  }

  // 创建角色
  static async create(roleData) {
    try {
      return await Role.create({
        ...roleData,
        create_time: Date.now(),
        status: roleData.status || 1
      });
    } catch (error) {
      logger.error("创建角色失败:", error);
      throw error;
    }
  }

  // 更新角色
  static async update(roleId, updateData) {
    try {
      updateData.update_time = Date.now();
      return await Role.update(updateData, { where: { id: roleId } });
    } catch (error) {
      logger.error("更新角色失败:", error);
      throw error;
    }
  }

  // 删除角色
  static async delete(roleId) {
    try {
      await RolePermission.destroy({ where: { id: roleId } });
      return await Role.destroy({ where: { id: roleId } });
    } catch (error) {
      logger.error("删除角色失败:", error);
      throw error;
    }
  }

  // 获取角色的权限列表
  static async getPermissions(roleId) {
    try {
      // 通过关联表查询权限ID列表
      const rolePermissionList = await RolePermission.findAll({ 
        where: { id: roleId }, 
        raw: true 
      });
      
      if (rolePermissionList.length === 0) return [];
      
      // 查询权限详情
      const permissionIdList = rolePermissionList.map(rp => rp.permission_id);
      const permissionList = await Permission.findAll({
        where: { 
          permission_id: permissionIdList,
          status: 1 
        },
        raw: true
      });
      
      return permissionList;
    } catch (error) {
      logger.error("获取角色权限失败:", error);
      throw error;
    }
  }

  // 设置角色权限
  static async setPermissions(roleId, permissionIdList) {
    try {
      await RolePermission.destroy({ where: { id: roleId } });
      
      const insertData = permissionIdList.map(permissionId => ({
        id: roleId,
        permission_id: permissionId
      }));
      
      if (insertData.length > 0) {
        await RolePermission.bulkCreate(insertData);
      }
      
      return true;
    } catch (error) {
      logger.error("设置角色权限失败:", error);
      throw error;
    }
  }

  // 检查角色是否有用户关联
  static async hasUsers(roleId) {
    try {
      const count = await User.count({ where: { id: roleId } });
      return count > 0;
    } catch (error) {
      logger.error("检查角色用户关联失败:", error);
      throw error;
    }
  }
}

module.exports = RoleModel;
