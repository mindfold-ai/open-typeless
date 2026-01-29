# ASR Integration - E2E Flow

## Goal

整合所有 ASR 模块，实现完整的端到端语音识别流程。

## Prerequisites

本 task 依赖以下模块已完成并合并到 main：
- [ ] asr-infrastructure (Batch 1)
- [ ] asr-audio-recorder (Batch 2)
- [ ] asr-volcengine-client (Batch 2)
- [ ] asr-floating-window (Batch 2)

## Requirements

### 1. ASR Service (`src/main/services/asr/asr.service.ts`)

```typescript
import { EventEmitter } from "events";
import { VolcengineClient } from "./lib/volcengine-client";
import { floatingWindow } from "../windows/floating";

export class ASRService extends EventEmitter {
  private client: VolcengineClient;
  private status: ASRStatus = "idle";
  
  async start(config?: Partial<ASRConfig>): Promise<void>;
  async stop(): Promise<ASRResult | null>;
  processAudioChunk(chunk: ArrayBuffer): void;
  
  get currentStatus(): ASRStatus;
}

export const asrService = new ASRService();
```

**状态机:**
```
idle → connecting → listening → processing → done
                        ↓
                      error
```

### 2. IPC Handler Implementation (`src/main/ipc/asr.handler.ts`)

更新 handler 实现，连接 ASRService：

```typescript
export function setupASRHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.ASR.START, async (event, config) => {
    try {
      await asrService.start(config);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle(IPC_CHANNELS.ASR.STOP, async () => {
    const result = await asrService.stop();
    return { success: true, result };
  });
  
  ipcMain.on(IPC_CHANNELS.ASR.SEND_AUDIO, (event, chunk) => {
    asrService.processAudioChunk(chunk);
  });
  
  // 将 service 事件转发到 renderer
  asrService.on("status", (status) => {
    mainWindow?.webContents.send(IPC_CHANNELS.ASR.STATUS, status);
  });
  
  asrService.on("result", (result) => {
    mainWindow?.webContents.send(IPC_CHANNELS.ASR.RESULT, result);
  });
  
  asrService.on("error", (error) => {
    mainWindow?.webContents.send(IPC_CHANNELS.ASR.ERROR, error.message);
  });
}
```

### 3. Procedures (`src/main/services/asr/procedures/`)

```typescript
// start.ts
export async function startASR(config?: Partial<ASRConfig>): Promise<{ success: boolean }>;

// stop.ts
export async function stopASR(): Promise<{ success: boolean; result?: ASRResult }>;

// status.ts
export function getASRStatus(): ASRStatus;
```

### 4. E2E Flow

1. **用户触发开始** (将在后续 keyboard hook task 实现)
2. **Renderer 调用** `window.api.asr.start()`
3. **Main 进程**:
   - ASRService 创建 VolcengineClient
   - 连接 WebSocket
   - 显示悬浮窗
   - 发送状态更新
4. **Renderer 开始录音** via `useAudioRecorder`
5. **音频流转发**: Renderer → IPC → Main → WebSocket
6. **结果回传**: WebSocket → Main → IPC → Renderer → 悬浮窗显示
7. **用户触发停止**
8. **Main 进程**:
   - 发送 StopTranscription
   - 获取最终结果
   - 关闭 WebSocket
   - 隐藏悬浮窗

### 5. Error Handling

| 错误场景 | 处理方式 |
|---------|---------|
| WebSocket 连接失败 | 重试 3 次，每次间隔 1s |
| 麦克风权限拒绝 | 显示错误提示，引导用户开启权限 |
| ASR 服务超时 | 自动停止，返回已有结果 |
| 网络中断 | 尝试重连，失败则停止 |

## Acceptance Criteria

- [ ] 完整 E2E 流程可运行
- [ ] ASRService 状态机正确转换
- [ ] 音频数据正确从 Renderer 传输到 WebSocket
- [ ] interim 和 final 结果正确显示在悬浮窗
- [ ] 错误处理覆盖所有场景
- [ ] 日志记录完整，便于调试
- [ ] `pnpm lint` 通过
- [ ] `pnpm typecheck` 通过

## Technical Notes

- 使用 singleton 模式确保 ASRService 全局唯一
- 注意内存泄漏：确保所有 listener 在停止时被移除
- WebSocket 重连使用指数退避策略
