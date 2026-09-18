---
sidebar_position: 1
title: Import Data from SaaS Services
---

# Import Data from SaaS Services

Create Context Graph can pull data from SaaS services and map it into your Neo4j knowledge graph. This guide covers how to configure connectors during project scaffolding and how to re-import data afterward.

<!-- TODO: Export from connector-data-flow.excalidraw and replace placeholder -->
![SaaS connector data flow: from external services through connectors into Neo4j](/img/connector-data-flow.png)

## Available Connectors

| Service | What It Imports | Auth Method |
|---------|----------------|-------------|
| **GitHub** | Repositories, issues, pull requests, commits, users, code reviews | Personal access token (PAT) |
| **Notion** | Pages, databases, blocks, users, comments | Internal integration token |
| **Jira** | Projects, issues, sprints, users, comments, worklogs | API token + Atlassian email |
| **Slack** | Channels, messages, threads, users, reactions | Bot token (OAuth) |
| **Gmail** | Emails, threads, contacts, labels, attachments (metadata) | Google OAuth 2.0 / service account |
| **Google Calendar** | Events, attendees, calendars, recurring series | Google OAuth 2.0 / service account |
| **Salesforce** | Accounts, contacts, opportunities, leads, cases, activities | OAuth 2.0 connected app |
| **Linear** | Issues, projects, cycles, teams, users, labels, comments, milestones, initiatives, attachments + decision traces | Personal API key |
| **Google Workspace** | Drive files, comment threads (as decision traces), revisions, Drive Activity, Calendar events, Gmail metadata | Google OAuth 2.0 |
| **Claude Code** | Session history, messages, tool calls, files, decisions, preferences, errors | None (local files) |
| **Claude AI** | Conversations, messages, tool calls, thinking traces from Claude AI web/app export | None (local file) |
| **ChatGPT** | Conversations, messages, tool results from ChatGPT data export | None (local file) |

## Selecting Connectors in the Interactive Wizard

When you run `create-context-graph my-app`, the wizard includes a step to connect SaaS services:

1. Select **"Connect to SaaS services"** when prompted for your data source.
2. Pick one or more connectors from the checklist.
3. Enter the required credentials for each selected connector (tokens, keys, etc.).
4. The scaffolded project will include connector configuration in `.env` and an import pipeline in `backend/scripts/`.

## Non-Interactive CLI Usage

Pass `--connector` flags to skip the wizard:

```bash
create-context-graph my-app \
  --domain software-development \
  --framework pydanticai \
  --connector github \
  --connector slack
```

You can combine `--connector` with any domain and framework flags. Each connector will prompt for its credentials unless they are already set as environment variables.

### Linear example

Import your Linear workspace data into a context graph:

```bash
create-context-graph my-project \
  --domain software-engineering \
  --framework pydanticai \
  --connector linear \
  --linear-api-key lin_api_xxxxx \
  --linear-team ENG
```

The `--linear-team` flag is optional. If omitted, all teams in the workspace are imported.

### Google Workspace example

Import Drive files, comment threads, and revision history from a specific folder:

```bash
create-context-graph my-decisions-app \
  --domain software-engineering \
  --framework pydanticai \
  --connector google-workspace \
  --gws-folder-id 1aBcDeFgHiJkLmNoPqRsT
```

Add Calendar events and Gmail metadata for full decision context:

```bash
create-context-graph my-decisions-app \
  --domain software-engineering \
  --framework pydanticai \
  --connector google-workspace \
  --gws-folder-id 1aBcDeFg \
  --gws-include-calendar \
  --gws-include-gmail \
  --gws-since 2026-01-01
```

### Claude Code example

Import your Claude Code session history from the current project:

```bash
create-context-graph my-dev-graph \
  --domain software-engineering \
  --framework claude-agent-sdk \
  --connector claude-code
```

Import all projects with a time filter:

```bash
create-context-graph my-dev-graph \
  --domain software-engineering \
  --framework claude-agent-sdk \
  --connector claude-code \
  --claude-code-scope all \
  --claude-code-since 2026-03-01
```

No API key or credentials are needed -- the connector reads local JSONL files from `~/.claude/projects/`.

### Claude AI chat history example

