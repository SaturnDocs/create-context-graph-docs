import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import { useState } from "react";
import {
  HOW_IT_WORKS_STEPS,
  SECTION_COPY,
} from "@site/src/data/animation-config";
import styles from "./HowItWorks.module.css";

export function HowItWorks() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Progress line fills as the section scrolls into view
  const lineScale = useTransform(scrollYProgress, [0.1, 0.6], [0, 1]);

  // Track which steps are active based on scroll
  const [activeStep, setActiveStep] = useState(reducedMotion ? 3 : -1);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (reducedMotion) return;
    if (latest > 0.5) setActiveStep(3);
    else if (latest > 0.4) setActiveStep(2);
    else if (latest > 0.3) setActiveStep(1);
    else if (latest > 0.2) setActiveStep(0);
    else setActiveStep(-1);
  });

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <motion.h2
            className={styles.title}
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {SECTION_COPY.howItWorks}
          </motion.h2>
          <p className={styles.subtitle}>
            Scaffold, install, seed, and start
          </p>
        </div>

        <div className={styles.timeline}>
          {/* Connecting progress line */}
          <div className={styles.timelineLine}>
            <motion.div
              className={styles.progressLine}
              style={{
                scaleX: reducedMotion ? 1 : lineScale,
              }}
            />
          </div>

          {HOW_IT_WORKS_STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              className={styles.step}
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div
                className={`${styles.stepNumber} ${
                  activeStep >= i ? styles.stepNumberActive : ""
                }`}
              >
                {i + 1}
              </div>
              <div className={styles.stepTitle}>{step.title}</div>
              <div className={styles.stepTerminal}>$ {step.command}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
