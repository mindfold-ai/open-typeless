# Floating Window 位置和样式优化

## Goal

实现专业美观的 ASR 悬浮窗，提供良好的视觉反馈。

## 窗口属性

| 属性 | 值 | 说明 |
|------|-----|------|
| 尺寸 | 320px × 58-112px | 宽度固定，高度动态（1-4行） |
| 位置 | 屏幕底部居中 | 距底边 80px |
| 样式 | 无边框、透明、圆角 | macOS 原生毛玻璃效果 |
| 行为 | 始终置顶 | 不抢焦点、跨桌面/全屏可见 |

```typescript
// BrowserWindow 配置
{
  width: 320,
  height: 58,
  frame: false,
  transparent: true,
  alwaysOnTop: true,
  focusable: false,
  vibrancy: "popover",
  visibleOnAllWorkspaces: true,
  fullscreenable: false,
}
```

## 视觉样式

```
┌──────────────────────────────────────┐
│  ● Listening...                      │  <- 状态指示器
├──────────────────────────────────────┤
│  你好世界这是识别的文字              │  <- 最终文字（白色）
│  正在识别中...                       │  <- 临时文字（灰色斜体）
└──────────────────────────────────────┘
```

### CSS 样式

- 背景: `rgba(28, 28, 30, 0.92)` 半透明深色 + `blur(20px)` 模糊
- 边框: `1px solid rgba(255, 255, 255, 0.08)` 微光边框
- 圆角: `10px`
- 录音指示点:
  - 静止: `#48484a` 灰色
  - 录音中: `#ff453a` 红色 + 呼吸动画 + 发光阴影

## 状态机

| 状态 | 录音指示 | statusText | 行为 |
|------|----------|------------|------|
| 待机 (idle) | 灰点 | "Hold Right ⌥" | 等待触发 |
| 连接中 (connecting) | 红点 | "Listening..." | ASR WebSocket 连接 |
| 录音中 (listening) | 红点闪烁 | "Listening..." | 实时转写 |
| 处理中 (processing) | 红点 | "Processing..." | 等待最终结果 |
| 粘贴中 (pasting) | 灰点 | "Pasting..." | 插入文字到目标 |
| 错误 (error) | 灰点 | 错误信息 | 显示错误信息 |

## 高度自适应

窗口高度根据文字内容动态调整：

- 单行: 58px (最小高度)
- 多行: 向上扩展 (每行 +18px)
- 四行: 112px (最大高度，超出滚动)

**关键**: 向上扩展，底边固定，避免遮挡输入区域。

## 文字展示

| 元素 | 颜色 | 说明 |
|------|------|------|
| final-text | `#fff` 白色 | 已确认的文字 |
| interim-text | `#636366` 灰色斜体 | 正在识别的文字 |

### 实时流式展示 Bug 修复

当前 `FloatingWindow.tsx` 只在 `processing` 或 `done` 状态显示文字，导致录音过程中无法看到实时转写结果。

**问题代码** (FloatingWindow.tsx line 34):
```tsx
const hasTranscriptText = Boolean(result?.text) && isProcessingOrDone;
```

**修复**: 需要在 `listening` 状态也显示文字：
```tsx
const hasTranscriptText = Boolean(result?.text) &&
  (status === 'listening' || status === 'processing' || status === 'done');
```

这样用户在录音过程中就能实时看到 ASR 返回的 interim 和 final 文字。

## 实现文件

- `src/main/windows/floating.ts` - 窗口配置和定位
- `src/renderer/src/modules/asr/components/FloatingWindow.tsx` - React 组件
- `src/renderer/src/styles/components/floating-window.css` - 样式

## Acceptance Criteria

- [ ] 窗口位置：屏幕底部居中，距底边 80px
- [ ] 毛玻璃效果 + 半透明深色背景
- [ ] 状态指示器动画（呼吸效果）
- [ ] 高度自适应（向上扩展）
- [ ] 最终文字白色，临时文字灰色斜体
- [ ] 实时流式展示：`listening` 状态下也显示转写文字
- [ ] `pnpm lint` 通过
- [ ] `pnpm typecheck` 通过
