# Fix Volcengine ASR Binary Protocol

## Goal

Replace the current JSON-based Volcengine ASR client with the correct V3 BigModel binary protocol implementation.

## Background

Current implementation uses plain JSON text protocol which returns 400 error. The Volcengine BigModel ASR API requires a specific binary protocol with:
- 4-byte binary header (version, message type, flags, compression)
- GZIP compression
- Sequence numbering (positive for data, negative for last packet)

## Reference Implementation

Located at: `/Users/taosu/workspace/company/mindfold/product/open-typeless/src/main/services/asr/lib/volcengine-client.ts`

## Requirements

### 1. Install Dependencies

```bash
pnpm add uuid https-proxy-agent
pnpm add -D @types/uuid
```

### 2. Replace volcengine-client.ts

Replace `src/main/services/asr/lib/volcengine-client.ts` with the reference implementation, adapting the interface to match existing code:

**Key changes:**
- Binary protocol with 4-byte header
- GZIP compression for all payloads
- Correct header: `X-Api-Access-Key` (not `X-Api-Access-Token`)
- Sequence numbering for audio chunks
- Proper init request format

### 3. Update Types

Ensure types in `src/main/services/asr/types.ts` match the new implementation.

### 4. Adapt ASR Service

Update `src/main/services/asr/asr.service.ts` to work with the new client interface if needed.

## Acceptance Criteria

- [ ] Volcengine ASR connects successfully (no 400 error)
- [ ] Audio data is sent in correct binary format
- [ ] Transcription results are received and parsed
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes

## Technical Notes

- Protocol docs: https://www.volcengine.com/docs/6561/1354869
- The reference implementation is tested and working
