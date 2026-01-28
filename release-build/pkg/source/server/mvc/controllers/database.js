// 数据库管理控制器
const { sequelize } = require('../../database/sequelize');
const { QueryTypes } = require('sequelize');

class DatabaseController {
    // 获取所有表列表
    static async getTableList(req, res) {
        try {
            const results = await sequelize.query(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
                { type: QueryTypes.SELECT }
            );
            const tableList = results.map(row => row.name);
            res.apiSuccess({ list: tableList, pagination: { current_page: 1, page_size: 100, total: tableList.length } });
        } catch (error) {
            res.apiError(null, error.message);
        }
    }

    // 获取表结构
    static async getTableSchema(req, res) {
        try {
            const { tableName } = req.query;
            if (!tableName) {
                return res.apiError(null, '表名不能为空');
            }
            // 获取表结构
            const [columns] = await sequelize.query(`PRAGMA table_info("${tableName}")`);
            // 获取表的行数
            const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
            const rowCount = countResult[0]?.count || 0;
            
            res.apiSuccess({
                tableName,
                columns: columns.map(col => ({
                    name: col.name,
                    type: col.type,
                    notNull: col.notnull === 1,
                    defaultValue: col.dflt_value,
                    primaryKey: col.pk === 1
                })),
                rowCount
            });
        } catch (error) {
            res.apiError(null, error.message);
        }
    }

