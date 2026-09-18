---
sidebar_position: 2
title: Ontology YAML Schema
---

# Ontology YAML Schema

Every domain in create-context-graph is defined by a single YAML file. This file is the source of truth for everything the tool generates: Neo4j schema, Pydantic models, agent tools, NVL visualization config, and demo scenarios.

## Top-Level Structure

```yaml
inherits: _base          # Required: merge POLE+O base types

domain:                   # Required
  id: my-domain
  name: My Domain
  description: ...
  tagline: ...
  emoji: ...

entity_types: [...]       # Required: list of entity type definitions
relationships: [...]      # Required: list of relationship definitions
document_templates: [...] # Optional: templates for synthetic documents
decision_traces: [...]    # Optional: reasoning trace scenarios
demo_scenarios: [...]     # Optional: pre-built chat prompts
agent_tools: [...]        # Required: domain-specific agent tools
system_prompt: |          # Required: multi-line agent system prompt
  ...
visualization:            # Optional: NVL visualization overrides
  node_colors: {}
  node_sizes: {}
  default_cypher: ...
```

## `inherits`

```yaml
inherits: _base
```

All domain ontologies should declare `inherits: _base`. This merges the base POLE+O entity types (Person, Organization, Location, Event, Object) and their standard relationships into the domain. Base types are prepended to the entity list unless the domain explicitly redefines an entity with the same label.

## `domain`

Domain metadata used in the generated project's README, UI, and configuration.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Kebab-case identifier (e.g., `financial-services`). Must match the YAML filename. |
| `name` | string | yes | Human-readable display name. |
| `description` | string | no | One-sentence domain description. |
| `tagline` | string | no | Short tagline for the generated app's UI. |
| `emoji` | string | no | Emoji displayed alongside the domain name. |

```yaml
domain:
  id: financial-services
  name: Financial Services
  description: Investment management, trading, compliance, and risk assessment
  tagline: "AI-powered Financial Intelligence"
  emoji: "\U0001F4B0"
```

## `entity_types`

A list of entity type definitions. Each maps to a Neo4j node label.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | yes | Neo4j node label (PascalCase). |
| `pole_type` | string | yes | POLE+O category. One of: `PERSON`, `ORGANIZATION`, `LOCATION`, `EVENT`, `OBJECT`. |
| `subtype` | string | no | More specific classification within the POLE+O type. |
| `color` | string | no | Hex color for NVL visualization. Default: `#6366f1`. |
| `icon` | string | no | Icon identifier for the frontend. Default: `circle`. |
| `properties` | list | no | List of property definitions (see below). |

### POLE+O Types

The POLE+O model is a classification system for entities in knowledge graphs:

- **PERSON** -- Individuals (patients, employees, customers, suspects)
- **ORGANIZATION** -- Companies, teams, departments, agencies
- **LOCATION** -- Physical places, addresses, regions
- **EVENT** -- Time-bound occurrences (transactions, incidents, appointments)
- **OBJECT** -- Everything else (accounts, documents, equipment, products)

### Property Definitions

Each property within an entity type or relationship accepts:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Property name (snake_case). |
| `type` | string | no | Data type. Default: `string`. |
| `required` | boolean | no | Whether the property is mandatory. Default: `false`. |
| `unique` | boolean | no | Whether to create a uniqueness constraint in Neo4j. Default: `false`. |
| `enum` | list | no | Allowed values. Generates a Python `Enum` class. |
| `default` | any | no | Default value. |
| `description` | string | no | Human-readable description. |

### Supported Property Types

| Type | Python Type | Neo4j Type | Description |
|------|-------------|------------|-------------|
| `string` | `str` | `STRING` | Text values |
| `integer` | `int` | `INTEGER` | Whole numbers |
| `float` | `float` | `FLOAT` | Decimal numbers |
| `boolean` | `bool` | `BOOLEAN` | True/false |
| `date` | `date` | `DATE` | Calendar date |
| `datetime` | `datetime` | `DATETIME` | Date and time |
| `point` | `str` | `POINT` | Geographic coordinates |

### Example

```yaml
entity_types:
  - label: Account
    pole_type: OBJECT
    subtype: FINANCIAL_ACCOUNT
    color: "#0ea5e9"
    icon: wallet
    properties:
      - name: account_id
        type: string
        required: true
        unique: true
      - name: name
        type: string
        required: true
      - name: account_type
        type: string
        enum: [checking, savings, investment, retirement, trust]
      - name: balance
        type: float
      - name: currency
        type: string
        default: USD
      - name: status
        type: string
        enum: [active, frozen, closed]
```

:::caution YAML Boolean Quoting
When using boolean-like values in `enum` lists, you must quote them. YAML interprets unquoted `true` and `false` as booleans, not strings.

```yaml
# Wrong - YAML parses these as boolean true/false
enum: [true, false]

# Correct - quoted strings
enum: ["true", "false"]
```
:::

## `relationships`

A list of relationship type definitions. Each maps to a Neo4j relationship type.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | yes | Relationship type (UPPER_SNAKE_CASE). |
| `source` | string | yes | Source entity label. |
| `target` | string | yes | Target entity label. |
| `properties` | list | no | List of property definitions (same schema as entity properties). |

```yaml
relationships:
  - type: OWNS_ACCOUNT
    source: Person
    target: Account
  - type: EXECUTED_TRANSACTION
    source: Account
    target: Transaction
  - type: ADVISED_BY
    source: Person
    target: Person
```

The base ontology (`_base.yaml`) provides these relationships automatically:

- `WORKS_FOR`: Person -> Organization
- `LOCATED_AT`: Organization -> Location
- `PARTICIPATED_IN`: Person -> Event

