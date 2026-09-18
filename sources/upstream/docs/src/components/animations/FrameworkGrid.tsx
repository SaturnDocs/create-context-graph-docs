import { motion, useReducedMotion } from "framer-motion";
import { FRAMEWORKS, SECTION_COPY } from "@site/src/data/animation-config";
import styles from "./FrameworkGrid.module.css";

export function FrameworkGrid() {
  const reducedMotion = useReducedMotion();

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <motion.h2
            className={styles.title}
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {SECTION_COPY.frameworks}
          </motion.h2>
          <p className={styles.subtitle}>
            PydanticAI, Claude Agent SDK, LangGraph, OpenAI Agents, and more
          </p>
        </div>

        <div className={styles.grid}>
          {FRAMEWORKS.map((fw, i) => (
            <motion.div
              key={fw.id}
              className={styles.card}
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <div className={styles.cardName}>{fw.displayName}</div>
              <div className={styles.badges}>
                {fw.streaming ? (
                  <span className={`${styles.badge} ${styles.badgeStreaming}`}>
                    Full Streaming
                  </span>
                ) : (
                  <span className={`${styles.badge} ${styles.badgeTools}`}>
                    Tool Events
                  </span>
                )}
              </div>
              <div className={styles.codeSnippet}>{fw.codeSnippet}</div>
            </motion.div>
          ))}
        </div>

        <p className={styles.badgeExplainer}>
          <strong>Full Streaming</strong> = token-by-token text + tool events &middot;{" "}
          <strong>Tool Events</strong> = real-time tool visualization with text at completion
        </p>
      </div>
    </section>
  );
}
