import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BrowserFrame } from "@site/src/components/ui/BrowserFrame";
import { COLORS } from "@site/src/data/animation-config";
import styles from "./AppPreview.module.css";

const USER_QUERY =
  "Show me patients with diabetes who were treated in the last 30 days";
const ASSISTANT_RESPONSE =
  "I found 12 patients with diabetes type 2 who received treatment in the last 30 days. The most common treatments were Metformin (8 patients) and Insulin therapy (4 patients), primarily managed by Dr. Chen and Dr. Patel in the Endocrinology department.";
const CYPHER_QUERY = `MATCH (p:Patient)-[:HAS_CONDITION]->(c:Condition)
WHERE c.name CONTAINS 'diabetes'
MATCH (p)-[:RECEIVED]->(t:Treatment)
WHERE t.date > date() - duration('P30D')
RETURN p, c, t`;

// Graph node positions (centered SVG coordinate system)
const GRAPH_NODES = [
  { id: "patient", label: "Patient", cx: 150, cy: 190, r: 24, color: COLORS.nodePatient },
  { id: "condition", label: "Condition", cx: 280, cy: 100, r: 20, color: COLORS.nodeCondition },
  { id: "treatment", label: "Treatment", cx: 280, cy: 280, r: 20, color: COLORS.nodeTreatment },
  { id: "doctor", label: "Doctor", cx: 60, cy: 100, r: 18, color: COLORS.nodeDoctor },
  { id: "department", label: "Department", cx: 60, cy: 280, r: 16, color: COLORS.primary },
];

const GRAPH_EDGES = [
  { source: "patient", target: "condition", label: "HAS_CONDITION" },
  { source: "patient", target: "treatment", label: "RECEIVED" },
  { source: "doctor", target: "patient", label: "TREATS" },
  { source: "doctor", target: "department", label: "BELONGS_TO" },
];

