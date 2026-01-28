# Claude Code Hook 安装助手提示词

复制下面整段内容，发送给 Claude，让 Claude 帮你安装语音提示功能：

---

你好，我需要在 Windows 上为 Claude Code 安装 Hook 功能，实现语音提示。

我有一个安装脚本 `install-claude-hooks.ps1`，请帮我：

1. 首先检查我的系统环境：
   - 检查 PowerShell 版本是否满足要求
   - 查找 Claude Code 的配置文件位置（可能在 %APPDATA%\claude\ 或 %USERPROFILE%\.claude\）

2. 备份我现有的 Claude 配置文件（如果存在）

3. 创建语音脚本，内容如下：
   - 创建目录 %USERPROFILE%\.claude\scripts\
   - 在该目录下创建 speak.cmd 文件，内容是：
     ```
     @echo off
     powershell.exe -NoProfile -Command "Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.Rate = 2; $s.Speak('%*')"
     ```

4. 测试语音脚本是否正常工作：
   - 运行命令测试： speak.cmd 你好
   - 如果没有声音，帮我诊断问题

5. 修改 Claude 的 settings.json 配置文件：
   - 读取现有配置（如果存在）
   - 添加以下 hooks 配置：
     ```json
     "hooks": {
       "PermissionRequest": [
         {
           "matcher": "*rm*|*mv*|*rmdir*|*sudo*|*cp -rf*|*rm -rf*",
           "hooks": [
             {
               "type": "command",
               "command": "语音脚本完整路径 请授权"
             }
           ]
         }
       ],
       "PreToolUse": [
         {
           "matcher": "*rm*|*mv*|*rmdir*|*sudo*|*cp -rf*|*rm -rf*",
           "hooks": [
             {
               "type": "command",
               "command": "语音脚本完整路径 请授权"
             }
           ]
         }
       ],
       "Notification": [
         {
           "matcher": "*",
           "hooks": [
             {
               "type": "command",
               "command": "语音脚本完整路径 请授权"
             }
           ]
         }
       ]
     }
     ```

6. 验证安装是否成功：
   - 检查 settings.json 格式是否正确
   - 告诉我如何测试 Hook 是否生效

请一步一步执行，每一步都告诉我执行结果。如果遇到任何问题，请帮我解决。

---

## 使用说明

1. 确保已将 `install-claude-hooks.ps1` 放在某个目录下（如桌面）
2. 打开 Claude Code
3. 复制上面整段内容，粘贴发送给 Claude
4. Claude 会帮你完成安装和诊断
