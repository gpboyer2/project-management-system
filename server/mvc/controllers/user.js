// 用户管理控制器，只提供增删改查四个接口，入参都是数组
const UserModel = require('../models/user');

// 超级管理员角色ID（系统约定）
const SUPER_ADMIN_ROLE_ID = 1;

class UserController {
    // 查询用户列表
    // params: { current_page, page_size, keyword, role, status }
    static async list(req, res) {
        try {
            const { current_page = 1, page_size = 10, keyword = '', role, status } = req.query;
            const currentUser = req.user; // 从认证中间件获取当前用户

            // 验证 current_page
            const currentPageNum = parseInt(current_page);
            if (isNaN(currentPageNum) || currentPageNum < 1) {
                return res.apiError(null, '当前页码必须是大于0的正整数');
            }
            if (currentPageNum > 100000) {
                return res.apiError(null, '当前页码超出有效范围');
            }

            // 验证 page_size
            const pageSizeNum = parseInt(page_size);
            if (isNaN(pageSizeNum) || pageSizeNum < 1) {
                return res.apiError(null, '每页数量必须是大于0的正整数');
            }
            if (pageSizeNum > 100) {
                return res.apiError(null, '每页数量不能超过100条');
            }

            const result = await UserModel.findAll(
                currentPageNum,
                pageSizeNum,
                keyword,
                role ? parseInt(role) : null,
                status !== undefined ? parseInt(status) : null,
                currentUser // 传入当前用户信息用于权限过滤
            );
            res.apiSuccess(result);
        } catch (error) {
            res.apiError(null, error.message);
        }
    }

    // 新增用户（支持批量）
    // data: [{ user_name, password, real_name, email, phone, role_id, status }]
    static async create(req, res) {
        try {
            const { data } = req.body;
            const currentUser = req.user;

            if (!Array.isArray(data) || data.length === 0) {
                return res.apiError(null, '参数 data 必须是非空数组');
            }

            const resultList = [];
            for (const item of data) {
                // 禁止传入 user_id 字段（应该由数据库自动生成）
                if (item.user_id !== undefined && item.user_id !== null) {
                    resultList.push({ success: false, user_name: item.user_name, message: '不能传入 user_id 字段' });
                    continue;
                }

                // 验证必填字段
                if (!item.user_name || !item.password) {
                    resultList.push({ success: false, user_name: item.user_name, message: '用户名和密码不能为空' });
                    continue;
                }

                // 验证 user_name 长度（2-50字符）
                if (typeof item.user_name !== 'string' || item.user_name.trim() === '') {
                    resultList.push({ success: false, user_name: item.user_name, message: '用户名不能为空字符串' });
                    continue;
                }
                if (item.user_name.trim().length < 2) {
                    resultList.push({ success: false, user_name: item.user_name, message: '用户名长度不能少于2个字符' });
                    continue;
                }
                if (item.user_name.length > 50) {
                    resultList.push({ success: false, user_name: item.user_name, message: '用户名长度不能超过50个字符' });
                    continue;
                }

                // 验证 password 长度（6-20字符）
                if (typeof item.password !== 'string' || item.password.length < 6 || item.password.length > 20) {
                    resultList.push({ success: false, user_name: item.user_name, message: '密码长度必须在6-20个字符之间' });
                    continue;
                }

                // 验证 real_name 长度（如果提供）
                if (item.real_name !== undefined && item.real_name !== null) {
                    if (typeof item.real_name !== 'string') {
                        resultList.push({ success: false, user_name: item.user_name, message: '真实姓名必须是字符串' });
                        continue;
                    }
                    if (item.real_name.trim() !== '' && item.real_name.length > 50) {
                        resultList.push({ success: false, user_name: item.user_name, message: '真实姓名长度不能超过50个字符' });
                        continue;
                    }
                }

                // 验证 email 格式（如果提供）
                if (item.email !== undefined && item.email !== null && item.email !== '') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(item.email)) {
                        resultList.push({ success: false, user_name: item.user_name, message: '邮箱格式不正确' });
                        continue;
                    }
                }

                // 验证 phone 格式（如果提供）
                if (item.phone !== undefined && item.phone !== null && item.phone !== '') {
                    const phoneRegex = /^1[3-9]\d{9}$/;
                    if (!phoneRegex.test(item.phone)) {
                        resultList.push({ success: false, user_name: item.user_name, message: '手机号格式不正确' });
                        continue;
                    }
                }

                // 验证 role_id 类型、范围和必填性
                if (item.role_id === undefined || item.role_id === null) {
                    resultList.push({ success: false, user_name: item.user_name, message: '角色ID不能为空' });
                    continue;
                }
                if (typeof item.role_id !== 'number' || isNaN(item.role_id)) {
                    resultList.push({ success: false, user_name: item.user_name, message: '角色ID必须是数字' });
                    continue;
                }
                if (item.role_id <= 0) {
                    resultList.push({ success: false, user_name: item.user_name, message: '角色ID必须是正整数' });
                    continue;
                }
                if (item.role_id > 10000) {
                    resultList.push({ success: false, user_name: item.user_name, message: '角色ID超出有效范围' });
                    continue;
                }

                // 验证 status 类型、范围和必填性
                if (item.status === undefined || item.status === null) {
                    resultList.push({ success: false, user_name: item.user_name, message: '用户状态不能为空' });
                    continue;
                }
                if (typeof item.status !== 'number' || isNaN(item.status)) {
                    resultList.push({ success: false, user_name: item.user_name, message: '用户状态必须是数字' });
                    continue;
                }
                if (item.status !== 0 && item.status !== 1) {
                    resultList.push({ success: false, user_name: item.user_name, message: '用户状态必须是0（禁用）或1（启用）' });
                    continue;
                }

                // 禁止创建超级管理员角色的用户
                if (item.role_id === SUPER_ADMIN_ROLE_ID) {
                    resultList.push({ success: false, user_name: item.user_name, message: '不能创建超级管理员用户' });
                    continue;
                }

                // 权限检查：只能创建比自己角色级别低的用户
                if (currentUser && item.role_id && item.role_id <= currentUser.role_id) {
                    resultList.push({ success: false, user_name: item.user_name, message: '只能创建比自己角色级别低的用户' });
                    continue;
                }

                // 检查用户名是否已存在
                const existUser = await UserModel.findByUsername(item.user_name);
                if (existUser) {
                    resultList.push({ success: false, user_name: item.user_name, message: '用户名已存在' });
                    continue;
                }
                // 创建用户
                const created = await UserModel.create(item);
                resultList.push({ success: true, user_id: created.id, user_name: item.user_name });
            }

