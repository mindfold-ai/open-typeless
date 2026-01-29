# ASR Floating Window UI

## Goal

实现 ASR 状态显示的悬浮窗口，实时显示录音状态和转写文字。

## Requirements

### 1. Floating Window Manager (`src/main/windows/floating.ts`)

```typescript
export class FloatingWindowManager {
  private window: BrowserWindow | null = null;
  
  create(): void;
  show(): void;
  hide(): void;
  destroy(): void;
  
  // 发送状态更新到窗口
  sendStatus(status: ASRStatus): void;
  sendResult(result: ASRResult): void;
  sendError(error: string): void;
}

export const floatingWindow = new FloatingWindowManager();
```

**BrowserWindow 配置:**
```typescript
new BrowserWindow({
  width: 300,
  height: 100,
  frame: false,              // 无边框
  transparent: true,         // 透明背景
  alwaysOnTop: true,         // 置顶
  skipTaskbar: true,         // 不显示在任务栏
  resizable: false,
  movable: true,             // 可拖动
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
  },
});
```

### 2. Floating Window Component (`src/renderer/src/modules/asr/components/FloatingWindow.tsx`)

```typescript
interface FloatingWindowProps {}

export function FloatingWindow(props: FloatingWindowProps): JSX.Element {
  const { status, result, error } = useASRStatus();
  
  return (
    <div className="floating-window">
      <StatusIndicator status={status} />
      <TranscriptDisplay text={result?.text} interim={!result?.isFinal} />
      {error && <ErrorDisplay message={error} />}
    </div>
  );
}
```

### 3. ASR Status Hook (`src/renderer/src/modules/asr/hooks/useASRStatus.ts`)

```typescript
interface UseASRStatusReturn {
  status: ASRStatus;
  result: ASRResult | null;
  error: string | null;
}

export function useASRStatus(): UseASRStatusReturn {
  // 订阅 IPC 事件: asr:status, asr:result, asr:error
}
```

### 4. UI States

| Status | Display |
|--------|---------|
| `idle` | 窗口隐藏 |
| `connecting` | "Connecting..." + 旋转动画 |
| `listening` | "● Listening..." + 脉冲动画 |
| `processing` | 显示 interim 文字 (灰色) |
| `done` | 显示 final 文字 (黑色)，2秒后隐藏 |
| `error` | 红色错误提示 |

### 5. Styles (`src/renderer/src/styles/components/floating-window.css`)

```css
.floating-window {
  /* 透明背景，圆角，阴影 */
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px 16px;
  
  /* 可拖动区域 */
  -webkit-app-region: drag;
}

.status-indicator {
  /* 状态圆点 + 文字 */
}

.transcript-text {
  /* 转写文字显示 */
}

.transcript-text.interim {
  color: #666;
}

.transcript-text.final {
  color: #000;
}
```

### 6. Directory Structure

```
src/
├── main/
│   └── windows/
│       ├── index.ts
│       └── floating.ts
└── renderer/src/
    ├── modules/asr/
    │   ├── components/
    │   │   ├── index.ts
    │   │   ├── FloatingWindow.tsx
    │   │   ├── StatusIndicator.tsx
    │   │   └── TranscriptDisplay.tsx
    │   └── hooks/
    │       ├── index.ts
    │       └── useASRStatus.ts
    └── styles/components/
        └── floating-window.css
```

## Acceptance Criteria

- [ ] 悬浮窗正确创建，透明无边框
- [ ] 窗口始终置顶显示
- [ ] 支持拖动改变位置
- [ ] 正确显示各种状态
- [ ] 实时显示 interim 和 final 文字
- [ ] 错误状态正确显示
- [ ] `pnpm lint` 通过
- [ ] `pnpm typecheck` 通过

## Technical Notes

- 使用 CSS `backdrop-filter` 实现毛玻璃效果（如果需要）
- `-webkit-app-region: drag` 使整个窗口可拖动
- 考虑添加位置记忆功能（存储到 localStorage）
