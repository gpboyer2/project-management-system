const http = require('http');
const data = JSON.stringify({
  nodes: [
    {
      id: 1,
      review_id: 1,
      name: '测试节点1',
      node_type_id: 2,
      x: 500,
      y: 500,
      node_order: 0,
      status: 1
    },
    {
      id: 2,
      review_id: 1,
      name: '测试节点2',
      node_type_id: 2,
      x: 700,
      y: 500,
      node_order: 0,
      status: 1
    },
    {
      id: 3,
      review_id: 1,
      name: '测试节点3',
      node_type_id: 3,
      x: 900,
      y: 500,
      node_order: 0,
      status: 1
    }
  ],
  relations: [
    {
      id: null,
      review_id: 1,
      source_node_id: 1,
      target_node_id: 2,
      relation_type: 1,
      condition: null
    },
    {
      id: null,
      review_id: 1,
      source_node_id: 2,
      target_node_id: 3,
      relation_type: 1,
      condition: null
    }
  ]
});

const options = {
  hostname: 'localhost',
  port: 9200,
  path: '/api/reviews/process/save',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlSWQiOjEsImlhdCI6MTc3MDIwMDY5OSwiZXhwIjoxNzcwMjg3MDk5fQ.NU3Yj-0QMfQqrhw6xfl5a6y6ukAWp9IQr5sc6J2FzH8',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`响应内容: ${chunk}`);
  });
  res.on('end', () => {
    console.log('响应结束');
  });
});

req.on('error', (err) => {
  console.error(`请求错误: ${err.message}`);
});

req.write(data);
req.end();
