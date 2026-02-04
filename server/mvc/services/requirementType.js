/**
 * 需求类型管理服务
 * 处理需求类型的业务逻辑
 */
const { RequirementType } = require('../../database/models');

/**
 * 获取需求类型列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @param {string} params.name 需求类型名称（模糊搜索）
 * @param {number} params.type 需求类型
 * @returns {Object} 需求类型列表和分页信息
 */
exports.getRequirementTypeList = async (params) => {
  const { page = 1, pageSize = 20, name, type } = params;
  const where = {};

  if (name) {
    where.name = { [Op.like]: `%${name}%` };
  }

  if (type !== undefined && type !== null) {
    where.type = type;
  }

  const { count, rows } = await RequirementType.findAndCountAll({
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
 * 创建需求类型
 * @param {Object} requirementTypeData 需求类型数据
 * @param {string} requirementTypeData.name 需求类型名称
 * @param {number} requirementTypeData.type 需求类型（1-功能需求 2-性能需求 3-安全需求 4-兼容性需求 5-用户体验需求 99-其他需求）
 * @param {string} requirementTypeData.description 需求类型描述
 * @param {number} requirementTypeData.sort_order 排序号（越小越靠前）
 * @param {Object} requirementTypeData.config 配置信息（JSON格式）
 * @returns {Object} 新创建的需求类型
 */
exports.createRequirementType = async (requirementTypeData) => {
  const { name, type = 99, description, sort_order = 0, config = {} } = requirementTypeData;

  return await RequirementType.create({
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
 * 更新需求类型
 * @param {number} id 需求类型ID
 * @param {Object} updateData 更新数据
 * @returns {Object} 更新后的需求类型
 */
exports.updateRequirementType = async (id, updateData) => {
  const requirementType = await RequirementType.findByPk(id);
  if (!requirementType) {
    throw new Error('需求类型不存在');
  }

  updateData.update_time = Date.now();
  return await requirementType.update(updateData);
};

/**
 * 删除需求类型
 * @param {Array<number>} ids 需求类型ID列表
 * @returns {void}
 */
exports.deleteRequirementTypes = async (ids) => {
  await RequirementType.destroy({ where: { id: ids } });
};

/**
 * 获取需求类型详情
 * @param {number} id 需求类型ID
 * @returns {Object} 需求类型详情
 */
exports.getRequirementTypeDetail = async (id) => {
  const requirementType = await RequirementType.findByPk(id);
  if (!requirementType) {
    throw new Error('需求类型不存在');
  }

  return requirementType;
};
