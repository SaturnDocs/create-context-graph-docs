/**
 * Centralized configuration for all landing page animations.
 * Update this file when domains, frameworks, or branding changes.
 */

// --- Domain data (23 domains) ---

export interface DomainInfo {
  id: string;
  name: string;
  emoji: string;
  entityTypes: string[];
}

export const DOMAINS: DomainInfo[] = [
  { id: "healthcare", name: "Healthcare", emoji: "\u{1F3E5}", entityTypes: ["Patient", "Provider", "Diagnosis", "Treatment"] },
  { id: "financial-services", name: "Financial Services", emoji: "\u{1F4B0}", entityTypes: ["Account", "Transaction", "Decision", "Policy"] },
  { id: "software-engineering", name: "Software Engineering", emoji: "\u{1F4BB}", entityTypes: ["Repository", "Issue", "PullRequest", "Deployment"] },
  { id: "gaming", name: "Gaming", emoji: "\u{1F3AE}", entityTypes: ["Player", "Character", "Item", "Quest"] },
  { id: "real-estate", name: "Real Estate", emoji: "\u{1F3E0}", entityTypes: ["Property", "Listing", "Agent", "Transaction"] },
  { id: "manufacturing", name: "Manufacturing", emoji: "\u{1F3ED}", entityTypes: ["Machine", "Part", "WorkOrder", "Supplier"] },
  { id: "retail-ecommerce", name: "Retail & E-Commerce", emoji: "\u{1F6D2}", entityTypes: ["Customer", "Product", "Order", "Review"] },
  { id: "scientific-research", name: "Scientific Research", emoji: "\u{1F52C}", entityTypes: ["Researcher", "Paper", "Dataset", "Experiment"] },
  { id: "trip-planning", name: "Trip Planning", emoji: "\u{1F30D}", entityTypes: ["Destination", "Hotel", "Activity", "Restaurant"] },
  { id: "conservation", name: "Conservation", emoji: "\u{1F33F}", entityTypes: ["Site", "Species", "Program", "Funding"] },
  { id: "data-journalism", name: "Data Journalism", emoji: "\u{1F4F0}", entityTypes: ["Source", "Story", "Dataset", "Claim"] },
  { id: "agent-memory", name: "Agent Memory", emoji: "\u{1F9E0}", entityTypes: ["Agent", "Conversation", "Entity", "Memory"] },
  { id: "digital-twin", name: "Digital Twin", emoji: "\u{1F3ED}", entityTypes: ["Asset", "Sensor", "Reading", "Alert"] },
  { id: "genai-llm-ops", name: "GenAI & LLM Ops", emoji: "\u{1F916}", entityTypes: ["Model", "Experiment", "Dataset", "Prompt"] },
  { id: "gis-cartography", name: "GIS & Cartography", emoji: "\u{1F5FA}", entityTypes: ["Feature", "Layer", "Survey", "Coordinate"] },
  { id: "golf-sports", name: "Golf Sports", emoji: "\u26F3", entityTypes: ["Course", "Player", "Round", "Tournament"] },
  { id: "hospitality", name: "Hospitality", emoji: "\u{1F3E8}", entityTypes: ["Hotel", "Room", "Reservation", "Guest"] },
  { id: "oil-gas", name: "Oil & Gas", emoji: "\u{1F6E2}\uFE0F", entityTypes: ["Well", "Reservoir", "Equipment", "Inspection"] },
  { id: "personal-knowledge", name: "Personal Knowledge", emoji: "\u{1F4DD}", entityTypes: ["Note", "Contact", "Project", "Topic"] },
  { id: "product-management", name: "Product Management", emoji: "\u{1F4CB}", entityTypes: ["Feature", "Epic", "UserPersona", "Metric"] },
  { id: "vacation-industry", name: "Vacation Industry", emoji: "\u{1F3D6}\uFE0F", entityTypes: ["Resort", "Booking", "Guest", "Activity"] },
  { id: "wildlife-management", name: "Wildlife Management", emoji: "\u{1F43B}", entityTypes: ["Species", "Individual", "Sighting", "Habitat"] },
];

// --- Framework data (8 frameworks) ---

export interface FrameworkInfo {
  id: string;
  displayName: string;
  streaming: boolean;
  codeSnippet: string;
}

