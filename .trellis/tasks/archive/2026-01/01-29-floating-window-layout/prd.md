# Floating Window 布局与高度自适应

## Goal

修复悬浮窗的布局对齐问题，并实现内容高度自适应机制。

## 问题描述

1. **对齐问题**: 状态栏的 "Listening" 文字与左侧红点没有垂直对齐
2. **文字位置**: 转写文字区域位置偏下
3. **高度固定**: 文字过多时没有换行或高度扩展效果

## 窗口布局结构

```
┌─────────────────────────────────────┐ ─┬─ paddingTop: 10px
│  ● Listening...                     │  │  statusBarHeight: 11px
│─────────────────────────────────────│  │  statusBarPaddingBottom: 6px
│                                     │  │  statusBarBorder: 1px
│                                     │  │  gap: 6px
├─────────────────────────────────────┤ ─┼─ chromeHeight: 40px (固定)
│  识别的文字内容                      │  │
│  第二行...                          │  │  contentHeight: 18-72px (动态)
│  第三行...                          │  │
│  第四行...                          │  │
├─────────────────────────────────────┤ ─┴─
│                                     │     paddingBottom: 6px
└─────────────────────────────────────┘
     总高度 = chromeHeight + contentHeight
            = 40px + (18px × 行数)
            = 58px ~ 112px
```

## 尺寸配置

| 属性 | 值 | 说明 |
|------|-----|------|
| paddingTop | 10px | 顶部内边距 |
| paddingBottom | 6px | 底部内边距 |
| statusBarHeight | 11px | 状态栏字体大小 |
| statusBarPaddingBottom | 6px | 状态栏底部间距 |
| statusBarBorder | 1px | 状态栏底部分隔线 |
| gap | 6px | 状态栏与文字区间距 |
| lineHeight | 18px | 单行高度 (14px × 1.25) |
| maxLines | 4 | 最大显示行数 |
| chromeHeight | 40px | 固定部分高度 |
| minWindowHeight | 58px | 最小窗口高度 |
| maxWindowHeight | 112px | 最大窗口高度 |

## 高度自适应机制

### Renderer → Main IPC 通信

1. Renderer 进程更新文字后，测量 `scrollHeight`
2. 通过 IPC 调用 `setContentHeight(contentHeight)` 通知 Main 进程
3. Main 进程计算目标高度并调整窗口

### 计算逻辑

```typescript
// Main 进程
function setContentHeight(contentHeight: number): void {
  const SINGLE_LINE = 18;
  const CHROME_HEIGHT = 40;
  const MIN_HEIGHT = 58;
  const MAX_HEIGHT = 112;

  let targetHeight: number;

  if (contentHeight <= SINGLE_LINE) {
    targetHeight = MIN_HEIGHT;
  } else {
    targetHeight = Math.min(CHROME_HEIGHT + contentHeight, MAX_HEIGHT);
  }

  // 防抖：变化 < 4px 时忽略
  if (Math.abs(targetHeight - currentHeight) < 4) return;

  // 向上扩展（底边固定）
  const heightDiff = targetHeight - currentHeight;
  window.setBounds({
    x,
    y: y - heightDiff,  // Y 上移 = 窗口向上扩展
    width,
    height: targetHeight,
  });
}
```

### 向上扩展原理

- 悬浮窗位于屏幕底部
- 向下扩展会遮挡输入区域
- 向上扩展符合用户预期
- 底边位置始终保持固定

## 边界情况

| 场景 | contentHeight | targetHeight | 行为 |
|------|---------------|--------------|------|
| 空内容 | 0 | 58px | 最小高度 |
| 单行 | 18px | 58px | 最小高度 |
| 两行 | 36px | 76px | 向上扩展 18px |
| 三行 | 54px | 94px | 向上扩展 36px |
| 四行 | 72px | 112px | 最大高度 |
| 五行+ | 90px+ | 112px | 锁定最大，内部滚动 |
| 微小变化 | ±3px | 不变 | 防抖忽略 |

## CSS 要求

```css
#transcription {
  font-size: 14px;
  line-height: 1.25;        /* 14 × 1.25 ≈ 18px */
  max-height: 72px;         /* 4 行 × 18px */
  overflow-y: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;    /* 隐藏滚动条 */
}
```

## 实现文件

- `src/main/windows/floating.ts` - 窗口高度控制
- `src/main/ipc/floating.handler.ts` - IPC handler (新增)
- `src/shared/constants/channels.ts` - IPC channel 定义
- `src/renderer/src/modules/asr/components/FloatingWindow.tsx` - React 组件
- `src/renderer/src/styles/components/floating-window.css` - 样式

## Acceptance Criteria

- [ ] 状态指示器（红点）与 "Listening" 文字垂直居中对齐
- [ ] 文字区域布局符合设计规范
- [ ] 单行内容时窗口高度为 58px
- [ ] 多行内容时窗口向上扩展
- [ ] 最大高度 112px，超出内容可滚动
- [ ] 高度变化有防抖（< 4px 忽略）
- [ ] 底边位置固定不变
- [ ] `pnpm lint` 通过
- [ ] `pnpm typecheck` 通过
