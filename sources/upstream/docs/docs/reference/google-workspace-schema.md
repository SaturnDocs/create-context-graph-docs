---
sidebar_position: 6
title: Google Workspace Graph Schema
---

# Google Workspace Graph Schema

Complete reference for the node labels, relationships, and properties created by the `--connector google-workspace` connector.

## Entity Types

### Document

Google Docs, Sheets, and Slides files.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | File name |
| `driveId` | string | Google Drive file ID |
| `mimeType` | string | MIME type (e.g., `application/vnd.google-apps.document`) |
| `webViewLink` | string | URL to open the file in browser |
| `createdTime` | datetime | When the file was created |
| `modifiedTime` | datetime | When the file was last modified |
| `description` | string | File description (if set) |
| `poleType` | string | Always `"Object"` |

### Folder

Drive folder hierarchy.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Folder name |
| `driveId` | string | Google Drive folder ID |
| `parentId` | string | Parent folder ID |
| `poleType` | string | Always `"Object"` |

### Person

Users from Drive, Calendar, and Gmail.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Display name (falls back to email prefix) |
| `emailAddress` | string | Email address (dedup key) |
| `displayName` | string | Full display name |
| `poleType` | string | Always `"Person"` |

### DecisionThread

Comment threads extracted from Google Docs/Sheets/Slides. The core entity for decision trace extraction.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | `"Thread: {content[:80]}"` |
| `driveCommentId` | string | Google Drive comment ID |
| `content` | string | The original question or proposal |
| `quotedContent` | string | The document text the comment was anchored to |
| `resolved` | boolean | `true` if the thread was resolved (decision made) |
| `resolution` | string | The final reply content (the "answer") |
| `createdTime` | datetime | When the thread was started |
| `modifiedTime` | datetime | When the thread was last updated |
| `participantCount` | integer | Number of unique participants |
| `poleType` | string | Always `"Object"` |

### Reply

Individual replies within a comment thread.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | `"Reply {n} on {thread_name}"` |
| `content` | string | Reply text |
| `createdTime` | datetime | When the reply was posted |
| `poleType` | string | Always `"Object"` |

### Revision

Document revision metadata (not content).

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | `"Rev {id} of {file_name}"` |
| `revisionId` | string | Drive revision ID |
| `modifiedTime` | datetime | When the revision was created |
| `mimeType` | string | Revision MIME type |
| `size` | string | Revision size in bytes |
| `poleType` | string | Always `"Event"` |

### Activity

Drive Activity API events (create, edit, move, share, etc.).

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | `"{ActionLabel}: {targetName} at {timestamp}"` |
| `actionType` | string | Action key: `create`, `edit`, `move`, `rename`, `delete`, `restore`, `permissionChange`, `comment`, `suggestion` |
| `actionLabel` | string | Human-readable action: `Created`, `Edited`, `Moved`, etc. |
| `timestamp` | datetime | When the action occurred |
| `targetName` | string | Name of the file acted on |
| `poleType` | string | Always `"Event"` |

### Meeting

Calendar events (only when `--gws-include-calendar` is enabled).

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | `"{summary} ({date})"` |
| `eventId` | string | Google Calendar event ID |
| `summary` | string | Event title |
| `startTime` | datetime | Event start time |
| `endTime` | datetime | Event end time |
| `location` | string | Event location |
| `status` | string | Event status (confirmed, tentative, cancelled) |
| `description` | string | Event description |
| `attendeeCount` | integer | Number of attendees |
| `poleType` | string | Always `"Event"` |

### EmailThread

Gmail thread metadata (only when `--gws-include-gmail` is enabled). No message body text is imported.

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Email subject (or `"Thread {id}"`) |
| `threadId` | string | Gmail thread ID |
| `subject` | string | Thread subject line |
| `messageCount` | integer | Number of messages in the thread |
| `lastMessageTime` | string | Timestamp of the last message |
| `participantEmails` | list[string] | Email addresses of all participants |
| `poleType` | string | Always `"Object"` |

