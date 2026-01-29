# ASR Volcengine WebSocket Client

## Goal

实现火山引擎 BigModel ASR 的 WebSocket 客户端，处理流式语音识别。

## API Configuration

- **Endpoint**: `wss://openspeech.bytedance.com/api/v3/sauc/bigmodel`
- **Resource ID**: `volc.bigasr.sauc.duration`
- **Model**: `bigmodel`
- **Audio Format**: PCM 16-bit, 16kHz, Mono

## Requirements

### 1. Volcengine Client (`src/main/services/asr/lib/volcengine-client.ts`)

```typescript
import { EventEmitter } from "events";
import WebSocket from "ws";

interface VolcengineClientConfig {
  appId: string;
  accessToken: string;
  resourceId: string;
}

interface VolcengineClientEvents {
  result: (result: ASRResult) => void;
  status: (status: ASRStatus) => void;
  error: (error: Error) => void;
}

export class VolcengineClient extends EventEmitter {
  constructor(config: VolcengineClientConfig);
  
  connect(): Promise<void>;
  disconnect(): void;
  sendAudio(chunk: ArrayBuffer): void;
  finishAudio(): void;
  
  get isConnected(): boolean;
}
```

### 2. WebSocket Protocol

**连接 Headers:**
```typescript
const headers = {
  "X-Api-App-Key": config.appId,
  "X-Api-Access-Key": config.accessToken,
  "X-Api-Resource-Id": config.resourceId,
  "X-Api-Connect-Id": uuid(),  // 每次连接唯一 ID
};
```

**Session Update Message (连接后发送):**
```json
{
  "header": {
    "message_id": "<uuid>",
    "task_id": "<uuid>",
    "namespace": "SpeechTranscriber",
    "name": "StartTranscription"
  },
  "payload": {
    "audio": {
      "format": "pcm",
      "sample_rate": 16000,
      "channel": 1,
      "bits": 16,
      "codec": "raw"
    },
    "user": {},
    "request": {
      "model_name": "bigmodel"
    }
  }
}
```

**Audio Data Message:**
```json
{
  "header": {
    "message_id": "<uuid>",
    "task_id": "<same-task-id>",
    "namespace": "SpeechTranscriber",
    "name": "AudioData"
  },
  "payload": {
    "audio": "<base64-encoded-pcm-data>",
    "index": 0,
    "is_end": false
  }
}
```

**Finish Message:**
```json
{
  "header": {
    "message_id": "<uuid>",
    "task_id": "<same-task-id>",
    "namespace": "SpeechTranscriber",
    "name": "StopTranscription"
  },
  "payload": {}
}
```

### 3. Config Loader (`src/main/services/asr/lib/config.ts`)

```typescript
export interface ASREnvConfig {
  appId: string;
  accessToken: string;
  resourceId: string;
}

export function loadASRConfig(): ASREnvConfig {
  // 从环境变量加载
  // VOLCENGINE_APP_ID
  // VOLCENGINE_ACCESS_TOKEN
  // VOLCENGINE_RESOURCE_ID (default: "volc.bigasr.sauc.duration")
}
```

### 4. Types (`src/main/services/asr/types.ts`)

```typescript
import { z } from "zod";

export const volcengineMessageSchema = z.object({
  header: z.object({
    message_id: z.string(),
    task_id: z.string(),
    namespace: z.string(),
    name: z.string(),
    status: z.number().optional(),
    status_message: z.string().optional(),
  }),
  payload: z.record(z.unknown()),
});

export type VolcengineMessage = z.infer<typeof volcengineMessageSchema>;
```

### 5. Directory Structure

```
src/main/services/asr/
├── types.ts
├── lib/
│   ├── index.ts
│   ├── volcengine-client.ts
│   └── config.ts
└── procedures/
    └── .gitkeep              # 空目录，由 asr-integration 填充
```

## Acceptance Criteria

- [ ] WebSocket 连接正常建立，Headers 正确
- [ ] Session update message 正确发送
- [ ] 音频数据正确 base64 编码并发送
- [ ] 正确解析 interim/final 结果
- [ ] 错误处理：连接失败、超时、协议错误
- [ ] 支持重连逻辑
- [ ] `pnpm lint` 通过
- [ ] `pnpm typecheck` 通过

## Dependencies

```bash
pnpm add ws
pnpm add -D @types/ws
```

## Technical Notes

- 使用 `ws` 库而非浏览器 WebSocket（Main 进程是 Node.js）
- 每次连接使用唯一的 `connect-id` 和 `task-id`
- 处理网络抖动：实现指数退避重连
- 日志记录所有 WebSocket 消息用于调试