export const FRAMEWORKS: FrameworkInfo[] = [
  {
    id: "pydanticai",
    displayName: "PydanticAI",
    streaming: true,
    codeSnippet: `@agent.tool\nasync def query_knowledge_graph(\n    ctx: RunContext[AgentDeps],\n    cypher: str\n) -> str:`,
  },
  {
    id: "claude-agent-sdk",
    displayName: "Claude Agent SDK",
    streaming: true,
    codeSnippet: `TOOLS = [{\n    "name": "query_knowledge_graph",\n    "description": "Execute Cypher",\n    "input_schema": { ... }\n}]`,
  },
  {
    id: "openai-agents",
    displayName: "OpenAI Agents SDK",
    streaming: true,
    codeSnippet: `@function_tool\nasync def query_knowledge_graph(\n    cypher: str\n) -> str:`,
  },
  {
    id: "langgraph",
    displayName: "LangGraph",
    streaming: true,
    codeSnippet: `@tool\ndef query_knowledge_graph(\n    cypher: str\n) -> str:\n    """Execute a Cypher query."""`,
  },
  {
    id: "anthropic-tools",
    displayName: "Anthropic Tools",
    streaming: true,
    codeSnippet: `@register_tool(\n    name="query_knowledge_graph",\n    description="Execute Cypher"\n)\nasync def query_kg(cypher: str):`,
  },
  {
    id: "crewai",
    displayName: "CrewAI",
    streaming: false,
    codeSnippet: `@tool("query_knowledge_graph")\ndef query_knowledge_graph(\n    cypher: str\n) -> str:`,
  },
  {
    id: "strands",
    displayName: "Strands",
    streaming: false,
    codeSnippet: `@tool\ndef query_knowledge_graph(\n    cypher: str\n) -> str:`,
  },
  {
    id: "google-adk",
    displayName: "Google ADK",
    streaming: true,
    codeSnippet: `def query_knowledge_graph(\n    cypher: str\n) -> dict:\n    """Execute a Cypher query."""`,
  },
];

// --- Hero animation timing (seconds) ---

export const TIMING = {
  initialDelay: 0.5,
  phase1: { duration: 2, charDelay: 0.05 },
  phase2: { duration: 6, stepDelay: 1.2, scrollDelay: 0.4 },
  phase3: { duration: 4, lineDelay: 0.15 },
  phase4: { duration: 3 },
  total: 15,
};

// --- Wizard simulation data ---

export const WIZARD_COMMAND = "uvx create-context-graph my-healthcare-app";

export const WIZARD_DOMAINS_SCROLL = [
  "financial-services",
  "real-estate",
  "manufacturing",
  "scientific-research",
  "healthcare",
];

export const WIZARD_FRAMEWORKS_SCROLL = [
  "claude-agent-sdk",
  "langgraph",
  "openai-agents",
  "pydanticai",
];

export const SCAFFOLD_FILES = [
  "backend/app/__init__.py",
  "backend/app/main.py",
  "backend/app/config.py",
  "backend/app/routes.py",
  "backend/app/models.py",
  "backend/app/agent.py",
  "backend/app/context_graph_client.py",
  "frontend/app/layout.tsx",
  "frontend/app/page.tsx",
  "frontend/components/ChatInterface.tsx",
  "frontend/components/ContextGraphView.tsx",
  "cypher/schema.cypher",
  "data/ontology.yaml",
  "data/fixtures.json",
  "Makefile",
  "docker-compose.yml",
];

// --- Color tokens ---

export const COLORS = {
  primary: "#6366F1",
  primaryDark: "#4F46E5",
  secondary: "#009999",
  terminalBg: "#1E1E1E",
  terminalGreen: "#4ADE80",
  terminalPurple: "#A78BFA",
  terminalGray: "#9CA3AF",
  memoryShort: "#B2F2BB",
  memoryLong: "#FFEC99",
  memoryReasoning: "#D0BFFF",
  // Node colors for app preview graph
  nodePatient: "#F472B6",
  nodeCondition: "#A78BFA",
  nodeDoctor: "#FB923C",
  nodeTreatment: "#4ADE80",
};

// --- Hero copy ---

export const HERO_COPY = {
  headline: "AI agents with graph memory, scaffolded in seconds.",
  subheadline:
    "Pick your domain. Pick your framework. Get a full-stack app with streaming chat, graph visualization, and decision tracing.",
  ctaPrimary: "Get Started",
  ctaPrimaryHref: "/docs/intro",
  ctaSecondary: "View on GitHub",
  ctaSecondaryHref: "https://github.com/neo4j-labs/create-context-graph",
};

// --- Section headlines ---

export const SECTION_COPY = {
  appPreview: "See what you'll build",
  contextGraph: "Three memory types. One connected graph.",
  domains: "23 domains. Your industry, ready to go.",
  frameworks: "Bring your favorite agent framework.",
  howItWorks: "From zero to running app in 4 commands.",
  trustBar: "",
  bottomCta: "Ready to build your context graph?",
};

// --- Trust bar stats ---

export const TRUST_STATS = [
  { label: "Domains", value: 22 },
  { label: "Agent Frameworks", value: 8 },
  { label: "Passing Tests", value: 1033 },
];

// --- How It Works steps ---

export const HOW_IT_WORKS_STEPS = [
  {
    title: "Scaffold",
    command: "uvx create-context-graph my-app --domain healthcare --framework pydanticai --demo-data",
  },
  {
    title: "Install",
    command: "cd my-app && make install",
  },
  {
    title: "Seed",
    command: "make docker-up && make seed",
  },
  {
    title: "Start",
    command: "make start",
  },
];