    // 查询表数据
    static async queryData(req, res) {
        try {
            const { tableName, current_page = 1, page_size = 20, keyword = '', orderBy = '', orderDir = 'ASC' } = req.body;
            if (!tableName) {
                return res.apiError(null, '表名不能为空');
            }

            const offset = (current_page - 1) * page_size;

            // 获取表结构用于搜索
            const [columns] = await sequelize.query(`PRAGMA table_info("${tableName}")`);
            const columnNameList = columns.map(col => col.name);

            // 构建搜索条件
            let whereClause = '';
            if (keyword) {
                const searchConditionList = columnNameList.map(col => `"${col}" LIKE '%${keyword}%'`);
                whereClause = `WHERE ${searchConditionList.join(' OR ')}`;
            }

            // 构建排序
            let orderClause = '';
            if (orderBy && columnNameList.includes(orderBy)) {
                orderClause = `ORDER BY "${orderBy}" ${orderDir === 'DESC' ? 'DESC' : 'ASC'}`;
            }

            // 查询总数
            const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}" ${whereClause}`);
            const total = countResult[0]?.count || 0;

            // 查询数据
            const [dataList] = await sequelize.query(
                `SELECT * FROM "${tableName}" ${whereClause} ${orderClause} LIMIT ${page_size} OFFSET ${offset}`
            );

            // 后处理：解析 JSON 字段
            const processedList = DatabaseController.parseJsonFields(dataList, tableName);

            res.apiSuccess({
                list: processedList,
                columns: columnNameList,
                pagination: { current_page: parseInt(current_page), page_size: parseInt(page_size), total }
            });
        } catch (error) {
            console.error('[DatabaseController.queryData] Error:', error.message);
            console.error('[DatabaseController.queryData] Stack:', error.stack);
            res.apiError(null, error.message);
        }
    }

    // 解析 JSON 字段（用于原生 SQL 查询结果的后处理）
    static parseJsonFields(dataList, tableName) {
        if (!Array.isArray(dataList)) {
            return dataList;
        }

        // 定义需要解析 JSON 字段的表映射
        const jsonFieldMap = {
            'node_types': ['fields'],
            'packet_messages': ['fields'],
            'communication_nodes': ['endpoint_description', 'config'],
            'flowcharts': ['nodes', 'edges'],
            'system_level_design_tree_nodes': ['properties']
        };

        const jsonFieldList = jsonFieldMap[tableName];
        if (!jsonFieldList) {
            return dataList;
        }

        return dataList.map(row => {
            if (!row || typeof row !== 'object') {
                return row;
            }
            const newRow = { ...row };
            for (const field of jsonFieldList) {
                if (row[field]) {
                    try {
                        newRow[field] = typeof row[field] === 'string'
                            ? JSON.parse(row[field])
                            : row[field];
                    } catch (e) {
                        // 解析失败保持原值
                        newRow[field] = row[field];
                    }
                }
            }
            return newRow;
        });
    }

    // 新增数据
    static async createData(req, res) {
        try {
            const { tableName, data } = req.body;
            if (!tableName || !data || !Array.isArray(data) || data.length === 0) {
                return res.apiError(null, '参数错误');
            }
            
            const resultList = [];
            for (const row of data) {
                const columnList = Object.keys(row);
                const valueList = Object.values(row);
                const placeholderList = valueList.map(() => '?');
                
                try {
                    await sequelize.query(
                        `INSERT INTO "${tableName}" (${columnList.map(c => `"${c}"`).join(', ')}) VALUES (${placeholderList.join(', ')})`,
                        { replacements: valueList, type: QueryTypes.INSERT }
                    );
                    resultList.push({ success: true });
                } catch (err) {
                    resultList.push({ success: false, message: err.message });
                }
            }
            
            const successCount = resultList.filter(r => r.success).length;
            // 全部失败时返回错误
            if (successCount === 0) {
                const failedMessage = resultList.map(r => r.message).filter(Boolean).join('; ');
                return res.apiError(null, `新增失败: ${failedMessage || '未知错误'}`);
            }
            res.apiSuccess(resultList, `成功新增 ${successCount} 条数据`);
        } catch (error) {
            res.apiError(null, error.message);
        }
    }

    // 更新数据
    static async updateData(req, res) {
        try {
            const { tableName, data, primaryKey } = req.body;
            if (!tableName || !data || !Array.isArray(data) || data.length === 0 || !primaryKey) {
                return res.apiError(null, '参数错误');
            }
            
            const resultList = [];
            for (const row of data) {
                const pkValue = row[primaryKey];
                if (pkValue === undefined) {
                    resultList.push({ success: false, message: '缺少主键值' });
                    continue;
                }
                
                const updateData = { ...row };
                delete updateData[primaryKey];
                
                const setClauseList = Object.keys(updateData).map(key => `"${key}" = ?`);
                const valueList = [...Object.values(updateData), pkValue];
                
                try {
                    await sequelize.query(
                        `UPDATE "${tableName}" SET ${setClauseList.join(', ')} WHERE "${primaryKey}" = ?`,
                        { replacements: valueList, type: QueryTypes.UPDATE }
                    );
                    resultList.push({ success: true, [primaryKey]: pkValue });
                } catch (err) {
                    resultList.push({ success: false, [primaryKey]: pkValue, message: err.message });
                }
            }
            
            const successCount = resultList.filter(r => r.success).length;
            // 全部失败时返回错误
            if (successCount === 0) {
                const failedMessage = resultList.map(r => r.message).filter(Boolean).join('; ');
                return res.apiError(null, `更新失败: ${failedMessage || '未知错误'}`);
            }
            res.apiSuccess(resultList, `成功更新 ${successCount} 条数据`);
        } catch (error) {
            res.apiError(null, error.message);
        }
    }

    // 删除数据
    static async deleteData(req, res) {
        try {
            const { tableName, primaryKey, data } = req.body;
            if (!tableName || !primaryKey || !data || !Array.isArray(data) || data.length === 0) {
                return res.apiError(null, '参数错误');
            }
            
            const resultList = [];
            for (const pkValue of data) {
                try {
                    await sequelize.query(
                        `DELETE FROM "${tableName}" WHERE "${primaryKey}" = ?`,
                        { replacements: [pkValue], type: QueryTypes.DELETE }
                    );
                    resultList.push({ success: true, [primaryKey]: pkValue });
                } catch (err) {
                    resultList.push({ success: false, [primaryKey]: pkValue, message: err.message });
                }
            }
            
            const successCount = resultList.filter(r => r.success).length;
            // 全部失败时返回错误
            if (successCount === 0) {
                const failedMessage = resultList.map(r => r.message).filter(Boolean).join('; ');
                return res.apiError(null, `删除失败: ${failedMessage || '未知错误'}`);
            }
            res.apiSuccess(resultList, `成功删除 ${successCount} 条数据`);
        } catch (error) {
            res.apiError(null, error.message);
        }
    }

    // 执行自定义SQL（仅查询）
    static async executeQuery(req, res) {
        try {
            const { sql } = req.body;
            if (!sql) {
                return res.apiError(null, 'SQL语句不能为空');
            }
            
            // 安全检查：只允许SELECT语句
            const trimmedSql = sql.trim().toUpperCase();
            if (!trimmedSql.startsWith('SELECT')) {
                return res.apiError(null, '只允许执行SELECT查询语句');
            }
            
            const [results] = await sequelize.query(sql);
            const columnList = results.length > 0 ? Object.keys(results[0]) : [];
            
            res.apiSuccess({
                list: results,
                columns: columnList,
                pagination: { current_page: 1, page_size: results.length, total: results.length }
            });
        } catch (error) {
            res.apiError(null, error.message);
        }
    }
}

module.exports = DatabaseController;
