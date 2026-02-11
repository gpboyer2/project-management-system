/**
 * 流程节点类型管理服务
 * 处理流程节点类型的业务逻辑
 */
const { ProcessNodeType } = require('../../database/models');
const { Op } = require('sequelize');

/**
 * 获取流程节点类型列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @param {string} params.name 节点类型名称（模糊搜索）
 * @param {number} params.type 节点类型
 * @returns {Object} 节点类型列表和分页信息
 */
exports.getProcessNodeTypeList = async (params) => {
  const { page = 1, pageSize = 20, name, type } = params;
  const where = {};

  if (name) {
    where.name = { [Op.like]: `%${name}%` };
  }

  if (type !== undefined && type !== null) {
    where.type = type;
  }

  const { count, rows } = await ProcessNodeType.findAndCountAll({
    where,
    offset: (page - 1) * pageSize,
    limit: parseInt(pageSize),
    order: [['sort_order', 'ASC'], ['create_time', 'DESC']]
  });

  // 处理返回数据，确保包含 tasks 字段
  const processedList = rows.map(nodeType => {
    const nodeTypeData = nodeType.toJSON();
    return {
      ...nodeTypeData,
      tasks: nodeTypeData.tasks || []
    };
  });

  return {
    list: processedList,
    pagination: {
      current_page: parseInt(page),
      page_size: parseInt(pageSize),
      total: count
    }
  };
};

/**
 * 创建流程节点类型
 * @param {Object} processNodeTypeData 节点类型数据
 * @param {string} processNodeTypeData.name 节点类型名称
 * @param {number} processNodeTypeData.type 节点类型（1-开始节点 2-结束节点 3-评审节点 4-开发节点 5-测试节点 6-部署节点 99-其他节点）
 * @param {string} processNodeTypeData.description 节点类型描述
 * @param {number} processNodeTypeData.sort_order 排序号（越小越靠前）
 * @param {Object} processNodeTypeData.config 配置信息（JSON格式）
 * @param {Array} processNodeTypeData.tasks 任务占位配置列表
 * @returns {Object} 新创建的节点类型
 */
exports.createProcessNodeType = async (processNodeTypeData) => {
  const { name, type = 99, description, sort_order = 0, config = {}, tasks = [] } = processNodeTypeData;

  const processNodeType = await ProcessNodeType.create({
    name,
    type,
    description,
    sort_order,
    config,
    tasks, // 直接保存 tasks 字段，不嵌套在 config 中
    create_time: Date.now(),
    update_time: Date.now()
  });

  // 处理返回数据，确保包含 tasks 字段
  const processNodeTypeDataResult = processNodeType.toJSON();
  return {
    ...processNodeTypeDataResult,
    tasks: processNodeTypeDataResult.tasks || []
  };
};

/**
 * 更新流程节点类型
 * @param {number} id 节点类型ID
 * @param {Object} updateData 更新数据
 * @returns {Object} 更新后的节点类型
 */
exports.updateProcessNodeType = async (id, updateData) => {
  const processNodeType = await ProcessNodeType.findByPk(id);
  if (!processNodeType) {
    throw new Error('流程节点类型不存在');
  }

  // 直接处理 tasks 字段
  if (updateData.tasks !== undefined) {
    processNodeType.tasks = updateData.tasks;
    delete updateData.tasks; // 从 updateData 中删除 tasks 字段，避免重复更新
  }

  updateData.update_time = Date.now();
  const updatedNodeType = await processNodeType.update(updateData);

  // 处理返回数据，确保包含 tasks 字段
  const updatedNodeTypeData = updatedNodeType.toJSON();
  return {
    ...updatedNodeTypeData,
    tasks: updatedNodeTypeData.tasks || []
  };
};

/**
 * 删除流程节点类型
 * @param {Array<number>} ids 节点类型ID列表
 * @returns {void}
 */
exports.deleteProcessNodeTypes = async (ids) => {
  await ProcessNodeType.destroy({ where: { id: ids } });
};

/**
 * 获取流程节点类型详情
 * @param {number} id 节点类型ID
 * @returns {Object} 节点类型详情
 */
exports.getProcessNodeTypeDetail = async (id) => {
  const processNodeType = await ProcessNodeType.findByPk(id);
  if (!processNodeType) {
    throw new Error('流程节点类型不存在');
  }

  // 处理返回数据，确保包含 tasks 字段
  const processNodeTypeData = processNodeType.toJSON();
  return {
    ...processNodeTypeData,
    tasks: processNodeTypeData.tasks || []
  };
};
