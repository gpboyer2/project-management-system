// 测试 LogicFlow 的 getGraphData 方法返回的数据结构
const fs = require('fs');

// 模拟 LogicFlow 节点数据
const mockGraphData = {
  nodes: [
    {
      id: '1',
      type: 'bpmn:userTask',
      x: 100,
      y: 100,
      text: {
        value: '测试节点1',
        x: 0,
        y: 0
      },
      properties: {
        nodeData: {
          id: 1,
          review_id: 1,
          name: '测试节点1',
          node_type_id: 2,
          x: 100,
          y: 100,
          node_order: 0,
          status: 1
        }
      }
    }
  ],
  edges: []
};

console.log('节点数据结构:', JSON.stringify(mockGraphData.nodes[0], null, 2));
console.log('text 字段类型:', typeof mockGraphData.nodes[0].text);
