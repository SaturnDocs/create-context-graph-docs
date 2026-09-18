---
sidebar_position: 2
title: "Customizing Your Domain Ontology"
---

# Customizing Your Domain Ontology

Every context graph application is driven by a domain ontology -- a YAML file that defines the entity types, relationships, agent tools, and visualization settings for your knowledge graph. This tutorial explains how to modify an existing ontology or create one from scratch.

:::tip
For the complete YAML specification with all fields, property types, and validation rules, see the [Ontology YAML Schema](/docs/reference/ontology-yaml-schema) reference.
:::

## What Is a Domain Ontology?

The ontology is the blueprint for your entire application. It determines:

- **Entity types** -- the kinds of nodes in your graph (e.g., Patient, Provider, Facility)
- **Relationships** -- how entities connect (e.g., `DIAGNOSED_WITH`, `TREATED_BY`)
- **Agent tools** -- Cypher queries the AI agent can execute to answer questions
- **Document templates** -- prompts for generating synthetic documents
- **Decision traces** -- step-by-step reasoning patterns for the agent
- **Demo scenarios** -- sample prompts to showcase the app
- **Visualization settings** -- node colors, sizes, and default queries

## Where the Ontology Lives

In a generated project, the ontology file is at:

```
my-app/
└── data/
    ├── ontology.yaml    # Your domain ontology
    └── _base.yaml       # Base POLE+O entity types (inherited)
```

The `ontology.yaml` file is a copy of the domain YAML that was selected during project creation. You can edit it freely.

## Two-Layer Inheritance

Every domain ontology inherits from `_base.yaml`, which defines shared POLE+O (Person, Organization, Location, Event, Object) entity types. When the ontology is loaded, base entities and relationships are merged into your domain definition automatically.

Your domain YAML declares this with:

```yaml
inherits: _base
```

This means you get common entity types for free and only need to define domain-specific additions. You can override base types by re-declaring them with the same label.

## Modifying an Existing Ontology

### Adding an Entity Type

Open `data/ontology.yaml` and add a new entry under `entity_types`. Each entity type needs a label, POLE type classification, visual settings, and properties.

For example, to add an `InsurancePlan` entity to a healthcare ontology:

```yaml
entity_types:
  # ... existing types ...

  - label: InsurancePlan
    pole_type: OBJECT
    subtype: INSURANCE
    color: "#f97316"
    icon: shield
    properties:
      - name: plan_id
        type: string
        required: true
        unique: true
      - name: name
        type: string
        required: true
      - name: plan_type
        type: string
        enum: [HMO, PPO, EPO, POS]
      - name: monthly_premium
        type: float
      - name: active
        type: boolean
```

### Adding a Relationship

Add a new entry under `relationships`, specifying the type name and the source/target entity labels:

```yaml
relationships:
  # ... existing relationships ...

  - type: COVERED_BY
    source: Patient
    target: InsurancePlan
  - type: ACCEPTED_BY
    source: Facility
    target: InsurancePlan
```

### Adding an Agent Tool

Agent tools give the AI agent the ability to query your graph. Each tool defines a name, description, a Cypher query, and parameters:

```yaml
agent_tools:
  # ... existing tools ...

  - name: check_insurance_coverage
    description: Check which facilities accept a patient's insurance plan
    cypher: |
      MATCH (p:Patient {patient_id: $patient_id})-[:COVERED_BY]->(plan:InsurancePlan)
      MATCH (f:Facility)-[:ACCEPTED_BY]->(plan)
      RETURN p.name AS patient, plan.name AS plan,
             collect(f.name) AS covered_facilities
    parameters:
      - name: patient_id
        type: string
        description: Patient ID to check coverage for
```

After adding a tool, the agent template automatically picks it up -- no code changes needed.

### Updating Visualization Settings

Add your new entity type to the visualization section so it renders properly in the graph view:

