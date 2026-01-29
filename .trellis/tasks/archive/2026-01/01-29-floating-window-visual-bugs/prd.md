# Floating Window 视觉 Bug 修复

## Goal

修复悬浮窗的三个视觉问题，提升用户体验。

## Bug 列表

### Bug 1: 顶部阴影裁剪

**现象**: "Listening..." 文字和左侧红点的顶部被阴影/边框遮挡，文字显示不完整。

**原因分析**: 可能是 CSS 的 `overflow` 设置或 `box-shadow` 的 `inset` 方向问题。

**修复方向**:
- 检查容器的 `overflow` 属性
- 检查 `box-shadow` 是否使用了 `inset` 导致向内遮挡
- 确保状态栏区域有足够的内边距

### Bug 2: 窗口高度重置失败

**现象**:
1. 第一次录音说了较长的话（比如 3 行），窗口扩展到对应高度
2. 第二次开始录音时，窗口显示为：
   - 上半部分是深色背景（正常）
   - 下半部分是白色空白区域（异常，对应上次的最大高度）
3. 开始说话后白色区域消失

**原因分析**:
- `resetHeight()` 可能只重置了 JS 变量，没有实际调整窗口大小
- 或者 CSS 背景没有完全覆盖窗口区域

**修复方向**:
- 在 `hide()` 或下次 `show()` 时显式调用 `setBounds()` 重置窗口高度
- 确保 CSS 背景覆盖整个窗口

### Bug 3: 自动滚动失效

**现象**: 转写文字超过 4 行后，最新的文字不会自动滚动到可见区域，用户看不到最新内容。

**原因分析**: `scrollTop = scrollHeight` 可能没有正确执行，或时机不对。

**修复方向**:
- 确保在文字更新后、DOM 渲染完成后执行滚动
- 使用 `requestAnimationFrame` 或 `useLayoutEffect` 确保时机正确
- 检查 `overflow-y: auto` 是否正确设置

## 实现文件

- `src/main/windows/floating.ts` - 窗口高度重置
- `src/renderer/src/modules/asr/components/FloatingWindow.tsx` - React 组件
- `src/renderer/src/modules/asr/components/TranscriptDisplay.tsx` - 文字显示和滚动
- `src/renderer/src/styles/components/floating-window.css` - CSS 样式

## Acceptance Criteria

- [ ] 状态栏文字和红点完整显示，无裁剪
- [ ] 新一轮录音开始时窗口高度正确重置为最小高度
- [ ] 无白色空白区域出现
- [ ] 超过 4 行时自动滚动显示最新文字
- [ ] `pnpm lint` 通过
- [ ] `pnpm typecheck` 通过
