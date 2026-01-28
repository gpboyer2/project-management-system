# 软件JSON数据格式规范

## 数据结构

```json
{
  "softwareName": "软件名称",
  "description": "软件描述",
  "commNodeList": [  // 通信节点list
    {
      "id": "comm-node-001",
      "name": "通信节点1",
      "type": "TCP",
      "nodeList": [ // 图元节点list
        {      // 图元1
          "id": "node-001", // 数据库对应的id
          "protocolName": "MyDeviceProtocolDispatcher",
          "description": "设备通信协议分发器，支持登录、心跳和数据上传三种报文类型",
          "dispatch": {
            "mode": "single",
            "field": "messageId",
            "type": "UnsignedInt",
            "byteOrder": "big",
            "offset": 0,
            "size": 2
          },
          "messages": {   // 报文list
            "协议的messageId": {  }   // 协议内容
          }
        },
        {   // 图元2
          "id": "node-002",
          "protocolName": "MultiProtocolDispatcher",
          "description": "多协议分发器",
          "dispatch": {
            "mode": "multiple",
            "field": "messageId",
            "type": "UnsignedInt",
            "byteOrder": "big",
            "offset": 0,
            "size": 2
          },
          "messages": {
            "协议的messageId": {  }, // 协议内容
            "协议的messageId": {  }   // 协议内容
          }
        }
      ]
    }
  ]
}
```
