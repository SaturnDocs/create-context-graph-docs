import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DOMAINS } from "@site/src/data/animation-config";
import { SECTION_COPY } from "@site/src/data/animation-config";
import styles from "./DomainCarousel.module.css";

export function DomainCarousel() {
  const reducedMotion = useReducedMotion();
  const constraintsRef = useRef<HTMLDivElement>(null);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <motion.h2
          className={styles.title}
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {SECTION_COPY.domains}
        </motion.h2>
        <p className={styles.subtitle}>
          Each domain includes a complete ontology, demo data, agent tools, and
          graph schema
        </p>
      </div>

      <div className={styles.trackContainer}>
        <div ref={constraintsRef} style={{ overflow: "hidden" }}>
          <motion.div
            className={styles.track}
            drag={reducedMotion ? false : "x"}
            dragConstraints={constraintsRef}
            dragElastic={0.1}
          >
            {DOMAINS.map((domain, i) => (
              <motion.div
                key={domain.id}
                className={styles.cardWrapper}
                initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}
              >
                <div className={styles.card} tabIndex={0} role="button" aria-label={`${domain.name} domain`}>
                  {/* Front face */}
                  <div className={`${styles.cardFace} ${styles.cardFront}`}>
                    <span className={styles.cardEmoji}>{domain.emoji}</span>
                    <div className={styles.cardName}>{domain.name}</div>
                    <div className={styles.entityPills}>
                      {domain.entityTypes.slice(0, 4).map((et) => (
                        <span key={et} className={styles.entityPill}>
                          {et}
                        </span>
                      ))}
                    </div>
                    <div className={styles.cardCommand}>
                      --domain {domain.id}
                    </div>
                  </div>

                  {/* Back face */}
                  <div className={`${styles.cardFace} ${styles.cardBack}`}>
                    <div className={styles.backTitle}>
                      {domain.emoji} {domain.name}
                    </div>
                    <div className={styles.backLabel}>Entity Types</div>
                    <div className={styles.backEntityList}>
                      {domain.entityTypes.map((et) => (
                        <span key={et}>
                          :{et}
                        </span>
                      ))}
                      <span style={{ opacity: 0.4 }}>+ base POLE+O types</span>
                    </div>
                    <div className={styles.cardCommand}>
                      uvx create-context-graph --domain {domain.id}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
        <div className={styles.trackFade} />
      </div>
      <div className={styles.dragHint}>Drag to explore &middot; Hover to flip</div>
      <a href="/docs/reference/domain-catalog" className={styles.catalogLink}>
        See all 23 domains &rarr;
      </a>
    </section>
  );
}