```yaml
visualization:
  node_colors:
    # ... existing colors ...
    InsurancePlan: "#f97316"
  node_sizes:
    # ... existing sizes ...
    InsurancePlan: 20
```

## Creating a New Ontology from Scratch

If none of the 22 built-in domains fit your needs, you can write a complete ontology YAML. Here is the full structure:

```yaml
inherits: _base

domain:
  id: my-domain
  name: My Domain
  description: A brief description of the domain
  tagline: "A catchy tagline"
  emoji: "\U0001F4CA"

entity_types:
  - label: MyEntity
    pole_type: OBJECT          # PERSON, ORGANIZATION, LOCATION, EVENT, or OBJECT
    subtype: MY_SUBTYPE
    color: "#3b82f6"
    icon: box
    properties:
      - name: entity_id
        type: string
        required: true
        unique: true
      - name: name
        type: string
        required: true
      - name: category
        type: string
        enum: [option_a, option_b, option_c]
      - name: value
        type: float
      - name: created_at
        type: datetime

relationships:
  - type: RELATES_TO
    source: MyEntity
    target: MyEntity

document_templates:
  - id: summary
    name: Summary Report
    description: Generated summary documents
    count: 10
    prompt_template: |
      Write a summary for {{entity.name}} covering recent activity.
    required_entities: [MyEntity]

decision_traces:
  - id: analysis
    task: "Analyze {{entity.name}} for anomalies"
    steps:
      - thought: "Retrieve entity data and relationships"
        action: "Query the entity's full subgraph"
      - thought: "Compare against historical patterns"
        action: "Search for similar entities and their outcomes"
    outcome_template: "Analysis result: {{result}}"

demo_scenarios:
  - name: Basic Queries
    prompts:
      - "Show me all entities of type X"
      - "What is connected to entity Y?"

agent_tools:
  - name: search_entities
    description: Search entities by name
    cypher: |
      MATCH (e:MyEntity)
      WHERE toLower(e.name) CONTAINS toLower($query)
      RETURN e LIMIT 20
    parameters:
      - name: query
        type: string
        description: Search term

system_prompt: |
  You are an AI assistant with access to a knowledge graph.
  Help users explore and analyze the data.

visualization:
  node_colors:
    MyEntity: "#3b82f6"
  node_sizes:
    MyEntity: 20
  default_cypher: "MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 100"
```

## Property Types

The following property types are supported for entity properties:

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text values | `"John Doe"` |
| `integer` | Whole numbers | `42` |
| `float` | Decimal numbers | `3.14` |
| `boolean` | True/false | `true` |
| `date` | Date without time | `2025-01-15` |
| `datetime` | Date with time | `2025-01-15T09:30:00` |
| `point` | Geographic coordinates | `{latitude: 40.7, longitude: -74.0}` |

When using boolean values in `enum` lists, always quote them as strings to avoid YAML parsing issues:

```yaml
# Correct
enum: ["true", "false"]

# Incorrect -- YAML will parse these as boolean literals
enum: [true, false]
```

## Validating Your Changes

Before regenerating data, verify that your YAML is well-formed:

```bash
# Preview the project config without creating files
uvx create-context-graph my-test \
  --domain healthcare \
  --framework pydanticai \
  --dry-run
```

If there are YAML syntax errors or missing required fields, the CLI will report them.

## Regenerating Data After Changes

After modifying your ontology, reseed Neo4j so the data reflects your new schema:

```bash
# From your project directory
cd my-app

# Reset and reseed with the updated ontology
make reset
make seed
```

To generate LLM-powered realistic data instead of static placeholders:

```bash
cd my-app/backend
python scripts/generate_data.py --anthropic-api-key YOUR_KEY
make seed
```

If you do not have an API key, `make seed` uses the static fallback data with domain-specific name pools.

:::info Suggested next tutorial
Ready for more? Continue with **[Build a Developer Knowledge Graph from Claude Code Sessions](./claude-code-sessions)** to learn how to import your coding sessions into a context graph.
:::
