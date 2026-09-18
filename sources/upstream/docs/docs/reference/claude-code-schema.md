---
sidebar_position: 7
title: "Claude Code Session Schema"
---

# Claude Code Session Schema

Complete reference for the graph schema produced by the Claude Code session connector (`--connector claude-code`).

## Entity Types

### Core session structure

| Label | Source | Key Properties | Description |
|-------|--------|---------------|-------------|
| `Project` | Project directories in `~/.claude/projects/` | `name` (decoded path), `encodedPath`, `sessionCount` | One per project directory. Name is the decoded filesystem path. |
| `Session` | JSONL session files | `sessionId`, `name` (first prompt snippet), `startedAt`, `endedAt`, `branch`, `messageCount`, `totalInputTokens`, `totalOutputTokens`, `progressCount` | One per `.jsonl` file. Name is derived from the first user prompt. |
| `Message` | User and assistant messages | `uuid`, `role` (`user`/`assistant`), `content` (truncated), `timestamp` | Named as `msg-{uuid[:12]}`. Content length controlled by `--claude-code-content`. |
| `ToolCall` | `tool_use` blocks in assistant messages | `toolUseId`, `toolName` (Read/Write/Edit/Bash/Grep/Glob/Agent/etc.), `input` (summary), `output` (truncated), `isError`, `timestamp` | Named as `{toolName}: {input_summary}`. |
| `File` | Extracted from tool call inputs | `path` (absolute), `language` (from extension), `modificationCount`, `readCount` | Deduplicated across all sessions. Tracks how many times each file was read and modified. |
| `GitBranch` | Session metadata | `name`, `project` | Deduplicated. Links sessions to their active git branch. |
| `Error` | Tool results with `is_error: true` | `message` (truncated), `timestamp`, `toolUseId` | Named as `error-{hash}`. |

### Decision extraction

| Label | Source | Key Properties | Description |
|-------|--------|---------------|-------------|
| `Decision` | Heuristic extraction | `description`, `timestamp`, `outcome` (ACCEPTED/REVISED/REJECTED/DEFERRED), `confidence` (0.0--1.0), `category` (correction/architecture/error-fix/dependency), `sessionId` | Named as `decision-{hash}`. |
| `Alternative` | Paired with decisions | `description`, `wasChosen` (boolean), `reason` | Named as `alt-{hash}-original` or `alt-{hash}-correction`. |

### Preference extraction

| Label | Source | Key Properties | Description |
|-------|--------|---------------|-------------|
| `Preference` | Explicit statements + behavioral patterns | `category` (coding_style/framework_choice/testing_approach/tool_configuration/naming_convention/documentation), `key`, `value`, `confidence` (0.0--1.0), `extractedFrom` (explicit_statement/package_frequency), `firstSeenAt`, `sessionCount` | Named as `pref-{hash}`. |

## Relationship Types

### Session structure

| Relationship | From | To | Description |
|---|---|---|---|
| `HAS_SESSION` | Project | Session | Project directory contains this session |
| `HAS_MESSAGE` | Session | Message | Session contains this message |
| `NEXT` | Message | Message | Sequential message ordering within a session |
| `USED_TOOL` | Message | ToolCall | Assistant message invoked this tool |
| `ON_BRANCH` | Session | GitBranch | Session was on this git branch |

### Tool call chains and file tracking

| Relationship | From | To | Description |
|---|---|---|---|
| `PRECEDED_BY` | ToolCall | ToolCall | Tool call sequence within a session (reasoning chain) |
| `MODIFIED_FILE` | ToolCall | File | Write, Edit, or NotebookEdit tool changed this file |
| `READ_FILE` | ToolCall | File | Read, Grep, or Glob tool accessed this file |
| `ENCOUNTERED_ERROR` | ToolCall | Error | Tool call produced an error |

### Decision provenance

| Relationship | From | To | Description |
|---|---|---|---|
| `MADE_DECISION` | Session | Decision | Decision was identified in this session |
| `CHOSE` | Decision | Alternative | The approach that was chosen |
| `REJECTED` | Decision | Alternative | An approach that was rejected |
| `RESULTED_IN` | Decision | ToolCall | Tool call that executed the chosen approach |

