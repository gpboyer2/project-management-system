/**
 * 用户模型，处理用户账户的认证、授权和管理功能
 */
const log4js = require("../../middleware/log4jsPlus");
const logger = log4js.getLogger("default");
const { User, Role } = require("../../database/models");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");

class UserModel {
  // 超级管理员角色ID（系统约定）
  static SUPER_ADMIN_ROLE_ID = 1;

  // 获取用户列表（支持分页和搜索，根据当前用户权限过滤）
  static async findAll(current_page = 1, page_size = 10, keyword = '', role = null, status = null, currentUser = null) {
    try {
      const where = {};

      // 核心安全逻辑：永远不返回超级管理员用户
      where.role_id = { [Op.ne]: this.SUPER_ADMIN_ROLE_ID };

      // 权限过滤：只能看到比自己角色级别低的用户
      if (currentUser && currentUser.role_id) {
        where.role_id = {
          [Op.and]: [
            { [Op.ne]: this.SUPER_ADMIN_ROLE_ID },
            { [Op.gt]: currentUser.role_id }
          ]
        };
      }

      if (keyword) {
        where[Op.or] = [
          { user_name: { [Op.like]: `%${keyword}%` } },
          { real_name: { [Op.like]: `%${keyword}%` } },
          { email: { [Op.like]: `%${keyword}%` } }
        ];
      }

      if (role) {
        // 如果筛选的角色是超级管理员，直接返回空
        if (role === this.SUPER_ADMIN_ROLE_ID) {
          return { list: [], pagination: { current_page, page_size, total: 0 } };
        }
        where.role_id = role;
      }

      if (status !== null) {
        where.status = status;
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        order: [['create_time', 'DESC']],
        limit: page_size,
        offset: (current_page - 1) * page_size,
        raw: true
      });

      // 单独查询角色信息
      const roleIdList = [...new Set(rows.map(row => row.role_id).filter(Boolean))];
      const roleList = roleIdList.length > 0 ? await Role.findAll({ where: { id: roleIdList }, raw: true }) : [];
      const roleMap = Object.fromEntries(roleList.map(r => [r.id, r]));

      return {
        list: rows.map(row => ({
          ...row,
          role_name: roleMap[row.role_id]?.role_name,
          role_code: roleMap[row.role_id]?.role_code
        })),
        pagination: { current_page, page_size, total: count }
      };
    } catch (error) {
      logger.error("获取用户列表失败:", error);
      throw error;
    }
  }

  // 根据用户ID获取用户详情
  static async findByUserId(userId) {
    try {
      const user = await User.findOne({ where: { id: userId }, raw: true });
      if (!user) return null;

      // 单独查询角色信息
      let roleInfo = null;
      if (user.role_id) {
        roleInfo = await Role.findOne({ where: { id: user.role_id }, raw: true });
      }

      return {
        ...user,
        role_name: roleInfo?.role_name,
        role_code: roleInfo?.role_code
      };
    } catch (error) {
      logger.error("获取用户详情失败:", error);
      throw error;
    }
  }

  // 根据用户名获取用户
  static async findByUsername(username) {
    try {
      return await User.findOne({ where: { user_name: username }, raw: true });
    } catch (error) {
      logger.error("根据用户名获取用户失败:", error);
      throw error;
    }
  }

  // 创建新用户
  static async create(userData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password || '123456', 10);
      return await User.create({
        ...userData,
        password: hashedPassword,
        create_time: Date.now(),
        status: userData.status || 1
      });
    } catch (error) {
      logger.error("创建用户失败:", error);
      throw error;
    }
  }

  // 用户登录验证
  static async login(username, password) {
    try {
      console.log('[UserModel.login] 查找用户 - Username:', username);
      const user = await User.findOne({ where: { user_name: username, status: 1 }, raw: true });
      console.log('[UserModel.login] 查找用户结果:', user ? `找到用户 id=${user.id}, has_password=${!!user.password}` : '用户不存在');
      if (!user || !user.password) throw new Error("账户或密码不正确");

      console.log('[UserModel.login] 开始验证密码 - 输入密码长度:', password?.length, '数据库密码前缀:', user.password.substring(0, 10) + '...');
      const isValid = await bcrypt.compare(password, user.password);
      console.log('[UserModel.login] 密码验证结果:', isValid);
      if (!isValid) throw new Error("账户或密码不正确");

      await User.update({ last_login_time: Date.now() }, { where: { id: user.id } });
      console.log('[UserModel.login] 登录成功 - id:', user.id);
      return user;
    } catch (error) {
      throw error;
    }
  }

  // 更新用户信息
  static async update(userId, updateData) {
    try {
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      updateData.update_time = Date.now();
      return await User.update(updateData, { where: { id: userId } });
    } catch (error) {
      logger.error("更新用户失败:", error);
      throw error;
    }
  }

  // 删除用户
  static async delete(userId) {
    try {
      return await User.destroy({ where: { id: userId } });
    } catch (error) {
      logger.error("删除用户失败:", error);
      throw error;
    }
  }

  /**
   * 更新用户状态（支持批量）
   * @param {Array} userIdList 用户ID数组
   * @param {Number} status 状态值
   */
  static async updateStatusList(userIdList, status) {
    try {
      return await User.update({ status: status, update_time: Date.now() }, { where: { id: { [Op.in]: userIdList } } });
    } catch (error) {
      logger.error("更新用户状态失败:", error);
      throw error;
    }
  }

  /**
   * 删除用户（支持批量）
   * @param {Array} userIdList 用户ID数组
   */
  static async deleteList(userIdList) {
    try {
      return await User.destroy({ where: { id: { [Op.in]: userIdList } } });
    } catch (error) {
      logger.error("删除用户失败:", error);
      throw error;
    }
  }

  // 修改密码
  static async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await User.findByPk(userId, { attributes: ['password'], raw: true });
      if (!user) throw new Error("用户不存在");
      
      const isValid = await bcrypt.compare(oldPassword, user.password);
      if (!isValid) throw new Error("原密码错误");
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      return await User.update({ password: hashedPassword, update_time: Date.now() }, { where: { id: userId } });
    } catch (error) {
      logger.error("修改密码失败:", error);
      throw error;
    }
  }

  // 重置密码
  static async resetPassword(userId, newPassword = '123456') {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      return await User.update({ password: hashedPassword, update_time: Date.now() }, { where: { id: userId } });
    } catch (error) {
      logger.error("重置密码失败:", error);
      throw error;
    }
  }
}

module.exports = UserModel;
