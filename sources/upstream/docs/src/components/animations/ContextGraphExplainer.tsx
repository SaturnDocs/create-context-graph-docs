import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { COLORS, SECTION_COPY } from "@site/src/data/animation-config";
import styles from "./ContextGraphExplainer.module.css";

// --- Graph data for the three memory layers ---

const SHORT_TERM_NODES = [
  { id: "conv", label: "Conv", cx: 250, cy: 180, r: 22 },
  { id: "msg1", label: "Msg", cx: 150, cy: 260, r: 14 },
  { id: "msg2", label: "Msg", cx: 250, cy: 290, r: 14 },
  { id: "msg3", label: "Msg", cx: 350, cy: 260, r: 14 },
];

const SHORT_TERM_EDGES = [
  { from: "conv", to: "msg1" },
  { from: "conv", to: "msg2" },
  { from: "conv", to: "msg3" },
];

const LONG_TERM_NODES = [
  { id: "person", label: "Person", cx: 100, cy: 120, r: 18 },
  { id: "org", label: "Org", cx: 400, cy: 120, r: 18 },
  { id: "location", label: "Loc", cx: 400, cy: 240, r: 16 },
  { id: "event", label: "Event", cx: 100, cy: 240, r: 16 },
];

const LONG_TERM_EDGES = [
  { from: "person", to: "org", label: "WORKS_AT" },
  { from: "org", to: "location", label: "LOCATED_IN" },
  { from: "person", to: "event", label: "ATTENDED" },
  { from: "msg1", to: "person" },
  { from: "msg3", to: "org" },
];

const REASONING_NODES = [
  { id: "tool1", label: "Tool", cx: 170, cy: 70, r: 14 },
  { id: "tool2", label: "Tool", cx: 330, cy: 70, r: 14 },
  { id: "trace", label: "Trace", cx: 250, cy: 40, r: 16 },
];

const REASONING_EDGES = [
  { from: "trace", to: "tool1", label: "USED_TOOL" },
  { from: "trace", to: "tool2", label: "USED_TOOL" },
  { from: "tool1", to: "person", label: "QUERIED" },
  { from: "tool2", to: "org", label: "QUERIED" },
  { from: "trace", to: "conv", label: "INFORMED_BY" },
];

const MEMORY_LAYERS = [
  {
    key: "short",
    title: "Short-Term Memory",
    description:
      "Conversation history stored as graph nodes. Every message, every turn, connected and queryable.",
    color: COLORS.memoryShort,
    badge: "Conversations",
  },
  {
    key: "long",
    title: "Long-Term Memory",
    description:
      "Entity knowledge graph built from conversations. People, organizations, locations, and events — all connected.",
    color: COLORS.memoryLong,
    badge: "Knowledge Graph",
  },
  {
    key: "reasoning",
    title: "Reasoning Memory",
    description:
      "Every tool call and decision traced and auditable. Know not just what the agent said, but why.",
    color: COLORS.memoryReasoning,
    badge: "Decision Traces",
  },
  {
    key: "full",
    title: "The Context Graph",
    description:
      "Three memory types, one connected graph. This is what makes agents remember, reason, and explain.",
    color: COLORS.primary,
    badge: "Connected",
  },
];

// Helper to find node position by id across all layers
function getNodePos(id: string): { cx: number; cy: number } {
  const all = [...SHORT_TERM_NODES, ...LONG_TERM_NODES, ...REASONING_NODES];
  const node = all.find((n) => n.id === id);
  return node || { cx: 0, cy: 0 };
}

const TITLE_CLASS_MAP: Record<string, string> = {
  short: styles.memoryTitleShort,
  long: styles.memoryTitleLong,
  reasoning: styles.memoryTitleReasoning,
  full: styles.memoryTitleFull,
};

