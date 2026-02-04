const LogicFlow = require('@logicflow/core');
const { BpmnElement } = require('@logicflow/extension');

// 注册BPMN元素
LogicFlow.use(BpmnElement);

// 创建LogicFlow实例
const lf = new LogicFlow({
  container: null, // 我们不需要实际的DOM容器
  width: 800,
  height: 600
});

// 创建一个用户任务节点
const userTaskNode = lf.addNode({
  id: '1',
  type: 'bpmn:userTask',
  x: 100,
  y: 100,
  text: '测试节点'
});

// 打印节点的宽度和高度
console.log('节点类型:', userTaskNode.type);
console.log('节点宽度:', userTaskNode.width);
console.log('节点高度:', userTaskNode.height);
console.log('节点数据:', userTaskNode);

// 尝试获取其他类型的节点大小
const startEventNode = lf.addNode({
  id: '2',
  type: 'bpmn:startEvent',
  x: 200,
  y: 200,
  text: '开始事件'
});

console.log('\n开始事件节点类型:', startEventNode.type);
console.log('开始事件节点宽度:', startEventNode.width);
console.log('开始事件节点高度:', startEventNode.height);