export function AppPreview() {
  const reducedMotion = useReducedMotion();
  const [chatPhase, setChatPhase] = useState(0); // 0=user, 1=tool, 2=toolDone, 3=response
  const [responseChars, setResponseChars] = useState(0);
  const [visibleNodes, setVisibleNodes] = useState(0);
  const [visibleEdges, setVisibleEdges] = useState(0);
  const [showDetail, setShowDetail] = useState(false);

  // Reduced motion: show everything immediately
  useEffect(() => {
    if (reducedMotion) {
      setChatPhase(3);
      setResponseChars(ASSISTANT_RESPONSE.length);
      setVisibleNodes(GRAPH_NODES.length);
      setVisibleEdges(GRAPH_EDGES.length);
      setShowDetail(true);
    }
  }, [reducedMotion]);

  // Chat animation sequence
  useEffect(() => {
    if (reducedMotion) return;
    const timers = [
      setTimeout(() => setChatPhase(1), 800),          // show tool call
      setTimeout(() => setChatPhase(2), 2200),          // tool done
      setTimeout(() => setChatPhase(3), 2800),          // start response
      setTimeout(() => setShowDetail(true), 4500),      // show detail panel
    ];
    return () => timers.forEach(clearTimeout);
  }, [reducedMotion]);

  // Streaming response text
  useEffect(() => {
    if (chatPhase < 3 || reducedMotion) return;
    if (responseChars < ASSISTANT_RESPONSE.length) {
      const id = setTimeout(
        () => setResponseChars((c) => Math.min(c + 2, ASSISTANT_RESPONSE.length)),
        15
      );
      return () => clearTimeout(id);
    }
  }, [chatPhase, responseChars, reducedMotion]);

  // Graph nodes appearing
  useEffect(() => {
    if (reducedMotion) return;
    if (chatPhase >= 1 && visibleNodes < GRAPH_NODES.length) {
      const id = setTimeout(
        () => setVisibleNodes((n) => n + 1),
        400
      );
      return () => clearTimeout(id);
    }
  }, [chatPhase, visibleNodes, reducedMotion]);

  // Graph edges appearing
  useEffect(() => {
    if (reducedMotion) return;
    if (visibleNodes >= 2 && visibleEdges < GRAPH_EDGES.length) {
      const id = setTimeout(
        () => setVisibleEdges((e) => e + 1),
        500
      );
      return () => clearTimeout(id);
    }
  }, [visibleNodes, visibleEdges, reducedMotion]);

  const nodeMap = Object.fromEntries(GRAPH_NODES.map((n) => [n.id, n]));

  return (
    <div className={styles.container}>
      <BrowserFrame url="localhost:3000">
        <div className={styles.panels}>
          {/* Chat Panel */}
          <div className={styles.chatPanel}>
            <motion.div
              className={styles.userMessage}
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {USER_QUERY}
            </motion.div>

            {chatPhase >= 1 && (
              <motion.div
                className={styles.toolCall}
                initial={reducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span
                  className={`${styles.toolCallDot} ${
                    chatPhase >= 2 ? styles.toolCallDone : styles.toolCallActive
                  }`}
                />
                query_knowledge_graph
                {chatPhase >= 2 && (
                  <span style={{ color: COLORS.terminalGreen }}> &#10003;</span>
                )}
              </motion.div>
            )}

            {chatPhase >= 3 && (
              <motion.div
                className={styles.assistantMessage}
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {ASSISTANT_RESPONSE.slice(0, responseChars)}
                {responseChars < ASSISTANT_RESPONSE.length && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 4,
                      height: "1em",
                      background: "rgba(255,255,255,0.5)",
                      verticalAlign: "text-bottom",
                      animation: "pulse 0.8s ease-in-out infinite",
                    }}
                  />
                )}
              </motion.div>
            )}
          </div>

          {/* Graph Panel */}
          <div className={styles.graphPanel}>
            <svg className={styles.graphSvg} viewBox="0 0 340 380">
              {/* Edges */}
              {GRAPH_EDGES.slice(0, visibleEdges).map((edge) => {
                const src = nodeMap[edge.source];
                const tgt = nodeMap[edge.target];
                return (
                  <motion.g key={`${edge.source}-${edge.target}`}>
                    <motion.line
                      x1={src.cx}
                      y1={src.cy}
                      x2={tgt.cx}
                      y2={tgt.cy}
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth={1.5}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                    <text
                      x={(src.cx + tgt.cx) / 2}
                      y={(src.cy + tgt.cy) / 2 - 6}
                      fill="rgba(255,255,255,0.25)"
                      fontSize={7}
                      textAnchor="middle"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {edge.label}
                    </text>
                  </motion.g>
                );
              })}

              {/* Nodes */}
              {GRAPH_NODES.slice(0, visibleNodes).map((node) => (
                <motion.g
                  key={node.id}
                  initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                  style={{ originX: `${node.cx}px`, originY: `${node.cy}px` }}
                >
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r={node.r}
                    fill={node.color}
                    opacity={0.85}
                  />
                  <text
                    x={node.cx}
                    y={node.cy + node.r + 14}
                    fill="rgba(255,255,255,0.6)"
                    fontSize={9}
                    textAnchor="middle"
                    fontFamily="Inter, sans-serif"
                  >
                    {node.label}
                  </text>
                </motion.g>
              ))}
            </svg>
          </div>

          {/* Detail Panel */}
          <motion.div
            className={styles.detailPanel}
            initial={reducedMotion ? false : { opacity: 0, x: 20 }}
            animate={showDetail ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.detailTitle}>Decision Trace</div>

            <div className={styles.detailSection}>
              <div className={styles.detailLabel}>Cypher Query</div>
              <div className={styles.detailCode}>{CYPHER_QUERY}</div>
            </div>

            <div className={styles.detailSection}>
              <div className={styles.detailLabel}>Reasoning</div>
              <div className={styles.detailStep}>
                <span className={styles.stepNumber}>1</span>
                <span>Identify patients with diabetes condition</span>
              </div>
              <div className={styles.detailStep}>
                <span className={styles.stepNumber}>2</span>
                <span>Filter treatments within 30-day window</span>
              </div>
              <div className={styles.detailStep}>
                <span className={styles.stepNumber}>3</span>
                <span>Aggregate by treatment type and provider</span>
              </div>
            </div>
          </motion.div>
        </div>
      </BrowserFrame>
    </div>
  );
}
