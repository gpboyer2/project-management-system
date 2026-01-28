/**
 * 报文差异对比工具函数
 * 用于处理报文结构深拷贝、模拟本地版本差异等
 */

/**
 * 深拷贝字段列表（排除循环引用属性）
 * @param {any[]} fieldList - 待拷贝的字段列表
 * @returns {any[]} 深拷贝后的字段列表
 */
export function deepCloneFieldList(fieldList: any[]): any[] {
  return fieldList.map(field => {
    const clone: any = {};
    for (const key of Object.keys(field)) {
      // 排除循环引用属性
      if (key.startsWith('_')) continue;
      const value = field[key];
      if (Array.isArray(value)) {
        clone[key] = deepCloneFieldList(value);
      } else if (value && typeof value === 'object') {
        clone[key] = { ...value };
      } else {
        clone[key] = value;
      }
    }
    return clone;
  });
}

/**
 * 模拟本地版本（用于演示差异）
 * 实际应从节点接口配置的缓存中获取
 * @param {any[]} latestFieldList - 最新版本的字段列表
 * @param {boolean} hasChanges - 是否存在变更标志
 * @returns {any[]} 模拟的本地版本字段列表
 */
export function simulateLocalVersion(latestFieldList: any[], hasChanges: boolean): any[] {
  if (!hasChanges || latestFieldList.length === 0) {
    return deepCloneFieldList(latestFieldList);
  }
  
  // 模拟差异：复制并修改
  const localList = deepCloneFieldList(latestFieldList);
  
  // 移除最后一个字段（模拟新增）
  if (localList.length > 1) {
    localList.pop();
  }
  
  // 修改第一个字段的字节长度（模拟修改）
  if (localList.length > 0 && localList[0].byte_length) {
    localList[0].byte_length = Math.max(1, localList[0].byte_length - 1);
  }
  
  return localList;
}

