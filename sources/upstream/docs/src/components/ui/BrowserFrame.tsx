import type { ReactNode } from "react";
import { motion } from "framer-motion";
import styles from "./BrowserFrame.module.css";

interface BrowserFrameProps {
  url?: string;
  layoutId?: string;
  children: ReactNode;
  className?: string;
}

export function BrowserFrame({
  url = "localhost:3000",
  layoutId,
  children,
  className,
}: BrowserFrameProps) {
  const Component = layoutId ? motion.div : "div";
  const containerProps = layoutId ? { layoutId } : {};

  return (
    <Component
      className={`${styles.browser} ${className || ""}`}
      {...containerProps}
    >
      <div className={styles.toolbar}>
        <div className={styles.dots}>
          <span className={`${styles.dot} ${styles.dotRed}`} />
          <span className={`${styles.dot} ${styles.dotYellow}`} />
          <span className={`${styles.dot} ${styles.dotGreen}`} />
        </div>
        <div className={styles.navButtons}>
          <span className={styles.navButton}>&larr;</span>
          <span className={styles.navButton}>&rarr;</span>
        </div>
        <div className={styles.addressBar}>
          <span className={styles.lockIcon}>&#x1F512;</span>
          <span className={styles.url}>{url}</span>
        </div>
      </div>
      <div className={styles.body}>{children}</div>
    </Component>
  );
}
