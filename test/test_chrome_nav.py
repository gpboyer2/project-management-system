#!/usr/bin/env python3
"""Chrome DevTools Protocol 导航测试脚本

使用方法:
1. 启动 Chrome 远程调试模式:
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

2. 运行测试脚本:
   python3 test/test_chrome_nav.py
"""

import asyncio
import websockets
import json
import http.client

# Chrome DevTools HTTP 端点 (用于获取可用的 tabs)
HTTP_URL = "127.0.0.1"
HTTP_PORT = 9222

# 测试页面列表
TEST_PAGES = [
    ("欢迎页", "http://localhost:9300/#/"),
    ("仪表板", "http://localhost:9300/#/editor/ide/dashboard"),
    ("节点列表", "http://localhost:9300/#/editor/ide/node/list"),
    ("接口列表", "http://localhost:9300/#/editor/ide/interface/list"),
    ("逻辑列表", "http://localhost:9300/#/editor/ide/logic/list"),
    ("ICD列表", "http://localhost:9300/#/editor/ide/icd/list"),
    ("报文列表", "http://localhost:9300/#/editor/ide/packet/list"),
]


def get_chrome_ws_url():
    """动态获取 Chrome DevTools WebSocket URL"""
    try:
        conn = http.client.HTTPConnection(HTTP_URL, HTTP_PORT)
        conn.request("GET", "/json")
        response = conn.getresponse()

        if response.status != 200:
            print(f"错误: 无法连接到 Chrome DevTools (HTTP {response.status})")
            print("请确保 Chrome 以远程调试模式启动:")
            print("  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222")
            return None

        data = response.read().decode('utf-8')
        tabs = json.loads(data)

        # 查找类型为 page 的标签页
        for tab in tabs:
            if tab.get("type") == "page":
                return tab.get("webSocketDebuggerUrl")

        print("错误: 未找到可用的 Chrome 页面标签")
        return None

    except ConnectionRefusedError:
        print("错误: 无法连接到 Chrome DevTools 端口 9222")
        print("请确保 Chrome 以远程调试模式启动:")
        print("  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222")
        return None
    except Exception as e:
        print(f"错误: 获取 Chrome WebSocket URL 失败 - {e}")
        return None
    finally:
        if 'conn' in locals():
            conn.close()


async def navigate_and_test(url, title, ws):
    """导航到指定URL并获取页面信息"""
    # 启用 Page domain
    await ws.send(json.dumps({"id": 1, "method": "Page.enable"}))
    await ws.recv()

    # 导航
    print(f"\n{'='*50}")
    print(f"测试: {title}")
    print(f"URL: {url}")
    print(f"{'='*50}")

    await ws.send(json.dumps({
        "id": 2,
        "method": "Page.navigate",
        "params": {"url": url}
    }))

    # 等待导航完成
    max_attempts = 30  # 最多等待 30 次
    attempt = 0

    while attempt < max_attempts:
        msg = await ws.recv()
        data = json.loads(msg)

        if data.get("method") == "Page.loadEventFired":
            break

        if "error" in data:
            print(f"Error: {data}")
            break

        attempt += 1

    if attempt >= max_attempts:
        print("警告: 页面加载超时")
        return

    # 获取文档标题
    await ws.send(json.dumps({
        "id": 3,
        "method": "DOM.getDocument",
        "params": {"depth": 0}
    }))
    msg = await ws.recv()
    data = json.loads(msg)

    # 获取页面 HTML 内容（部分）
    node_id = data.get("result", {}).get("root", {}).get("nodeId", 1)

    await ws.send(json.dumps({
        "id": 4,
        "method": "DOM.getOuterHTML",
        "params": {"nodeId": node_id}
    }))
    msg = await ws.recv()
    data = json.loads(msg)

    outer_html = data.get("result", {}).get("outerHTML", "")

    # 检查关键元素
    checks = {
        "有标题": "<h2" in outer_html or "<h1" in outer_html,
        "有内容": "class=" in outer_html,
        "有编辑器": "editor" in outer_html.lower(),
    }

    for check, result in checks.items():
        status = "OK" if result else "NG"
        symbol = "OK" if result else "X"
        print(f"  [{symbol}] {check}")

    # 等待一下再继续
    await asyncio.sleep(0.5)


async def main():
    # 动态获取 WebSocket URL
    ws_url = get_chrome_ws_url()

    if not ws_url:
        print("\n退出测试")
        return

    print(f"已连接到 Chrome DevTools")
    print(f"WebSocket URL: {ws_url[:50]}...")

    try:
        async with websockets.connect(ws_url) as ws:
            print("开始测试...\n")

            for title, url in TEST_PAGES:
                try:
                    await navigate_and_test(url, title, ws)
                except Exception as e:
                    print(f"  [X] 测试失败: {e}")

            print(f"\n{'='*50}")
            print("测试完成!")

    except websockets.exceptions.ConnectionClosed:
        print("\n错误: WebSocket 连接已关闭")
    except Exception as e:
        print(f"\n错误: {e}")


if __name__ == "__main__":
    asyncio.run(main())
