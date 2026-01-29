# Open Typeless

> **This project is a showcase for the [Trellis](https://github.com/mindfold-ai/Trellis) framework.**
>
> **本项目是 [Trellis](https://github.com/mindfold-ai/Trellis) 框架的示例项目。**

---

macOS 语音输入工具，按住快捷键说话，松开自动将文字插入到光标位置。

## 功能特性

- 🎤 **Push-to-Talk** - 按住右 Option 键说话，松开自动输入
- ⚡ **实时转录** - 基于火山引擎大模型，流式显示识别结果
- 🪟 **悬浮窗显示** - 毛玻璃效果，显示录音状态和转录文字
- 🎯 **光标插入** - 自动将文字插入到当前光标位置，无需切换窗口
- 🔒 **不抢焦点** - 悬浮窗不会打断你的工作流

## 系统要求

- macOS 12.0+
- Node.js 18+
- pnpm

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入火山引擎配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 火山引擎豆包语音识别配置
VOLCENGINE_APP_ID=你的APP_ID
VOLCENGINE_ACCESS_TOKEN=你的Access_Token
VOLCENGINE_RESOURCE_ID=volc.bigasr.sauc
```

### 3. 获取火山引擎配置

1. 访问 [火山引擎控制台](https://console.volcengine.com/)
2. 开通「语音技术」-「流式语音识别大模型」服务
3. 创建应用，获取 `APP_ID`
4. 在「流式语音识别大模型」页面，点击眼睛图标获取 `Access Token`
5. Resource ID 可选：
   - `volc.bigasr.sauc` - 大模型 1.0 流式识别
   - `volc.seedasr.sauc` - 大模型 2.0 流式识别 (推荐)

### 4. 启动应用

```bash
pnpm start
```

### 5. 授权系统权限

首次启动时，需要授权以下权限：

- **麦克风权限** - 用于录音
- **辅助功能权限** - 用于全局快捷键和文字插入

在「系统设置」-「隐私与安全性」中授权。

## 使用方法

1. 启动应用后，会在后台运行
2. 在任意应用中，**按住右 Option 键**开始录音
3. 悬浮窗会显示 "Listening..." 和实时转录的文字
4. **松开按键**，文字会自动插入到当前光标位置
5. 悬浮窗会在 2 秒后自动隐藏

## 项目结构

```
src/
├── main.ts                 # Electron 主进程入口
├── preload.ts             # 预加载脚本 (IPC 桥接)
├── renderer.ts            # 渲染进程入口
├── main/
│   ├── ipc/               # IPC 处理器
│   ├── services/          # 主进程服务
│   │   ├── asr/           # 火山引擎 ASR 客户端
│   │   ├── keyboard/      # 全局键盘监听
│   │   └── push-to-talk/  # Push-to-Talk 协调服务
│   └── windows/           # 窗口管理
├── renderer/
│   └── src/modules/asr/   # ASR 相关 React 组件
└── shared/                # 共享类型和常量
```

## 开发

```bash
# 启动开发模式
pnpm start

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 打包
pnpm package

# 构建安装包
pnpm make
```

## 技术栈

- **Electron** - 跨平台桌面应用框架
- **React** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **火山引擎 ASR** - 语音识别服务
- **uiohook-napi** - 全局键盘监听
- **node-insert-text** - 文字插入

## 常见问题

### Q: 快捷键没有反应？

确保已授权「辅助功能」权限。在「系统设置」-「隐私与安全性」-「辅助功能」中添加应用。

### Q: 文字无法插入？

1. 确保目标应用支持文字输入
2. 确保光标在文本输入区域
3. 检查「辅助功能」权限是否正确授权

### Q: 语音识别延迟较高？

首次连接火山引擎服务需要建立 WebSocket 连接，可能有 1-2 秒延迟。后续使用会更快。

### Q: 如何更换快捷键？

目前快捷键固定为右 Option 键。如需自定义，可修改 `src/main/services/keyboard/keyboard.service.ts` 中的 `triggerKey` 配置。

## License

MIT