## `document_templates`

Templates that guide synthetic document generation. Each template produces a batch of documents when `--demo-data` is used with an LLM API key.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Template identifier. |
| `name` | string | yes | Human-readable template name. |
| `description` | string | no | What this document type represents. |
| `count` | integer | no | Number of documents to generate. Default: `5`. |
| `prompt_template` | string | no | LLM prompt template for generation. May reference entity names. |
| `required_entities` | list | no | Entity labels that must exist before this document can be generated. |

```yaml
document_templates:
  - id: quarterly_report
    name: Quarterly Investment Report
    description: Portfolio performance summary for a client
    count: 3
    prompt_template: |
      Write a quarterly investment report for client {Person}
      covering their portfolio in account {Account}.
    required_entities: [Person, Account]
```

## `decision_traces`

Decision trace scenarios define multi-step reasoning patterns for generating reasoning memory. Each trace records the thought process an agent would follow.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Trace identifier. |
| `task` | string | yes | The task or question being reasoned about. |
| `steps` | list | no | Ordered list of reasoning steps. |
| `outcome_template` | string | no | Template for the final outcome. |

Each step contains:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `thought` | string | yes | The agent's internal reasoning. |
| `action` | string | yes | The action taken (tool call, query, etc.). |
| `observation` | string | no | The result of the action. |

```yaml
decision_traces:
  - id: risk_assessment
    task: Evaluate portfolio risk for a high-net-worth client
    steps:
      - thought: I need to check the client's current portfolio allocation
        action: query_portfolio(client_name)
      - thought: The portfolio is heavily weighted in tech stocks
        action: check_sector_exposure(portfolio_id)
      - thought: Sector concentration exceeds risk threshold
        action: generate_rebalancing_recommendation()
    outcome_template: "Risk assessment complete: {recommendation}"
```

## `demo_scenarios`

Pre-built chat scenarios displayed in the generated frontend. Each scenario provides a sequence of prompts a user can click to demo the agent.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Scenario display name. |
| `prompts` | list | yes | Ordered list of chat messages to send. |

```yaml
demo_scenarios:
  - name: Portfolio Review
    prompts:
      - "Show me the current portfolio for Sarah Chen"
      - "What is her risk exposure in the technology sector?"
      - "Recommend a rebalancing strategy"
```

## `agent_tools`

Domain-specific tools the AI agent can call. Each tool maps to a Cypher query executed against Neo4j.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Tool function name (snake_case). |
| `description` | string | yes | What the tool does. This is passed to the LLM as the tool description. |
| `cypher` | string | no | Cypher query to execute. Use `$param_name` for parameters. |
| `parameters` | list | no | List of parameter definitions (same schema as properties). |

```yaml
agent_tools:
  - name: get_client_portfolio
    description: Retrieve a client's complete portfolio including all accounts and positions
    cypher: |
      MATCH (p:Person {name: $client_name})-[:OWNS_ACCOUNT]->(a:Account)
      OPTIONAL MATCH (a)-[:HOLDS]->(pos:Position)
      RETURN p, a, pos
    parameters:
      - name: client_name
        type: string
        required: true
        description: The client's full name
```

## `system_prompt`

A multi-line string that becomes the agent's system prompt. It should describe the agent's role, capabilities, and behavioral guidelines for the domain.

```yaml
system_prompt: |
  You are an AI financial advisor assistant with access to a knowledge graph
  containing client portfolios, transactions, and market data.

  Your responsibilities:
  - Answer questions about client portfolios and positions
  - Analyze transaction patterns and risk exposure
  - Provide investment recommendations based on graph data
  - Flag compliance concerns

  Always cite specific data from the knowledge graph in your responses.
```

## `visualization`

Configuration for the NVL (Neo4j Visualization Library) graph view in the frontend.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `node_colors` | map | no | Label-to-hex-color mapping. Overrides entity type colors. |
| `node_sizes` | map | no | Label-to-pixel-size mapping. Default: `20`. |
| `default_cypher` | string | no | Initial Cypher query for the graph view. Default: `MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 100`. |

```yaml
visualization:
  node_colors:
    Account: "#0ea5e9"
    Transaction: "#f59e0b"
  node_sizes:
    Person: 30
    Account: 25
  default_cypher: |
    MATCH (p:Person)-[:OWNS_ACCOUNT]->(a:Account)-[:EXECUTED]->(t:Transaction)
    RETURN p, a, t LIMIT 50
```

If `node_colors` is not specified for an entity type, the `color` field from the entity type definition is used automatically.

## Complete Minimal Example

```yaml
inherits: _base

domain:
  id: bookstore
  name: Bookstore
  description: Book inventory, customers, and sales
  tagline: "AI-powered Book Recommendations"
  emoji: "\U0001F4DA"

entity_types:
  - label: Book
    pole_type: OBJECT
    color: "#8b5cf6"
    icon: book
    properties:
      - name: title
        type: string
        required: true
      - name: isbn
        type: string
        unique: true
      - name: genre
        type: string
      - name: price
        type: float

relationships:
  - type: PURCHASED
    source: Person
    target: Book
  - type: AUTHORED
    source: Person
    target: Book

agent_tools:
  - name: search_books
    description: Search for books by title or genre
    cypher: |
      MATCH (b:Book)
      WHERE b.title CONTAINS $query OR b.genre = $query
      RETURN b
    parameters:
      - name: query
        type: string
        required: true

system_prompt: |
  You are a bookstore assistant with access to the inventory
  and customer purchase history.

demo_scenarios:
  - name: Book Recommendation
    prompts:
      - "What science fiction books do we have in stock?"
      - "Who has purchased the most books this month?"
```