Import your Claude AI conversation export into a context graph:

```bash
create-context-graph my-chat-graph \
  --domain personal-knowledge \
  --framework pydanticai \
  --import-type claude-ai \
  --import-file ~/Downloads/claude-export.zip
```

Filter by date or title:

```bash
create-context-graph my-chat-graph \
  --domain personal-knowledge \
  --framework pydanticai \
  --import-type claude-ai \
  --import-file ~/Downloads/claude-export.zip \
  --import-filter-after 2025-10-01 \
  --import-filter-title "python|neo4j"
```

No API key or credentials are needed -- the connector reads the local export file you downloaded from Claude AI settings.

### ChatGPT chat history example

Import your ChatGPT conversation export:

```bash
create-context-graph my-chat-graph \
  --domain personal-knowledge \
  --framework pydanticai \
  --import-type chatgpt \
  --import-file ~/Downloads/chatgpt-export.zip
```

The ChatGPT parser handles the tree-structured message format automatically, following the main conversation path at branch points.

See the [Import Your AI Chat History](/docs/tutorials/import-chat-history) tutorial for a complete walkthrough including how to export from each platform.

### Combining connectors

Use both Google Workspace and Linear for the full decision lifecycle -- from meeting discussion to code execution:

```bash
create-context-graph my-full-context-app \
  --domain software-engineering \
  --framework pydanticai \
  --connector google-workspace \
  --connector linear \
  --gws-folder-id 1aBcDeFg \
  --gws-include-calendar \
  --linear-api-key lin_api_xxxxx
```

The connectors automatically cross-link: Linear issue references found in Google Docs comments or document names create `RELATES_TO_ISSUE` relationships.

## Gmail and Google Calendar Setup

Gmail and Google Calendar connectors use the **Google Workspace CLI (gws)** for OAuth flows. When you select either connector, the wizard checks whether `gws` is installed:

- If found, it uses `gws` to handle the OAuth consent flow and token refresh.
- If not found, the wizard offers to install it automatically (`pip install gws`).
- You can skip the install and provide a service account JSON key file instead.

Both connectors share the same Google Cloud project credentials, so configuring one makes the other available with no extra setup.

## Re-Importing Data in a Generated Project

After scaffolding, the generated project includes Makefile targets for data import:

```bash
# Import data from all configured connectors
make import

# Import data and seed the graph with demo scenarios
make import-and-seed
```

These targets read credentials from the `.env` file in the project root.

## Connector Credential Setup

<details>
<summary><strong>GitHub</strong> — Personal access token</summary>

1. Go to **Settings > Developer settings > Personal access tokens > Tokens (classic)**.
2. Generate a token with `repo`, `read:org`, and `read:user` scopes.
3. Set `GITHUB_TOKEN` in `.env`.

</details>

<details>
<summary><strong>Notion</strong> — Internal integration token</summary>

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) and create an internal integration.
2. Copy the **Internal Integration Secret**.
3. Share the target pages/databases with your integration.
4. Set `NOTION_TOKEN` in `.env`.

</details>

<details>
<summary><strong>Jira</strong> — API token + Atlassian email</summary>

1. Go to [id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens) and create an API token.
2. Set `JIRA_EMAIL`, `JIRA_API_TOKEN`, and `JIRA_BASE_URL` (e.g., `https://yourorg.atlassian.net`) in `.env`.

</details>

<details>
<summary><strong>Slack</strong> — Bot OAuth token</summary>

1. Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps).
2. Add bot token scopes: `channels:history`, `channels:read`, `users:read`, `reactions:read`.
3. Install the app to your workspace and copy the **Bot User OAuth Token**.
4. Set `SLACK_BOT_TOKEN` in `.env`.

</details>

<details>
<summary><strong>Gmail / Google Calendar</strong> — Google OAuth 2.0</summary>

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the Gmail API and/or Google Calendar API.
3. Create OAuth 2.0 credentials (Desktop app type) and download the JSON file.
4. Set `GOOGLE_CREDENTIALS_FILE` in `.env` pointing to the downloaded JSON.

</details>

<details>
<summary><strong>Salesforce</strong> — OAuth 2.0 connected app</summary>