## Relationship Types

| Relationship | From | To | Description |
|-------------|------|-----|-------------|
| `HAS_COMMENT_THREAD` | Document | DecisionThread | A comment thread exists on this document |
| `HAS_REPLY` | DecisionThread | Reply | A reply in the discussion thread |
| `AUTHORED_BY` | DecisionThread / Reply | Person | Who wrote the comment or reply |
| `RESOLVED_BY` | DecisionThread | Person | Who resolved the thread (made the decision) |
| `HAS_REVISION` | Document | Revision | A revision of this document |
| `REVISED_BY` | Revision | Person | Who made the edit |
| `ACTIVITY_ON` | Activity | Document | An action was performed on this file |
| `PERFORMED_BY` | Activity | Person | Who performed the action |
| `CONTAINED_IN` | Document | Folder | File is in this folder |
| `CREATED_BY` | Document | Person | File owner/creator |
| `SHARED_WITH` | Document | Person | File is shared with this person |
| `ATTENDEE_OF` | Person | Meeting | Person attended this meeting |
| `ORGANIZED_BY` | Meeting | Person | Meeting organizer |
| `DISCUSSED_IN` | Document | Meeting | Document was linked from meeting description/attachments |
| `PARTICIPANT_IN` | Person | EmailThread | Person participated in this email thread |
| `THREAD_ABOUT` | EmailThread | Document | Email thread references this document (via Drive URL) |
| `RELATES_TO_ISSUE` | DecisionThread / Document / Reply / EmailThread / Meeting | Issue | Cross-connector link to a Linear issue (detected via identifier pattern like `ENG-123`) |

## Decision Traces

Resolved comment threads are also exported as **decision traces** in the `NormalizedData.traces` format:

```json
{
  "id": "trace-gdrive-{commentId}",
  "task": "Decision on '{fileName}': {content[:100]}",
  "outcome": "Resolved: {lastReplyContent[:200]}",
  "steps": [
    {"thought": "...", "action": "Alice started discussion", "observation": "Posted at ..."},
    {"thought": "...", "action": "Bob replied", "observation": "Replied at ..."},
    {"thought": "Thread resolved", "action": "Alice resolved the discussion", "observation": "Resolved at ..."}
  ]
}
```

Only resolved threads produce traces. Unresolved threads are queryable as DecisionThread nodes with `resolved: false`.

## Agent Tools

When `--connector google-workspace` is active, 10 additional agent tools are injected into the generated agent:

| Tool | Description |
|------|-------------|
| `find_decisions` | Search resolved comment threads by keyword, document, or person |
| `decision_context` | Find all decision threads, meetings, and emails about a topic |
| `who_decided` | Find people involved in decisions, weighted by participation |
| `document_timeline` | Complete document history: revisions, comments, decisions, meetings |
| `open_questions` | Unresolved comment threads, optionally filtered by document |
| `meeting_decisions` | Documents discussed and decisions made around a meeting |
| `knowledge_contributors` | Top contributors by revisions, decisions, and meetings |
| `trace_decision_to_source` | Trace a claim back through the decision chain |
| `stale_documents` | Documents with open threads that haven't been updated recently |
| `cross_reference` | Find all Google Workspace context for a Linear issue |

## Cross-Connector Linking

The connector scans text content for Linear-style issue references using the pattern `[A-Z]{2,10}-\d+` (e.g., `ENG-123`, `PROJECT-456`). References found in DecisionThread content, Reply content, Document names, EmailThread subjects, and Meeting descriptions create `RELATES_TO_ISSUE` relationships to Issue nodes from the Linear connector.

Drive file URLs (`https://docs.google.com/document/d/{id}/...`) found in Calendar event descriptions, attachments, and Gmail thread snippets create `DISCUSSED_IN` and `THREAD_ABOUT` relationships linking external context back to imported documents.
