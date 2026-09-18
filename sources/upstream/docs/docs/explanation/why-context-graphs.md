---
sidebar_position: 3
---

# Why Context Graphs?

AI agents need memory to be useful. But not all memory is created equal. This page explains why graph-structured memory — what we call a **context graph** — is fundamentally better for AI agents than flat document stores or vector databases alone.

<!-- TODO: Export from graph-vs-flat.excalidraw and replace placeholder -->
![Side-by-side comparison of flat memory vs context graph](/img/graph-vs-flat.png)

```mermaid
graph TB
    subgraph flat ["Flat Memory (Chat + Vectors)"]
        direction LR
        Chat["Chat Log\nmsg1 → msg2 → msg3"]
        Vec["Vector Store\nchunk1, chunk2, ..."]
        Chat --- Vec
    end
    subgraph graph ["Context Graph (Three Memory Types)"]
        direction LR
        P1["Person"] -->|WORKS_FOR| O1["Organization"]
        P1 -->|DIAGNOSED_WITH| D1["Diagnosis"]
        O1 -->|LOCATED_AT| L1["Location"]
        P1 -.->|conversation| Msg["Messages"]
        D1 -.->|reasoning| Trace["Decision Trace"]
    end
    flat -->|upgrade to| graph
```

## The Problem with Flat Memory

Most AI agent frameworks store memory as:
- **Chat history**: A linear sequence of messages
- **Vector store**: Chunks of text embedded and retrieved by similarity
- **Key-value store**: Simple facts stored as pairs

These approaches work for simple Q&A but break down when agents need to:

1. **Connect information across conversations** — "The patient I discussed yesterday has a new diagnosis"
2. **Reason about relationships** — "Which organizations are connected to this person?"
3. **Trace decisions back to evidence** — "Why did the agent recommend this treatment?"
4. **Navigate multi-hop paths** — "Find all patients treated by doctors who trained at this hospital"

## Three Memory Types, One Connected Graph

A context graph combines three complementary memory layers in a single Neo4j database:

### 1. Knowledge Graph (Long-term Memory)

Entities (people, organizations, events, objects) and their relationships, structured using the **POLE+O model**:

- **P**erson — People, patients, players, researchers
- **O**rganization — Companies, hospitals, teams, agencies
- **L**ocation — Places, facilities, regions
- **E**vent — Incidents, encounters, transactions
- **O**bject — Documents, artifacts, instruments

Each domain extends these base types with domain-specific entities (e.g., `Diagnosis`, `Treatment`, `Medication` for healthcare).

### 2. Conversation History (Working Memory)

Multi-turn conversations stored as connected message nodes. Unlike flat chat logs, conversation nodes link to the knowledge graph entities they reference — so the agent can recall not just *what was said* but *what it was about*.

### 3. Decision Traces (Episodic Memory)

When an agent makes a decision (recommending a treatment, flagging a risk, choosing a data source), the reasoning chain is preserved as a trace:

```
DecisionTrace → HAS_STEP → TraceStep[1] → TraceStep[2] → ...
```

Each step records the thought, action, and observation. This provides auditable reasoning provenance — critical for high-stakes domains like healthcare and finance.

## Why Graphs Beat Vectors

| Capability | Vector Store | Knowledge Graph |
|---|---|---|
| Semantic similarity search | Excellent | Good (with embeddings) |
| Exact relationship queries | Poor | Excellent |
| Multi-hop reasoning | Not possible | Native |
| Schema enforcement | None | Full |
| Explainable connections | No | Yes |
| Incremental updates | Requires re-embedding | Add nodes/edges |

The key insight: **vectors find similar things; graphs find connected things.** AI agents need both — similarity for discovery, structure for reasoning.

## How create-context-graph Uses This

When you scaffold a project with `create-context-graph`, the generated application includes:

- **Neo4j database** with a domain-specific schema (entities, relationships, constraints)
- **Agent tools** that query the knowledge graph via Cypher
- **Memory integration** via `neo4j-agent-memory` for conversation persistence
- **Decision trace storage** for reasoning provenance
- **Interactive visualization** showing the graph structure and agent queries in real-time

The agent doesn't just retrieve documents — it navigates a structured knowledge space, following relationships and building context from connected entities.

## Further Reading

- [How Domain Ontologies Work](/docs/explanation/how-domain-ontologies-work) — How entity schemas drive the entire application
- [Three Memory Types](/docs/explanation/three-memory-types) — Deep dive into the memory architecture
- [Your First Context Graph App](/docs/tutorials/first-context-graph-app) — Build one and see for yourself
