# ASR Audio Recorder - Web Audio API

## Goal

实现前端音频录制模块，使用 Web Audio API 采集麦克风音频并转换为 PCM 16-bit 格式。

## Requirements

### 1. Audio Recorder Hook (`src/renderer/src/modules/asr/hooks/useAudioRecorder.ts`)

```typescript
interface UseAudioRecorderReturn {
  isRecording: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export function useAudioRecorder(
  onAudioChunk: (chunk: ArrayBuffer) => void
): UseAudioRecorderReturn
```

**功能要求:**
- 使用 `navigator.mediaDevices.getUserMedia()` 获取麦克风
- 配置音频参数: sampleRate=16000, channelCount=1
- 使用 AudioContext + ScriptProcessorNode 处理音频
- 将 Float32 音频数据转换为 Int16 PCM
- 每 100ms 左右发送一个 chunk (约 1600 samples)
- 支持回声消除和降噪

### 2. PCM Converter (`src/renderer/src/modules/asr/lib/pcm-converter.ts`)

```typescript
// Float32 (-1.0 to 1.0) → Int16 (-32768 to 32767)
export function float32ToInt16(float32Array: Float32Array): Int16Array;

// 将 Int16Array 转换为 ArrayBuffer 以便 IPC 传输
export function int16ToArrayBuffer(int16Array: Int16Array): ArrayBuffer;
```

### 3. Audio Config (`src/renderer/src/modules/asr/constants.ts`)

```typescript
export const AUDIO_CONFIG = {
  sampleRate: 16000,
  channelCount: 1,
  bitsPerSample: 16,
  bufferSize: 4096,      // ScriptProcessorNode buffer size
  chunkInterval: 100,    // ms between chunks
} as const;
```

### 4. Directory Structure

```
src/renderer/src/modules/asr/
├── hooks/
│   ├── index.ts
│   └── useAudioRecorder.ts
├── lib/
│   ├── index.ts
│   └── pcm-converter.ts
├── constants.ts
├── types.ts
└── index.ts
```

## Acceptance Criteria

- [ ] `useAudioRecorder` hook 正确获取麦克风权限
- [ ] 音频数据正确转换为 PCM 16-bit, 16kHz, Mono
- [ ] 通过 `window.api.asr.sendAudio()` 发送 chunk 到 Main 进程
- [ ] 支持 start/stop 录音控制
- [ ] 错误处理：权限拒绝、设备不可用
- [ ] `pnpm lint` 通过
- [ ] `pnpm typecheck` 通过

## Technical Notes

- 使用 Web Audio API 而非 Node.js 录音库，跨平台兼容性更好
- ScriptProcessorNode 虽然已 deprecated，但在 Electron 中仍然可用
- 可考虑未来迁移到 AudioWorklet（需要额外配置）
- 依赖 `src/shared/types/asr.ts` 中的类型定义
