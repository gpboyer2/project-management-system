/**
 * 评审管理服务
 * 处理评审管理的业务逻辑
 */
const { Review, ReviewProcessNode, ReviewProcessNodeRelation, ReviewProcessNodeUser, User, Project } = require('../../database/models');

/**
 * 获取评审列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页数量
 * @param {number} params.projectId 项目ID
 * @param {number} params.status 评审状态
 * @returns {Object} 评审列表和分页信息
 */
exports.getReviewList = async (params) => {
  const { page = 1, pageSize = 20, projectId, status } = params;
  const where = {};

  if (projectId) {
    where.project_id = projectId;
  }

  if (status) {
    where.status = status;
  }

  const { count, rows } = await Review.findAndCountAll({
    where,
    offset: (page - 1) * pageSize,
    limit: parseInt(pageSize),
    order: [['create_time', 'DESC']],
    include: [
      { model: User, as: 'reporter' },
      { model: User, as: 'reviewer' },
      { model: Project, as: 'project' }
    ]
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
 * 创建评审
 * @param {Object} reviewData 评审数据
 * @param {string} reviewData.name 评审名称
 * @param {string} reviewData.description 评审描述
 * @param {number} reviewData.review_type 评审类型（1-技术评审 2-业务评审 3-产品评审）
 * @param {number} reviewData.status 评审状态（1-待开始 2-进行中 3-已完成 4-已取消）
 * @param {number} reviewData.reporter_id 评审发起人用户ID
 * @param {number} reviewData.reviewer_id 评审负责人用户ID
 * @param {number} reviewData.project_id 所属项目ID
 * @param {number} reviewData.start_time 开始时间（Unix时间戳）
 * @param {number} reviewData.end_time 结束时间（Unix时间戳）
 * @returns {Object} 新创建的评审
 */
exports.createReview = async (reviewData) => {
  const { name, description, review_type = 1, status = 1, reporter_id, reviewer_id, project_id, start_time, end_time } = reviewData;

  return await Review.create({
    name,
    description,
    review_type,
    status,
    reporter_id,
    reviewer_id,
    project_id,
    start_time,
    end_time,
    create_time: Date.now(),
    update_time: Date.now()
  });
};

/**
 * 更新评审
 * @param {number} id 评审ID
 * @param {Object} updateData 更新数据
 * @returns {Object} 更新后的评审
 */
exports.updateReview = async (id, updateData) => {
  const review = await Review.findByPk(id);
  if (!review) {
    throw new Error('评审不存在');
  }

  updateData.update_time = Date.now();
  return await review.update(updateData);
};

/**
 * 删除评审
 * @param {Array<number>} ids 评审ID列表
 * @returns {void}
 */
exports.deleteReviews = async (ids) => {
  await Review.destroy({ where: { id: ids } });
};

/**
 * 获取评审详情
 * @param {number} id 评审ID
 * @returns {Object} 评审详情
 */
exports.getReviewDetail = async (id) => {
  return await Review.findByPk(id, {
    include: [
      { model: User, as: 'reporter' },
      { model: User, as: 'reviewer' },
      { model: Project, as: 'project' },
      { model: ReviewProcessNode, as: 'process_nodes' }
    ]
  });
};

/**
 * 获取评审流程节点列表
 * @param {number} reviewId 评审ID
 * @returns {Array} 评审流程节点列表
 */
exports.getReviewProcessNodes = async (reviewId) => {
  return await ReviewProcessNode.findAll({
    where: { review_id: reviewId },
    order: [['node_order', 'ASC']]
  });
};

/**
 * 创建评审流程节点
 * @param {Object} nodeData 节点数据
 * @returns {Object} 新创建的节点
 */
exports.createReviewProcessNode = async (nodeData) => {
  nodeData.create_time = Date.now();
  nodeData.update_time = Date.now();
  return await ReviewProcessNode.create(nodeData);
};

/**
 * 更新评审流程节点
 * @param {number} id 节点ID
 * @param {Object} updateData 更新数据
 * @returns {Object} 更新后的节点
 */
exports.updateReviewProcessNode = async (id, updateData) => {
  const node = await ReviewProcessNode.findByPk(id);
  if (!node) {
    throw new Error('节点不存在');
  }

  updateData.update_time = Date.now();
  return await node.update(updateData);
};

/**
 * 删除评审流程节点
 * @param {Array<number>} ids 节点ID列表
 * @returns {void}
 */
exports.deleteReviewProcessNodes = async (ids) => {
  await ReviewProcessNode.destroy({ where: { id: ids } });
};
