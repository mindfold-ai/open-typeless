#!/usr/bin/env python3
"""
Block Bash Subagent Hook

Blocks Task tool calls with subagent_type="Bash" to prevent
unreliable execution through Task agent.

Use mcp__acp__Bash directly instead.
"""

import json
import sys


def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)

    tool_name = input_data.get("tool_name", "")
    if tool_name != "Task":
        sys.exit(0)

    tool_input = input_data.get("tool_input", {})
    subagent_type = tool_input.get("subagent_type", "")

    if subagent_type == "Bash":
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "reason": "Bash subagent is disabled. Use mcp__acp__Bash tool directly instead.",
            }
        }
        print(json.dumps(output, ensure_ascii=False))
        sys.exit(0)

    # Not Bash subagent, allow
    sys.exit(0)


if __name__ == "__main__":
    main()