            const successCount = resultList.filter(r => r.success).length;
            if (successCount === 0) {
                const failedMessage = resultList.map(r => r.message).filter(Boolean).join('; ');
                return res.apiError(resultList, `创建失败: ${failedMessage || '未知错误'}`);
            }
            res.apiSuccess(resultList, `成功创建 ${successCount} 个用户`);
        } catch (error) {
            res.apiError(null, error.message);
        }
    }

    // 更新用户（支持批量）
    // data: [{ user_id, ...updateFields }]
    static async update(req, res) {
        try {
            const { data } = req.body;
            const currentUser = req.user;
            
            if (!Array.isArray(data) || data.length === 0) {
                return res.apiError(null, '参数 data 必须是非空数组');
            }

            const resultList = [];
            for (const item of data) {
                if (!item.user_id) {
                    resultList.push({ success: false, message: '缺少 user_id' });
                    continue;
                }
                const user = await UserModel.findByUserId(item.user_id);
                if (!user) {
                    resultList.push({ success: false, user_id: item.user_id, message: '用户不存在' });
                    continue;
                }
                
                // 禁止修改超级管理员
                if (user.role_id === SUPER_ADMIN_ROLE_ID) {
                    resultList.push({ success: false, user_id: item.user_id, message: '不能修改超级管理员' });
                    continue;
                }
                
                // 禁止将用户角色改为超级管理员
                if (item.role_id === SUPER_ADMIN_ROLE_ID) {
                    resultList.push({ success: false, user_id: item.user_id, message: '不能将用户角色设置为超级管理员' });
                    continue;
                }
                
                // 权限检查：只能修改比自己角色级别低的用户
                if (currentUser && user.role_id <= currentUser.role_id) {
                    resultList.push({ success: false, user_id: item.user_id, message: '只能修改比自己角色级别低的用户' });
                    continue;
                }
                
                // 如果更新用户名，检查是否重复
                if (item.user_name && item.user_name !== user.user_name) {
                    const existUser = await UserModel.findByUsername(item.user_name);
                    if (existUser) {
                        resultList.push({ success: false, user_id: item.user_id, message: '用户名已存在' });
                        continue;
                    }
                }
                const { user_id, ...updateData } = item;
                await UserModel.update(user_id, updateData);
                resultList.push({ success: true, user_id });
            }

            const successCount = resultList.filter(r => r.success).length;
            if (successCount === 0) {
                const failedMessage = resultList.map(r => r.message).filter(Boolean).join('; ');
                return res.apiError(resultList, `更新失败: ${failedMessage || '未知错误'}`);
            }
            res.apiSuccess(resultList, `成功更新 ${successCount} 个用户`);
        } catch (error) {
            res.apiError(null, error.message);
        }
    }

    // 删除用户（支持批量）
    // data: [USER_ID1, USER_ID2, ...]
    static async delete(req, res) {
        try {
            const { data } = req.body;
            const currentUser = req.user;
            
            if (!Array.isArray(data) || data.length === 0) {
                return res.apiError(null, '参数 data 必须是非空数组');
            }

            const resultList = [];
            for (const userId of data) {
                const user = await UserModel.findByUserId(userId);
                if (!user) {
                    resultList.push({ success: false, user_id: userId, message: '用户不存在' });
                    continue;
                }
                
                // 禁止删除超级管理员
                if (user.role_id === SUPER_ADMIN_ROLE_ID) {
                    resultList.push({ success: false, user_id: userId, message: '不能删除超级管理员' });
                    continue;
                }
                
                // 权限检查：只能删除比自己角色级别低的用户
                if (currentUser && user.role_id <= currentUser.role_id) {
                    resultList.push({ success: false, user_id: userId, message: '只能删除比自己角色级别低的用户' });
                    continue;
                }
                
                await UserModel.delete(userId);
                resultList.push({ success: true, user_id: userId });
            }

            const successCount = resultList.filter(r => r.success).length;
            if (successCount === 0) {
                const failedMessage = resultList.map(r => r.message).filter(Boolean).join('; ');
                return res.apiError(resultList, `删除失败: ${failedMessage || '未知错误'}`);
            }
            res.apiSuccess(resultList, `成功删除 ${successCount} 个用户`);
        } catch (error) {
            res.apiError(null, error.message);
        }
    }
}

module.exports = UserController;