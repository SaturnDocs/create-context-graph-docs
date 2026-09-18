import type { ReactNode } from "react";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import styles from "./Terminal.module.css";

interface TerminalProps {
  title?: string;
  layoutId?: string;
  children: ReactNode;
  maxWidth?: number;
  copyCommand?: string;
  className?: string;
  fixedHeight?: boolean;
}

export function Terminal({
  title = "create-context-graph",
  layoutId,
  children,
  maxWidth = 720,
  copyCommand,
  className,
  fixedHeight = false,
}: TerminalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!copyCommand) return;
    try {
      await navigator.clipboard.writeText(copyCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in some contexts
    }
  }, [copyCommand]);

  const Component = layoutId ? motion.div : "div";
  const containerProps = layoutId
    ? { layoutId, style: { maxWidth } }
    : { style: { maxWidth } };

  return (
    <Component
      className={`${styles.terminal} ${className || ""}`}
      {...containerProps}
    >
      <div className={styles.titleBar}>
        <div className={styles.dots}>
          <span className={`${styles.dot} ${styles.dotRed}`} />
          <span className={`${styles.dot} ${styles.dotYellow}`} />
          <span className={`${styles.dot} ${styles.dotGreen}`} />
        </div>
        {title && <span className={styles.titleText}>{title}</span>}
        {copyCommand && (
          <button
            className={`${styles.copyButton} ${copied ? styles.copied : ""}`}
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy command"}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>
      <div className={`${styles.body} ${fixedHeight ? styles.bodyFixedHeight : ""}`}>{children}</div>
    </Component>
  );
}