1. In Salesforce Setup, go to **App Manager** and create a new Connected App.
2. Enable OAuth and select scopes: `api`, `refresh_token`, `offline_access`.
3. Set `SALESFORCE_CLIENT_ID`, `SALESFORCE_CLIENT_SECRET`, `SALESFORCE_USERNAME`, `SALESFORCE_PASSWORD`, and `SALESFORCE_SECURITY_TOKEN` in `.env`.

</details>

<details>
<summary><strong>Google Workspace</strong> — Google OAuth 2.0 (Drive, Activity, Calendar, Gmail)</summary>

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project (or select an existing one).
2. Navigate to **APIs & Services > Library** and enable: **Google Drive API**, **Drive Activity API**, and optionally **Google Calendar API** and **Gmail API**.
3. Navigate to **APIs & Services > Credentials** and create an **OAuth client ID** (Desktop app type).
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.
5. Optionally set `GWS_FOLDER_ID` to a Drive folder ID to scope the import.

The connector imports files, comment threads (with resolution detection), revision history, Drive Activity, and optionally Calendar events and Gmail thread metadata. Resolved comment threads are extracted as **decision traces**. It also provides 10 decision-focused agent tools.

See the [Decision Traces from Google Workspace](/docs/tutorials/google-workspace-decisions) tutorial for a complete walkthrough.

</details>

<details>
<summary><strong>Linear</strong> — Personal API key</summary>

1. Open **Linear Settings > Security & Access > API** (or navigate to `linear.app/settings/api`).
2. Click **Create key** to generate a personal API key.
3. Set `LINEAR_API_KEY` in `.env`.
4. Optionally set `LINEAR_TEAM` to a team URL key (e.g., `ENG`) to limit the import to a single team.

The connector imports 12 entity types (issues, projects, cycles, teams, users, labels, workflow states, comments, project updates, milestones, initiatives, attachments), issue relations, threaded comments with resolution tracking, and decision traces from issue history. Validates team keys during authentication, retries on rate limits with exponential backoff. Uses only Python's built-in `urllib`.

See the [Build a Linear Context Graph](/docs/tutorials/linear-context-graph) tutorial for a complete walkthrough.

</details>

<details>
<summary><strong>Claude Code</strong> — No setup required (local files)</summary>

No setup required. The connector reads session JSONL files directly from `~/.claude/projects/` on your local machine.

It parses session files, extracts decisions (user corrections, deliberation, error-resolution cycles, dependency changes), extracts preferences (explicit statements, behavioral patterns), redacts secrets, tracks files, and provides 8 session intelligence agent tools.

See the [Build a Developer Knowledge Graph from Claude Code Sessions](/docs/tutorials/claude-code-sessions) tutorial for a complete walkthrough.

</details>

<details>
<summary><strong>Claude AI</strong> — No setup required (export file)</summary>

Export your data from Claude AI:

1. Open [claude.ai](https://claude.ai) and go to **Settings > Account > Export Data**.
2. Confirm the export. You'll receive an email with a download link.
3. Download the `.zip` file and pass it to the CLI with `--import-type claude-ai --import-file <path>`.

See the [Import Your AI Chat History](/docs/tutorials/import-chat-history) tutorial for a complete walkthrough.

</details>

<details>
<summary><strong>ChatGPT</strong> — No setup required (export file)</summary>

Export your data from ChatGPT:

1. Open [chatgpt.com](https://chatgpt.com) and go to **Settings > Data Controls > Export data**.
2. Confirm the export. You'll receive an email with a download link.
3. Download the `.zip` file and pass it to the CLI with `--import-type chatgpt --import-file <path>`.

See the [Import Your AI Chat History](/docs/tutorials/import-chat-history) tutorial for a complete walkthrough.

</details>

## Further Reading

- [CLI Options](/docs/reference/cli-options) -- all connector-related flags
- [Google Workspace Schema](/docs/reference/google-workspace-schema) -- complete entity and relationship reference
- [Claude Code Schema](/docs/reference/claude-code-schema) -- complete entity and relationship reference
- [Chat Import Schema](/docs/reference/chat-import-schema) -- Claude AI and ChatGPT graph schema
