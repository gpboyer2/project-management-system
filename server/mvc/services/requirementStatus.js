/**
 * 需求状态管理服务
 * 提供需求状态的增删改查操作
 */
const { RequirementStatus } = require('../../database/models');
const { Op } = require('sequelize');

// 查询参数类型定义
class RequirementStatusQueryParams {
  constructor({
    page = 1,
    pageSize = 20,
    name = '',
    status = null,
  } = {}) {
    this.page = parseInt(page);
    this.pageSize = parseInt(pageSize);
    this.name = name;
    this.status = status;
  }
}

// 创建需求状态请求数据类型
class CreateRequirementStatusRequest {
  constructor({
    name,
    status = 1,
    description = '',
    sort_order = 0,
    config = {},
  } = {}) {
    this.name = name;
    this.status = status;
    this.description = description;
    this.sort_order = sort_order;
    this.config = config;
  }
}

// 更新需求状态请求数据类型
class UpdateRequirementStatusRequest {
  constructor({
    id,
    name,
    status,
    description,
    sort_order,
    config,
  } = {}) {
    this.id = id;
    this.name = name;
    this.status = status;
    this.description = description;
    this.sort_order = sort_order;
    this.config = config;
  }
}

// 需求状态管理服务类
class RequirementStatusService {
  /**
   * 获取需求状态列表
   * @param {RequirementStatusQueryParams} params 查询参数
   * @returns {Object} 需求状态列表和分页信息
   */
  async getRequirementStatusList(params) {
    const queryParams = new RequirementStatusQueryParams(params);

    // 构建查询条件
    const where = {};
    if (queryParams.name) {
      where.name = { [Op.like]: `%${queryParams.name}%` };
    }
    if (queryParams.status !== null && queryParams.status !== undefined) {
      where.status = queryParams.status;
    }

    // 查询数据
    const { count, rows } = await RequirementStatus.findAndCountAll({
      where,
      offset: (queryParams.page - 1) * queryParams.pageSize,
      limit: queryParams.pageSize,
      order: [['sort_order', 'ASC'], ['create_time', 'DESC']],
    });

    return {
      list: rows,
      pagination: {
        current_page: queryParams.page,
        page_size: queryParams.pageSize,
        total: count,
      },
    };
  }

  /**
   * 获取需求状态详情
   * @param {number} id 需求状态ID
   * @returns {RequirementStatus} 需求状态详情
   */
  async getRequirementStatusDetail(id) {
    const requirementStatus = await RequirementStatus.findByPk(id);
    if (!requirementStatus) {
      throw new Error('需求状态不存在');
    }
    return requirementStatus;
  }

  /**
   * 创建需求状态
   * @param {CreateRequirementStatusRequest} data 需求状态数据
   * @returns {RequirementStatus} 创建后的需求状态
   */
  async createRequirementStatus(data) {
    const request = new CreateRequirementStatusRequest(data);

    // 验证必填字段
    if (!request.name) {
      throw new Error('需求状态名称不能为空');
    }

    // 创建需求状态
    const requirementStatus = await RequirementStatus.create({
      name: request.name,
      status: request.status,
      description: request.description,
      sort_order: request.sort_order,
      config: request.config,
      create_time: Date.now(),
      update_time: Date.now(),
    });

    return requirementStatus;
  }

  /**
   * 更新需求状态
   * @param {UpdateRequirementStatusRequest} data 需求状态数据
   * @returns {RequirementStatus} 更新后的需求状态
   */
  async updateRequirementStatus(data) {
    const request = new UpdateRequirementStatusRequest(data);

    // 验证必填字段
    if (!request.id) {
      throw new Error('需求状态ID不能为空');
    }

    // 查找需求状态
    const requirementStatus = await RequirementStatus.findByPk(request.id);
    if (!requirementStatus) {
      throw new Error('需求状态不存在');
    }

    // 更新需求状态
    const updateData = {};
    if (request.name !== undefined) {
      updateData.name = request.name;
    }
    if (request.status !== undefined) {
      updateData.status = request.status;
    }
    if (request.description !== undefined) {
      updateData.description = request.description;
    }
    if (request.sort_order !== undefined) {
      updateData.sort_order = request.sort_order;
    }
    if (request.config !== undefined) {
      updateData.config = request.config;
    }
    updateData.update_time = Date.now();

    await requirementStatus.update(updateData);

    return requirementStatus;
  }

  /**
   * 删除需求状态
   * @param {number[]} ids 需求状态ID列表
   * @returns {void}
   */
  async deleteRequirementStatuses(ids) {
    // 验证ID列表
    if (!ids || ids.length === 0) {
      throw new Error('需求状态ID列表不能为空');
    }

    // 删除需求状态
    await RequirementStatus.destroy({
      where: { id: ids },
    });
  }
}

module.exports = new RequirementStatusService();
