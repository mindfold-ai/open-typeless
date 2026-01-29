# Select Relevant Specs from electron-doc

## Goal
从 `electron-doc/` 目录中筛选与 open-typeless 项目相关的规范文档，复制到 `.trellis/spec/` 目录中。

## Background
open-typeless 是一个 macOS 语音输入工具，核心技术栈：
- Electron (Main + Renderer)
- uiohook-napi (全局键盘监听)
- node-hid (蓝牙遥控器)
- Volcengine ASR (语音识别 WebSocket)
- @xitanggg/node-insert-text (文字插入)

## Requirements

### HIGH Priority - 必须复制
| 源文件 | 目标位置 | 原因 |
|--------|----------|------|
| `big-question/global-keyboard-hooks.md` | `spec/backend/` | Push-to-talk 核心功能 |
| `big-question/bluetooth-hid-device.md` | `spec/backend/` | 蓝牙遥控器支持 |
| `big-question/ipc-handler-registration.md` | `spec/backend/` | IPC 注册链路 |
| `big-question/native-module-packaging.md` | `spec/shared/` | 原生模块打包 |
| `backend/macos-permissions.md` | `spec/backend/` | macOS 权限管理 |
| `backend/text-input.md` | `spec/backend/` | 文字插入功能 |
| `backend/error-handling.md` | `spec/backend/` | 错误处理模式 |
| `backend/directory-structure.md` | `spec/backend/` | 目录结构规范 |
| `frontend/ipc-electron.md` | `spec/frontend/` | IPC 通信模式 |
| `shared/pnpm-electron-setup.md` | `spec/shared/` | pnpm 配置 |

### MEDIUM Priority - 推荐复制
| 源文件 | 目标位置 | 原因 |
|--------|----------|------|
| `backend/type-safety.md` | `spec/backend/` | 类型安全 |
| `backend/logging.md` | `spec/backend/` | 日志规范 |
| `frontend/directory-structure.md` | `spec/frontend/` | 前端目录结构 |
| `frontend/state-management.md` | `spec/frontend/` | 状态管理 |
| `frontend/react-pitfalls.md` | `spec/frontend/` | React 常见陷阱 |
| `shared/typescript.md` | `spec/shared/` | TypeScript 规范 |
| `guides/pre-implementation-checklist.md` | `spec/guides/` | 实现前检查清单 |

### LOW Priority - 暂不复制
- Database 相关 (pagination, database, transaction)
- CSS 相关 (css-flex-centering, css-design)
- Git 规范 (git-conventions)

## Acceptance Criteria
- [ ] HIGH priority 文件全部复制到 spec 目录
- [ ] 每个目录有 index.md 索引文件
- [ ] 文件内容根据项目需求适当调整（移除不相关部分）

## Technical Notes
- 保持原有目录结构 (backend/, frontend/, shared/, guides/)
- 更新 index.md 中的文件列表
- 可合并相关文档（如 ipc-electron + ipc-handler-registration）
