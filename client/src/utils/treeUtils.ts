// 树形数据操作工具函数

/**
 * 递归查找树中符合条件的节点
 * @param node_list - 节点列表
 * @param predicate - 查找条件函数
 * @returns 找到的节点或 null
 */
export function findTreeNode<T extends { children?: T[] }>(
  node_list: T[],
  predicate: (node: T) => boolean
): T | null {
  for (const node of node_list) {
    if (predicate(node)) {
      return node;
    }
    if (node.children && node.children.length > 0) {
      const found = findTreeNode(node.children, predicate);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 根据 id 查找树节点
 * @param node_list - 节点列表
 * @param id - 节点 id
 * @returns 找到的节点或 null
 */
export function findTreeNodeById<T extends { id?: string | number; children?: T[] }>(
  node_list: T[],
  id: string | number
): T | null {
  return findTreeNode(node_list, (node) => node.id === id);
}

/**
 * 根据自定义属性查找树节点
 * @param node_list - 节点列表
 * @param key - 属性名
 * @param value - 属性值
 * @returns 找到的节点或 null
 */
export function findTreeNodeByProp<T extends Record<string, any> & { children?: T[] }>(
  node_list: T[],
  key: string,
  value: any
): T | null {
  return findTreeNode(node_list, (node) => node[key] === value);
}

/**
 * 查找树节点的父节点
 * @param node_list - 节点列表
 * @param predicate - 查找条件函数
 * @returns 包含父节点的对象或 null
 */
export function findTreeNodeParent<T extends { children?: T[] }>(
  node_list: T[],
  predicate: (node: T) => boolean
): { parent: T; node: T } | null {
  for (const node of node_list) {
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        if (predicate(child)) {
          return { parent: node, node: child };
        }
      }
      const found = findTreeNodeParent(node.children, predicate);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 根据 id 查找父节点
 * @param node_list - 节点列表
 * @param id - 节点 id
 * @returns 包含父节点的对象或 null
 */
export function findTreeNodeParentById<T extends { id?: string | number; children?: T[] }>(
  node_list: T[],
  id: string | number
): { parent: T; node: T } | null {
  return findTreeNodeParent(node_list, (node) => node.id === id);
}

/**
 * 获取树节点的层级深度
 * @param node - 节点
 * @param root_level - 根层级，默认为 0
 * @returns 层级深度
 */
export function getTreeNodeLevel<T extends { level?: number; children?: T[] }>(
  node: T,
  root_level = 0
): number {
  if (node.level !== undefined) {
    return node.level;
  }
  return root_level;
}

/**
 * 判断节点是否可以包含子节点
 * @param node_type - 节点类型
 * @param can_have_children_types - 可以包含子节点的类型列表
 * @returns 是否可以包含子节点
 */
export function canNodeHaveChildren(
  node_type: string | undefined,
  can_have_children_types: string[] = ['Struct', 'Array']
): boolean {
  if (!node_type) return false;
  return can_have_children_types.includes(node_type);
}

/**
 * 扁平化树形结构
 * @param node_list - 节点列表
 * @returns 扁平化的节点数组
 */
export function flattenTree<T extends { children?: T[] }>(node_list: T[]): T[] {
  const result: T[] = [];
  function traverse(nodes: T[]) {
    for (const node of nodes) {
      result.push(node);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }
  traverse(node_list);
  return result;
}

/**
 * 根据路径查找树节点
 * @param node_list - 节点列表
 * @param path - 路径数组（每层的索引）
 * @returns 找到的节点或 null
 */
export function findNodeByPath<T extends { children?: T[] }>(
  node_list: T[],
  path: number[]
): T | null {
  let current: T | null = null;
  let nodes = node_list;

  for (let i = 0; i < path.length; i++) {
    const index = path[i];
    if (index < 0 || index >= nodes.length) {
      return null;
    }
    current = nodes[index];
    if (i < path.length - 1) {
      nodes = current.children || [];
    }
  }

  return current;
}

/**
 * 根据路径数组查找树节点（支持动态层级）
 * @param node_list - 节点列表
 * @param path - 路径数组（每层的节点ID）
 * @param id_key - ID字段名，默认为'id'
 * @returns 找到的节点或 null
 */
export function findNodeByPathIds<T extends { children?: T[] } & Record<string, any>>(
  node_list: T[],
  path: (string | number)[],
  id_key = 'id'
): T | null {
  if (!path || path.length === 0) return null;

  let currentList = node_list;
  let targetNode: T | null = null;

  for (let i = 0; i < path.length; i++) {
    const pathId = path[i];
    targetNode = null;

    for (const node of currentList) {
      if (node[id_key] === pathId) {
        targetNode = node;
        break;
      }
    }

    if (!targetNode) return null;

    if (i < path.length - 1) {
      if (!targetNode.children || targetNode.children.length === 0) {
        return null;
      }
      currentList = targetNode.children;
    }
  }

  return targetNode;
}

/**
 * 计算从根节点到指定节点的完整层级路径
 * @param node_list - 节点列表
 * @param target_id - 目标节点ID
 * @param id_key - ID字段名，默认为'id'
 * @returns 路径数组（每层的节点ID），未找到返回空数组
 */
export function getNodePath<T extends { children?: T[] } & Record<string, any>>(
  node_list: T[],
  target_id: string | number,
  id_key = 'id'
): (string | number)[] {
  const path: (string | number)[] = [];

  function dfs(nodes: T[]): boolean {
    for (const node of nodes) {
      path.push(node[id_key]);

      if (node[id_key] === target_id) {
        return true;
      }

      if (node.children && node.children.length > 0) {
        if (dfs(node.children)) {
          return true;
        }
      }

      path.pop();
    }
    return false;
  }

  dfs(node_list);
  return path;
}

/**
 * 计算树中指定节点的实际层级深度（从根节点开始遍历）
 * @param node_list - 节点列表
 * @param target_id - 目标节点ID
 * @param id_key - ID字段名，默认为'id'
 * @returns 层级深度（从0开始），未找到返回-1
 */
export function getNodeDepth<T extends { children?: T[] } & Record<string, any>>(
  node_list: T[],
  target_id: string | number,
  id_key = 'id'
): number {
  function dfs(nodes: T[], depth: number): number {
    for (const node of nodes) {
      if (node[id_key] === target_id) {
        return depth;
      }
      if (node.children && node.children.length > 0) {
        const found = dfs(node.children, depth + 1);
        if (found !== -1) return found;
      }
    }
    return -1;
  }

  return dfs(node_list, 0);
}

/**
 * 更新树中指定节点的属性
 * @param node_list - 节点列表
 * @param node_id - 节点ID
 * @param updates - 要更新的属性对象
 * @param id_key - ID字段名，默认为'id'
 * @returns 是否成功更新
 */
export function updateTreeNode<T extends { children?: T[] } & Record<string, any>>(
  node_list: T[],
  node_id: string | number,
  updates: Partial<T>,
  id_key = 'id'
): boolean {
  function dfs(nodes: T[]): boolean {
    for (const node of nodes) {
      if (node[id_key] === node_id) {
        Object.assign(node, updates);
        return true;
      }
      if (node.children && node.children.length > 0) {
        if (dfs(node.children)) {
          return true;
        }
      }
    }
    return false;
  }

  return dfs(node_list);
}

/**
 * 从树中移除指定节点
 * @param node_list - 节点列表
 * @param node_id - 节点ID
 * @param id_key - ID字段名，默认为'id'
 * @returns 是否成功移除
 */
export function removeTreeNode<T extends { children?: T[] } & Record<string, any>>(
  node_list: T[],
  node_id: string | number,
  id_key = 'id'
): boolean {
  function dfs(nodes: T[]): boolean {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      if (node[id_key] === node_id) {
        nodes.splice(i, 1);
        return true;
      }

      if (node.children && node.children.length > 0) {
        if (dfs(node.children)) {
          return true;
        }
      }
    }
    return false;
  }

  return dfs(node_list);
}

/**
 * 在指定父节点下插入子节点
 * @param node_list - 节点列表
 * @param parent_id - 父节点ID，null表示插入到根级别
 * @param new_node - 要插入的新节点
 * @param id_key - ID字段名，默认为'id'
 * @returns 是否成功插入
 */
export function insertTreeNode<T extends { children?: T[] } & Record<string, any>>(
  node_list: T[],
  parent_id: string | number | null,
  new_node: T,
  id_key = 'id'
): boolean {
  if (parent_id === null) {
    node_list.push(new_node);
    return true;
  }

  function dfs(nodes: T[]): boolean {
    for (const node of nodes) {
      if (node[id_key] === parent_id) {
        if (!node.children) {
          node.children = [];
        }
        node.children.push(new_node);
        return true;
      }
      if (node.children && node.children.length > 0) {
        if (dfs(node.children)) {
          return true;
        }
      }
    }
    return false;
  }

  return dfs(node_list);
}

/**
 * 构建树的层级映射（节点ID -> 层级深度）
 * @param node_list - 节点列表
 * @param id_key - ID字段名，默认为'id'
 * @returns 层级映射对象
 */
export function buildLevelMap<T extends { children?: T[] } & Record<string, any>>(
  node_list: T[],
  id_key = 'id'
): Record<string | number, number> {
  const levelMap: Record<string | number, number> = {};

  function dfs(nodes: T[], depth: number) {
    for (const node of nodes) {
      levelMap[node[id_key]] = depth;
      if (node.children && node.children.length > 0) {
        dfs(node.children, depth + 1);
      }
    }
  }

  dfs(node_list, 0);
  return levelMap;
}

// ==================== 字段结构专用函数 ====================

/**
 * 字段结构接口定义（支持 element 和 cases 特殊结构）
 */
export interface FieldNode extends Record<string, any> {
  id?: string | number;
  children?: FieldNode[];
  element?: FieldNode;
  cases?: Record<string, FieldNode>;
  fields?: FieldNode[];
  expanded?: boolean;
  isPlaceholder?: boolean;
  level?: number;
}

/**
 * 递归查找字段节点（支持 element 和 cases 特殊结构）
 * @param field_list - 字段列表
 * @param field_id - 字段ID
 * @returns 找到的字段节点或 null
 */
export function findFieldNodeById(field_list: FieldNode[], field_id: string | number): FieldNode | null {
  for (const field of field_list) {
    if (field.id === field_id) return field;

    // 递归查找 children
    if (Array.isArray(field.children) && field.children.length > 0) {
      const found = findFieldNodeById(field.children, field_id);
      if (found) return found;
    }

    // 递归查找 fields（字段结构使用的字段名）
    if (Array.isArray(field.fields) && field.fields.length > 0) {
      const found = findFieldNodeById(field.fields, field_id);
      if (found) return found;
    }

    // 递归查找 element（数组类型的元素）
    if (field.element) {
      const found = findFieldNodeById([field.element], field_id);
      if (found) return found;
    }

    // 递归查找 cases（命令类型的分支）
    if (field.cases && typeof field.cases === 'object') {
      for (const case_field of Object.values(field.cases)) {
        const found = findFieldNodeById([case_field as FieldNode], field_id);
        if (found) return found;
      }
    }
  }
  return null;
}

/**
 * 查找字段节点的父节点信息（支持 element 特殊结构）
 * @param field_list - 字段列表
 * @param field_id - 字段ID
 * @returns 包含父节点的对象或 null
 */
export function findFieldNodeParent(
  field_list: FieldNode[],
  field_id: string | number
): { parent: FieldNode } | null {
  for (const item of field_list) {
    // 检查 fields 子节点
    if (Array.isArray(item.fields) && item.fields.some((c: FieldNode) => c.id === field_id)) {
      return { parent: item };
    }

    // 递归查找 fields
    if (Array.isArray(item.fields) && item.fields.length > 0) {
      const result = findFieldNodeParent(item.fields, field_id);
      if (result) return result;
    }

    // 检查 element 子节点
    if (item.element && item.element.id === field_id) {
      return { parent: item };
    }
  }
  return null;
}

/**
 * 获取字段节点的层级（从外部传入的 levelMap 中获取）
 * @param field - 字段节点
 * @param level_map - 层级映射对象（ID -> 层级深度）
 * @returns 层级深度
 */
export function getFieldNodeLevel(field: FieldNode, level_map: Record<string | number, number>): number {
  if ((field as any).isPlaceholder) {
    return field.level || 0;
  }
  return field.id ? (level_map[field.id] || 0) : 0;
}

/**
 * 切换树节点的展开/折叠状态
 * @param node_list - 节点列表
 * @param node_id - 节点ID
 * @returns 是否成功切换
 */
export function toggleTreeNodeExpanded<T extends { id?: string | number; children?: T[]; expanded?: boolean }>(
  node_list: T[],
  node_id: string | number
): boolean {
  function toggle(nodes: T[]): boolean {
    for (const node of nodes) {
      if (node.id === node_id) {
        node.expanded = !node.expanded;
        return true;
      }
      if (node.children && toggle(node.children)) {
        return true;
      }
    }
    return false;
  }

  return toggle(node_list);
}

/**
 * 切换字段节点的展开/折叠状态（支持 fields 特殊结构）
 * @param field_list - 字段列表
 * @param field_id - 字段ID
 * @returns 是否成功切换
 */
export function toggleFieldNodeExpanded(field_list: FieldNode[], field_id: string | number): boolean {
  function toggle(fields: FieldNode[]): boolean {
    for (const field of fields) {
      if (field.id === field_id) {
        field.expanded = !field.expanded;
        return true;
      }
      if (field.fields && toggle(field.fields)) {
        return true;
      }
    }
    return false;
  }

  return toggle(field_list);
}

/**
 * 递归收集所有字段名称（支持 fields、element、cases 特殊结构）
 * @param field_list - 字段列表
 * @returns 包含所有字段名称的集合
 */
export function collect_all_field_names(field_list: FieldNode[]): Set<string> {
  const name_set = new Set<string>();

  function traverse(fields: FieldNode[]) {
    for (const field of fields) {
      // 兼容两种字段名：tree 节点使用 name，报文字段使用 field_name
      const name = String((field as any)?.name ?? '').trim();
      const field_name = String((field as any)?.field_name ?? '').trim();
      if (name) name_set.add(name);
      if (field_name) name_set.add(field_name);

      // 递归查找 children
      if (Array.isArray(field.children) && field.children.length > 0) {
        traverse(field.children);
      }

      // 递归查找 fields（字段结构使用的字段名）
      if (Array.isArray(field.fields) && field.fields.length > 0) {
        traverse(field.fields);
      }

      // 递归查找 element（数组类型的元素）
      if (field.element) {
        traverse([field.element]);
      }

      // 递归查找 cases（命令类型的分支）
      if (field.cases && typeof field.cases === 'object') {
        for (const case_field of Object.values(field.cases)) {
          traverse([case_field as FieldNode]);
        }
      }
    }
  }

  traverse(field_list);
  return name_set;
}

/**
 * 创建默认字段节点（自动生成唯一名称）
 * @param type - 字段类型
 * @param existing_names - 已存在的字段名称集合
 * @returns 新创建的字段节点
 */
export function create_default_field(type: string, existing_names: Set<string>): FieldNode {
  const base_name = 'new_field';
  let counter = 1;
  let field_name = base_name;

  // 自动生成唯一名称
  while (existing_names.has(field_name)) {
    field_name = `${base_name}_${counter}`;
    counter++;
  }

  return {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    name: field_name,
    type: type,
    description: '',
    children: []
  };
}

/**
 * 克隆字段类型（深拷贝字段结构，支持可选重命名）
 * @param field - 要克隆的字段节点
 * @param new_name - 新字段名称，不指定则使用原名称
 * @returns 克隆后的字段节点
 */
export function clone_field_type(field: FieldNode, new_name?: string): FieldNode {
  const cloned: FieldNode = {
    ...field,
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  };

  // 如果指定了新名称，覆盖原名称
  if (new_name) {
    cloned.name = new_name;
  }

  // 深拷贝 children
  if (field.children && Array.isArray(field.children)) {
    cloned.children = field.children.map(child => clone_field_type(child));
  }

  // 深拷贝 fields
  if (field.fields && Array.isArray(field.fields)) {
    cloned.fields = field.fields.map(child => clone_field_type(child));
  }

  // 深拷贝 element
  if (field.element) {
    cloned.element = clone_field_type(field.element);
  }

  // 深拷贝 cases
  if (field.cases && typeof field.cases === 'object') {
    cloned.cases = {};
    for (const [key, case_field] of Object.entries(field.cases)) {
      cloned.cases[key] = clone_field_type(case_field as FieldNode);
    }
  }

  return cloned;
}
