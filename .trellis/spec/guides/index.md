# Thinking Guides

> Expand your thinking to catch issues before they become bugs.

---

## Overview

These guides help you ask the right questions **before** coding:
- Pre-implementation planning
- Cross-layer considerations
- Code reuse patterns

---

## Available Guides

| Guide | Purpose | When to Use |
|-------|---------|-------------|
| [Pre-Implementation Checklist](./pre-implementation-checklist.md) | Architectural decisions before coding | Before starting any feature |
| [Cross-Layer Thinking Guide](./cross-layer-thinking-guide.md) | Data flow across layers | Features spanning Main ↔ Renderer |
| [Code Reuse Thinking Guide](./code-reuse-thinking-guide.md) | Identify patterns, reduce duplication | When you notice repeated code |

---

## Quick Reference

### When to Use Which Guide

| Situation | Guide |
|-----------|-------|
| Starting a new feature | Pre-Implementation Checklist |
| Feature touches IPC, services, and UI | Cross-Layer Thinking |
| Writing similar code to something existing | Code Reuse Thinking |

---

**Core Principle**: 30 minutes of thinking saves 3 hours of debugging.