### Preference tracking

| Relationship | From | To | Description |
|---|---|---|---|
| `EXPRESSES_PREFERENCE` | Message | Preference | User message that revealed this preference |

## Decision Categories

| Category | Detection Method | Example |
|----------|-----------------|---------|
| `correction` | User overrides Claude's approach ("No, instead use X") | "No, instead use OAuth2 with Google" |
| `architecture` | Assistant discusses trade-offs with multiple deliberation markers | "We could use FastAPI or Flask, the trade-off is..." |
| `error-fix` | Tool call fails, followed by corrective tool calls | `pytest` fails → edit file → `pytest` succeeds |
| `dependency` | Package install commands (`pip install`, `npm install`, etc.) | `pip install pydantic` |

## Preference Categories

| Category | Example Patterns |
|----------|-----------------|
| `coding_style` | "always use single quotes", "don't use X", "I prefer functional style" |
| `framework_choice` | "prefer FastAPI over Flask", frequently installing `pydantic` |
| `testing_approach` | "write tests first", "use pytest fixtures" |
| `tool_configuration` | "use ruff", "use black for formatting" |
| `naming_convention` | "use snake_case", "use PascalCase" |
| `documentation` | "add docstrings", "use type hints" |

## Agent Tools

When `--connector claude-code` is active, 8 session intelligence tools are injected into the generated agent:

| Tool | Parameters | Description |
|------|-----------|-------------|
| `search_sessions` | `keyword` (string, required) | Full-text search across session message content |
| `decision_history` | `topic` (string, required) | Find decisions related to a file, package, or topic |
| `file_timeline` | `path` (string, required) | Show modification/read history of a file across all sessions |
| `error_patterns` | -- | Find recurring errors and how they were resolved |
| `tool_usage_stats` | -- | Analytics on tool usage across sessions |
| `my_preferences` | `category` (string, optional) | Retrieve extracted preferences, optionally filtered by category |
| `project_overview` | `project_name` (string, optional) | Summary stats for a project |
| `reasoning_trace` | `session_name` (string, required) | Trace the tool call chain for a specific session |

## Secret Redaction

The following patterns are detected and replaced with `[REDACTED]` before content is stored:

- Anthropic API keys (`sk-ant-*`)
- OpenAI API keys (`sk-proj-*`, `sk-*`)
- GitHub tokens (`ghp_*`, `gho_*`, `github_pat_*`)
- Slack tokens (`xoxb-*`, `xoxp-*`)
- AWS access keys (`AKIA*`)
- Bearer/Authorization tokens
- Password assignments (`password=*`)
- Connection strings with embedded credentials (`postgres://user:pass@host`)
- `.env`-style sensitive variable assignments (`ANTHROPIC_API_KEY=*`)

Redaction is enabled by default. Content mode `none` (`--claude-code-content none`) avoids storing message content entirely.

## Example Graph Traversals

### Trace a decision back through the conversation

```cypher
MATCH (d:Decision)-[:MADE_DECISION]-(s:Session)-[:HAS_MESSAGE]->(m:Message)
WHERE d.description CONTAINS 'auth'
RETURN s.name AS session, m.role AS role, m.content AS message,
       d.description AS decision, d.category AS type
ORDER BY m.timestamp
```

### Find the most active files across all sessions

```cypher
MATCH (f:File)
RETURN f.path, f.language, f.modificationCount, f.readCount,
       f.modificationCount + f.readCount AS total_touches
ORDER BY total_touches DESC
LIMIT 20
```

### Reconstruct a reasoning chain

```cypher
MATCH chain = (tc:ToolCall)-[:PRECEDED_BY*1..10]->(root:ToolCall)
WHERE tc.toolName = 'Bash'
  AND tc.input CONTAINS 'pytest'
RETURN [n IN nodes(chain) | {tool: n.toolName, input: n.input}] AS chain
LIMIT 5
```
