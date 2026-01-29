# ASR Infrastructure - Shared Types and IPC Layer

## Goal

搭建 ASR 模块的基础设施，为后续并行开发的 3 个模块提供共享类型定义和 IPC 通信骨架。

## Requirements

### 1. Shared Types (`src/shared/types/asr.ts`)

```typescript
// ASR 配置
export interface ASRConfig {
  appId: string;
  accessToken: string;
  resourceId: string;  // "volc.bigasr.sauc.duration"
}

// ASR 结果
export interface ASRResult {
  type: "interim" | "final";
  text: string;
  isFinal: boolean;
}

// ASR 状态
export type ASRStatus = "idle" | "connecting" | "listening" | "processing" | "done" | "error";

// 音频数据 (PCM)
export interface AudioChunk {
  data: Int16Array;
  sampleRate: 16000;
  channels: 1;
}
```

### 2. IPC Channels (`src/shared/constants/channels.ts`)

```typescript
export const IPC_CHANNELS = {
  ASR: {
    START: "asr:start",
    STOP: "asr:stop",
    SEND_AUDIO: "asr:send-audio",    // Renderer → Main (PCM data)
    RESULT: "asr:result",            // Main → Renderer (interim/final)
    STATUS: "asr:status",            // Main → Renderer (status change)
    ERROR: "asr:error",
  },
} as const;
```

### 3. Preload API (`src/preload/index.ts`)

```typescript
contextBridge.exposeInMainWorld("api", {
  asr: {
    start: (config?: Partial<ASRConfig>) => ipcRenderer.invoke(IPC_CHANNELS.ASR.START, config),
    stop: () => ipcRenderer.invoke(IPC_CHANNELS.ASR.STOP),
    sendAudio: (chunk: ArrayBuffer) => ipcRenderer.send(IPC_CHANNELS.ASR.SEND_AUDIO, chunk),
    onResult: (callback: (result: ASRResult) => void) => {
      const handler = (_: any, result: ASRResult) => callback(result);
      ipcRenderer.on(IPC_CHANNELS.ASR.RESULT, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.ASR.RESULT, handler);
    },
    onStatus: (callback: (status: ASRStatus) => void) => {
      const handler = (_: any, status: ASRStatus) => callback(status);
      ipcRenderer.on(IPC_CHANNELS.ASR.STATUS, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.ASR.STATUS, handler);
    },
    onError: (callback: (error: string) => void) => {
      const handler = (_: any, error: string) => callback(error);
      ipcRenderer.on(IPC_CHANNELS.ASR.ERROR, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.ASR.ERROR, handler);
    },
  },
});
```

### 4. IPC Handler Registration (`src/main/ipc/`)

```typescript
// src/main/ipc/index.ts
export function setupAllIpcHandlers(): void {
  setupASRHandlers();
}

// src/main/ipc/asr.handler.ts
export function setupASRHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.ASR.START, async (_, config) => {
    // TODO: Implement in asr-integration task
    return { success: true };
  });
  
  ipcMain.handle(IPC_CHANNELS.ASR.STOP, async () => {
    // TODO: Implement in asr-integration task
    return { success: true };
  });
  
  ipcMain.on(IPC_CHANNELS.ASR.SEND_AUDIO, (_, chunk) => {
    // TODO: Implement in asr-integration task
  });
}
```

### 5. Directory Structure

创建以下目录结构：

```
src/
├── shared/
│   ├── types/
│   │   ├── index.ts
│   │   └── asr.ts
│   └── constants/
│       ├── index.ts
│       └── channels.ts
├── preload/
│   └── index.ts
├── main/
│   ├── index.ts              # 更新：调用 setupAllIpcHandlers()
│   ├── ipc/
│   │   ├── index.ts
│   │   └── asr.handler.ts
│   └── services/
│       └── asr/              # 空目录，供后续 task 使用
│           └── .gitkeep
└── renderer/
    └── src/
        └── modules/
            └── asr/          # 空目录，供后续 task 使用
                └── .gitkeep
```

## Acceptance Criteria

- [ ] `src/shared/types/asr.ts` 导出所有 ASR 相关类型
- [ ] `src/shared/constants/channels.ts` 导出 IPC_CHANNELS
- [ ] `src/preload/index.ts` 暴露 `window.api.asr` API
- [ ] `src/main/ipc/asr.handler.ts` 注册 ASR handlers (空实现)
- [ ] `src/main/index.ts` 调用 `setupAllIpcHandlers()`
- [ ] `pnpm lint` 通过
- [ ] `pnpm typecheck` 通过

## Post-Implementation: Update Downstream Task Contexts

**重要**: 完成本 task 后，需要更新后续 task 的 jsonl 文件，将本 task 产出的文件添加为 context：

```bash
# 更新 asr-audio-recorder (需要 shared types)
./.trellis/scripts/task.sh add-context .trellis/tasks/01-29-asr-audio-recorder implement "src/shared/types/asr.ts" "ASR type definitions"
./.trellis/scripts/task.sh add-context .trellis/tasks/01-29-asr-audio-recorder implement "src/shared/constants/channels.ts" "IPC channel constants"
./.trellis/scripts/task.sh add-context .trellis/tasks/01-29-asr-audio-recorder implement "src/preload/index.ts" "Preload API reference"

# 更新 asr-volcengine-client (需要 shared types + IPC 结构)
./.trellis/scripts/task.sh add-context .trellis/tasks/01-29-asr-volcengine-client implement "src/shared/types/asr.ts" "ASR type definitions"
./.trellis/scripts/task.sh add-context .trellis/tasks/01-29-asr-volcengine-client implement "src/shared/constants/channels.ts" "IPC channel constants"
./.trellis/scripts/task.sh add-context .trellis/tasks/01-29-asr-volcengine-client implement "src/main/ipc/asr.handler.ts" "IPC handler structure"

# 更新 asr-floating-window (需要 shared types)
./.trellis/scripts/task.sh add-context .trellis/tasks/01-29-asr-floating-window implement "src/shared/types/asr.ts" "ASR type definitions"
./.trellis/scripts/task.sh add-context .trellis/tasks/01-29-asr-floating-window implement "src/shared/constants/channels.ts" "IPC channel constants"
./.trellis/scripts/task.sh add-context .trellis/tasks/01-29-asr-floating-window implement "src/preload/index.ts" "Preload API reference"

# 更新 asr-integration (需要所有产出)
./.trellis/scripts/task.sh add-context .trellis/tasks/01-29-asr-integration implement "src/shared/" "All shared types and constants"
./.trellis/scripts/task.sh add-context .trellis/tasks/01-29-asr-integration implement "src/main/ipc/" "IPC layer structure"
./.trellis/scripts/task.sh add-context .trellis/tasks/01-29-asr-integration implement "src/preload/index.ts" "Preload API"
```

## Technical Notes

- 使用 Electron 的 contextBridge 确保安全的 IPC 通信
- 所有 IPC channel 名称使用 `asr:` 前缀避免冲突
- Handler 实现为空骨架，具体逻辑在 asr-integration task 中实现
