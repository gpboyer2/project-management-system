/**
 * 流程节点类型管理服务
 * 处理流程节点类型的业务逻辑
 */
const { ProcessNodeType } = require('../../database/models');

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

  return {
    list: rows,
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
 * @returns {Object} 新创建的节点类型
 */
exports.createProcessNodeType = async (processNodeTypeData) => {
  const { name, type = 99, description, sort_order = 0, config = {} } = processNodeTypeData;

  return await ProcessNodeType.create({
    name,
    type,
    description,
    sort_order,
    config,
    create_time: Date.now(),
    update_time: Date.now()
  });
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

  updateData.update_time = Date.now();
  return await processNodeType.update(updateData);
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

  return processNodeType;
};