export function ContextGraphExplainer() {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Opacity transforms for each layer
  const shortTermOpacity = useTransform(
    scrollYProgress,
    [0, 0.08, 0.25, 0.3],
    [0, 1, 1, 1]
  );
  const longTermOpacity = useTransform(
    scrollYProgress,
    [0.2, 0.3, 0.5, 0.55],
    [0, 1, 1, 1]
  );
  const reasoningOpacity = useTransform(
    scrollYProgress,
    [0.45, 0.55, 0.75, 0.8],
    [0, 1, 1, 1]
  );
  const fullPulse = useTransform(
    scrollYProgress,
    [0.75, 0.85, 1],
    [0, 1, 1]
  );

  // Text label opacities — tightened transitions to avoid overlap
  const textOpacities = [
    useTransform(scrollYProgress, [0, 0.08, 0.2, 0.24], [0, 1, 1, 0]),
    useTransform(scrollYProgress, [0.26, 0.32, 0.45, 0.49], [0, 1, 1, 0]),
    useTransform(scrollYProgress, [0.51, 0.57, 0.7, 0.74], [0, 1, 1, 0]),
    useTransform(scrollYProgress, [0.76, 0.82, 1, 1], [0, 1, 1, 1]),
  ];

  // Reduced motion: show everything statically
  if (reducedMotion) {
    return (
      <div className={styles.staticFallback}>
        <svg className={styles.graphSvg} viewBox="0 0 500 340">
          <GraphLayer
            nodes={SHORT_TERM_NODES}
            edges={SHORT_TERM_EDGES}
            color={COLORS.memoryShort}
            opacity={1}
          />
          <GraphLayer
            nodes={LONG_TERM_NODES}
            edges={LONG_TERM_EDGES}
            color={COLORS.memoryLong}
            opacity={1}
          />
          <GraphLayer
            nodes={REASONING_NODES}
            edges={REASONING_EDGES}
            color={COLORS.memoryReasoning}
            opacity={1}
          />
        </svg>
        <div className={styles.staticCards}>
          {MEMORY_LAYERS.slice(0, 3).map((layer) => (
            <div key={layer.key} className={styles.staticCard}>
              <div
                className={styles.memoryBadge}
                style={{ background: layer.color }}
              >
                {layer.badge}
              </div>
              <div className={styles.staticCardTitle}>{layer.title}</div>
              <div className={styles.staticCardDesc}>{layer.description}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.scrollContainer}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{SECTION_COPY.contextGraph}</h2>
        <p className={styles.sectionSubtitle}>Scroll to explore each memory layer</p>
      </div>
      <div className={styles.sticky}>
        <div className={styles.content}>
          {/* Graph visualization */}
          <div className={styles.graphArea}>
            <svg className={styles.graphSvg} viewBox="0 0 500 340">
              {/* Short-term memory layer */}
              <motion.g style={{ opacity: shortTermOpacity }}>
                <GraphLayer
                  nodes={SHORT_TERM_NODES}
                  edges={SHORT_TERM_EDGES}
                  color={COLORS.memoryShort}
                  opacity={1}
                />
              </motion.g>

              {/* Long-term memory layer */}
              <motion.g style={{ opacity: longTermOpacity }}>
                <GraphLayer
                  nodes={LONG_TERM_NODES}
                  edges={LONG_TERM_EDGES}
                  color={COLORS.memoryLong}
                  opacity={1}
                />
              </motion.g>

              {/* Reasoning memory layer */}
              <motion.g style={{ opacity: reasoningOpacity }}>
                <GraphLayer
                  nodes={REASONING_NODES}
                  edges={REASONING_EDGES}
                  color={COLORS.memoryReasoning}
                  opacity={1}
                />
              </motion.g>

              {/* Full graph glow pulse */}
              <motion.g style={{ opacity: fullPulse }}>
                {[...SHORT_TERM_NODES, ...LONG_TERM_NODES, ...REASONING_NODES].map(
                  (node) => (
                    <circle
                      key={`glow-${node.id}`}
                      cx={node.cx}
                      cy={node.cy}
                      r={node.r + 6}
                      fill="none"
                      stroke="rgba(99, 102, 241, 0.3)"
                      strokeWidth={1}
                    />
                  )
                )}
              </motion.g>
            </svg>
          </div>

          {/* Text labels */}
          <div className={styles.textArea}>
            {MEMORY_LAYERS.map((layer, i) => (
              <motion.div
                key={layer.key}
                className={styles.memoryLabel}
                style={{ opacity: textOpacities[i] }}
              >
                <div
                  className={styles.memoryBadge}
                  style={{ background: layer.color }}
                >
                  {layer.badge}
                </div>
                <h3 className={`${styles.memoryTitle} ${TITLE_CLASS_MAP[layer.key]}`}>
                  {layer.title}
                </h3>
                <p className={styles.memoryDescription}>{layer.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Graph layer sub-component ---

function GraphLayer({
  nodes,
  edges,
  color,
  opacity,
}: {
  nodes: typeof SHORT_TERM_NODES;
  edges: { from: string; to: string; label?: string }[];
  color: string;
  opacity: number;
}) {
  return (
    <g opacity={opacity}>
      {/* Edges */}
      {edges.map((edge) => {
        const from = getNodePos(edge.from);
        const to = getNodePos(edge.to);
        return (
          <g key={`${edge.from}-${edge.to}`}>
            <line
              x1={from.cx}
              y1={from.cy}
              x2={to.cx}
              y2={to.cy}
              stroke={color}
              strokeWidth={1}
              opacity={0.3}
            />
            {edge.label && (
              <text
                x={(from.cx + to.cx) / 2}
                y={(from.cy + to.cy) / 2 - 5}
                fill={color}
                fontSize={9}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                opacity={0.5}
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => (
        <g key={node.id}>
          <circle
            cx={node.cx}
            cy={node.cy}
            r={node.r}
            fill={color}
            opacity={0.7}
          />
          <text
            x={node.cx}
            y={node.cy + 3}
            fill="rgba(0,0,0,0.8)"
            fontSize={node.r >= 18 ? 9 : 8}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontWeight={600}
          >
            {node.label}
          </text>
        </g>
      ))}
    </g>
  );
}
