// 权限管理控制器，只提供增删改查四个接口，入参都是数组
const PermissionModel = require('../models/permission');

class PermissionController {
    // 查询权限列表（返回列表和树形结构）
    // params: { status }
    static async list(req, res) {
        try {
            const { status } = req.query;
            const list = await PermissionModel.findAll(status !== undefined ? parseInt(status) : 1);
            const tree = PermissionModel.buildTree(list);
            res.apiSuccess({ list, tree });
        } catch (error) {
            res.apiError(null, error.message);
        }
    }

    // 新增权限（支持批量）
    // data: [{ permission_name, permission_code, resource_type, resource_path, parent_id, sort_order }]
    static async create(req, res) {
        try {
            const { data } = req.body;
            if (!Array.isArray(data) || data.length === 0) {
                return res.apiError(null, '参数 data 必须是非空数组');
            }

            const resultList = [];
            for (const item of data) {
                // 验证必填字段
                if (!item.permission_name || !item.permission_code) {
                    resultList.push({ success: false, permission_code: item.permission_code, message: '权限名称和权限代码不能为空' });
                    continue;
                }

                // 验证 permission_name 类型
                if (typeof item.permission_name !== 'string') {
                    resultList.push({ success: false, permission_code: item.permission_code, message: '权限名称必须是字符串' });
                    continue;
                }
                // 验证 permission_name 长度（2-50字符）
                if (item.permission_name.trim().length < 2) {
                    resultList.push({ success: false, permission_code: item.permission_code, message: '权限名称长度不能少于2个字符' });
                    continue;
                }
                if (item.permission_name.length > 50) {
                    resultList.push({ success: false, permission_code: item.permission_code, message: '权限名称长度不能超过50个字符' });
                    continue;
                }

                // 验证 permission_code 类型
                if (typeof item.permission_code !== 'string') {
                    resultList.push({ success: false, permission_code: item.permission_code, message: '权限代码必须是字符串' });
                    continue;
                }

                // 检查权限代码是否已存在
                const existPermission = await PermissionModel.findByPermissionCode(item.permission_code);
                if (existPermission) {
                    resultList.push({ success: false, permission_code: item.permission_code, message: '权限代码已存在' });
                    continue;
                }
                const created = await PermissionModel.create(item);
                resultList.push({ success: true, permission_id: created.permission_id, permission_code: item.permission_code });
            }

            const successCount = resultList.filter(r => r.success).length;
            if (successCount === 0) {
                const failedMessage = resultList.map(r => r.message).filter(Boolean).join('; ');
                return res.apiError(resultList, `创建失败: ${failedMessage || '未知错误'}`);
            }
            res.apiSuccess(resultList, `成功创建 ${successCount} 个权限`);
        } catch (error) {
            res.apiError(null, error.message);
        }
    }

    // 更新权限（支持批量）
    // data: [{ permission_id, ...updateFields }]
    static async update(req, res) {
        try {
            const { data } = req.body;
            if (!Array.isArray(data) || data.length === 0) {
                return res.apiError(null, '参数 data 必须是非空数组');
            }

            const resultList = [];
            for (const item of data) {
                if (!item.permission_id) {
                    resultList.push({ success: false, message: '缺少 permission_id' });
                    continue;
                }
                const permission = await PermissionModel.findByPermissionId(item.permission_id);
                if (!permission) {
                    resultList.push({ success: false, permission_id: item.permission_id, message: '权限不存在' });
                    continue;
                }
                // 如果更新权限代码，检查是否重复
                if (item.permission_code && item.permission_code !== permission.permission_code) {
                    const existPermission = await PermissionModel.findByPermissionCode(item.permission_code);
                    if (existPermission) {
                        resultList.push({ success: false, permission_id: item.permission_id, message: '权限代码已存在' });
                        continue;
                    }
                }
                const { permission_id, ...updateData } = item;
                await PermissionModel.update(permission_id, updateData);
                resultList.push({ success: true, permission_id });
            }

            const successCount = resultList.filter(r => r.success).length;
            if (successCount === 0) {
                const failedMessage = resultList.map(r => r.message).filter(Boolean).join('; ');
                return res.apiError(resultList, `更新失败: ${failedMessage || '未知错误'}`);
            }
            res.apiSuccess(resultList, `成功更新 ${successCount} 个权限`);
        } catch (error) {
            res.apiError(null, error.message);
        }
    }

    // 删除权限（支持批量）
    // data: [PERMISSION_ID1, PERMISSION_ID2, ...]
    static async delete(req, res) {
        try {
            const { data } = req.body;
            if (!Array.isArray(data) || data.length === 0) {
                return res.apiError(null, '参数 data 必须是非空数组');
            }

            const resultList = [];
            for (const permissionId of data) {
                const permission = await PermissionModel.findByPermissionId(permissionId);
                if (!permission) {
                    resultList.push({ success: false, permission_id: permissionId, message: '权限不存在' });
                    continue;
                }
                await PermissionModel.delete(permissionId);
                resultList.push({ success: true, permission_id: permissionId });
            }

            const successCount = resultList.filter(r => r.success).length;
            if (successCount === 0) {
                const failedMessage = resultList.map(r => r.message).filter(Boolean).join('; ');
                return res.apiError(resultList, `删除失败: ${failedMessage || '未知错误'}`);
            }
            res.apiSuccess(resultList, `成功删除 ${successCount} 个权限`);
        } catch (error) {
            res.apiError(null, error.message);
        }
    }
}

module.exports = PermissionController;