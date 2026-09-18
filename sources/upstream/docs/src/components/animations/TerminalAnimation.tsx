import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Terminal } from "@site/src/components/ui/Terminal";
import {
  WIZARD_COMMAND,
  WIZARD_DOMAINS_SCROLL,
  WIZARD_FRAMEWORKS_SCROLL,
  SCAFFOLD_FILES,
  TIMING,
} from "@site/src/data/animation-config";
import styles from "./TerminalAnimation.module.css";

type Phase = "typing" | "wizard" | "scaffolding" | "success";
type WizardStep = "datasource" | "domain" | "framework" | "confirm";

const SPINNER_CHARS = ["\u25DC", "\u25DD", "\u25DE", "\u25DF"];

interface TerminalAnimationProps {
  onComplete?: () => void;
}

export function TerminalAnimation({
  onComplete,
}: TerminalAnimationProps) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(
    reducedMotion ? "success" : "typing"
  );
  const [charIndex, setCharIndex] = useState(0);
  const [wizardStep, setWizardStep] = useState<WizardStep>("datasource");
  const [domainScrollIndex, setDomainScrollIndex] = useState(0);
  const [frameworkScrollIndex, setFrameworkScrollIndex] = useState(0);
  const [scaffoldIndex, setScaffoldIndex] = useState(0);
  const [spinnerIndex, setSpinnerIndex] = useState(0);
  const [progressLabel, setProgressLabel] = useState("Generating ontology...");
  const [showConfirmYes, setShowConfirmYes] = useState(false);
  const completedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const addTimer = useCallback(
    (fn: () => void, delay: number) => {
      const id = setTimeout(fn, delay);
      timersRef.current.push(id);
      return id;
    },
    []
  );

  const skipToEnd = useCallback(() => {
    clearTimers();
    setPhase("success");
  }, [clearTimers]);

  // Notify parent on success
  useEffect(() => {
    if (phase === "success" && !completedRef.current) {
      completedRef.current = true;
      const id = setTimeout(() => onComplete?.(), TIMING.phase4.duration * 1000);
      return () => clearTimeout(id);
    }
  }, [phase, onComplete]);

  // Phase 1: Typing
  useEffect(() => {
    if (phase !== "typing") return;
    if (charIndex < WIZARD_COMMAND.length) {
      const id = addTimer(
        () => setCharIndex((i) => i + 1),
        TIMING.phase1.charDelay * 1000
      );
      return () => clearTimeout(id);
    }
    // Typing done, pause then move to wizard
    const id = addTimer(() => setPhase("wizard"), 400);
    return () => clearTimeout(id);
  }, [phase, charIndex, addTimer]);

  // Phase 2: Wizard flow
  useEffect(() => {
    if (phase !== "wizard") return;

    const delays: { fn: () => void; delay: number }[] = [];
    let cumulative = 600; // initial delay after phase transition

    // Step: datasource -> auto-select after brief pause
    delays.push({
      fn: () => setWizardStep("domain"),
      delay: (cumulative += 1200),
    });

    // Step: domain scrolling
    WIZARD_DOMAINS_SCROLL.forEach((_, i) => {
      delays.push({
        fn: () => setDomainScrollIndex(i),
        delay: (cumulative += 350),
      });
    });
    delays.push({
      fn: () => setWizardStep("framework"),
      delay: (cumulative += 800),
    });

    // Step: framework scrolling
    WIZARD_FRAMEWORKS_SCROLL.forEach((_, i) => {
      delays.push({
        fn: () => setFrameworkScrollIndex(i),
        delay: (cumulative += 350),
      });
    });
    delays.push({
      fn: () => setWizardStep("confirm"),
      delay: (cumulative += 800),
    });

    // Confirm: show "Yes" then move to scaffolding
    delays.push({
      fn: () => setShowConfirmYes(true),
      delay: (cumulative += 1000),
    });
    delays.push({
      fn: () => setPhase("scaffolding"),
      delay: (cumulative += 600),
    });

    const ids = delays.map((d) => addTimer(d.fn, d.delay));
    return () => ids.forEach(clearTimeout);
  }, [phase, addTimer]);

  // Phase 3: Scaffolding
  useEffect(() => {
    if (phase !== "scaffolding") return;

    // Spinner animation
    const spinInterval = setInterval(
      () => setSpinnerIndex((i) => (i + 1) % SPINNER_CHARS.length),
      200
    );

    // File lines appearing one by one
    const fileTimers = SCAFFOLD_FILES.map((_, i) =>
      addTimer(() => setScaffoldIndex(i + 1), (i + 1) * 180)
    );

    // Progress labels
    const totalFiles = SCAFFOLD_FILES.length;
    addTimer(
      () => setProgressLabel("Scaffolding backend..."),
      (totalFiles * 0.3) * 180
    );
    addTimer(
      () => setProgressLabel("Building frontend..."),
      (totalFiles * 0.6) * 180
    );
    addTimer(
      () => setProgressLabel("Writing configuration..."),
      (totalFiles * 0.85) * 180
    );

    // Done
    addTimer(() => {
      clearInterval(spinInterval);
      setPhase("success");
    }, (totalFiles + 3) * 180);

    return () => {
      clearInterval(spinInterval);
      fileTimers.forEach(clearTimeout);
    };
  }, [phase, addTimer]);

  // Cleanup on unmount
  useEffect(() => clearTimers, [clearTimers]);

  return (
    <div className={styles.wrapper} style={{ position: "relative" }}>
      <Terminal
        title="create-context-graph"
        fixedHeight
        aria-label="Animated terminal simulation showing the create-context-graph CLI wizard scaffolding a healthcare app with the PydanticAI framework"
      >
        <div style={{ position: "relative" }}>
          {/* Phase 1: Command typing */}
          <div className={styles.line}>
            <span className={styles.prompt}>$ </span>
            <span className={styles.command}>
              {phase === "typing"
                ? WIZARD_COMMAND.slice(0, charIndex)
                : WIZARD_COMMAND}
            </span>
            {phase === "typing" && <span className={styles.cursor} />}
          </div>

          {/* Phase 2+: Banner */}
          <AnimatePresence>
            {phase !== "typing" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.banner}>
                  Create Context Graph <span className={styles.version}>v0.6.0</span>
                </div>
                <WizardContent
                  step={wizardStep}
                  phase={phase}
                  domainScrollIndex={domainScrollIndex}
                  frameworkScrollIndex={frameworkScrollIndex}
                  showConfirmYes={showConfirmYes}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 3: Scaffolding */}
          <AnimatePresence>
            {phase === "scaffolding" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <br />
                <div>
                  <span className={styles.spinner}>
                    {SPINNER_CHARS[spinnerIndex]}
                  </span>{" "}
                  <span className={styles.progressLabel}>{progressLabel}</span>
                </div>
                <br />
                {SCAFFOLD_FILES.slice(0, scaffoldIndex).map((file, i) => (
                  <motion.div
                    key={file}
                    className={styles.scaffoldLine}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <span className={styles.checkmark}>&#10003;</span>
                    <span className={styles.filePath}>{file}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 4: Success */}
          <AnimatePresence>
            {phase === "success" && (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <br />
                <div className={styles.success}>
                  &#10003; Healthcare Context Graph is ready!
                </div>
                <br />
                <div className={styles.urlLine}>
                  {"  "}Frontend:{" "}
                  <span className={styles.urlValue}>
                    http://localhost:3000
                  </span>
                </div>
                <div className={styles.urlLine}>
                  {"  "}Backend:{"  "}
                  <span className={styles.urlValue}>
                    http://localhost:8000
                  </span>
                </div>
                <br />
                <div className={styles.line}>
                  <span className={styles.prompt}>$ </span>
                  <span className={styles.command}>cd my-healthcare-app && make start</span>
                  <span className={styles.cursor} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skip button */}
          {phase !== "success" && !reducedMotion && (
            <button
              className={styles.skipButton}
              onClick={skipToEnd}
              aria-label="Skip animation"
            >
              Skip &#8594;
            </button>
          )}
        </div>
      </Terminal>
    </div>
  );
}

// --- Wizard sub-component ---

function WizardContent({
  step,
  phase,
  domainScrollIndex,
  frameworkScrollIndex,
  showConfirmYes,
}: {
  step: WizardStep;
  phase: Phase;
  domainScrollIndex: number;
  frameworkScrollIndex: number;
  showConfirmYes: boolean;
}) {
  if (phase === "scaffolding" || phase === "success") {
    // Show completed wizard summary
    return (
      <div>
        <div>
          <span className={styles.wizardCheck}>&#10003;</span>
          <span className={styles.wizardLabel}>Data source: </span>
          <span className={styles.wizardOptionActive}>Demo data</span>
        </div>
        <div>
          <span className={styles.wizardCheck}>&#10003;</span>
          <span className={styles.wizardLabel}>Domain: </span>
          <span className={styles.wizardOptionActive}>healthcare</span>
        </div>
        <div>
          <span className={styles.wizardCheck}>&#10003;</span>
          <span className={styles.wizardLabel}>Framework: </span>
          <span className={styles.wizardOptionActive}>PydanticAI</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Data source — always shown as completed */}
      <div>
        <span className={styles.wizardCheck}>&#10003;</span>
        <span className={styles.wizardLabel}>Data source: </span>
        <span className={styles.wizardOptionActive}>Demo data (recommended)</span>
      </div>

      {/* Domain selection */}
      {(step === "domain" || step === "framework" || step === "confirm") && (
        <div>
          {step === "domain" ? (
            <>
              <span className={styles.wizardLabel}>
                ? Select a domain:{" "}
              </span>
              <div style={{ overflow: "hidden", height: "1.6em" }}>
                <motion.div
                  animate={{ y: -domainScrollIndex * 1.6 + "em" }}
                  transition={{ duration: 0.15 }}
                >
                  {WIZARD_DOMAINS_SCROLL.map((d, i) => (
                    <div
                      key={d}
                      className={
                        i === domainScrollIndex
                          ? styles.wizardOptionActive
                          : styles.wizardOption
                      }
                    >
                      {i === domainScrollIndex ? "\u276F " : "  "}
                      {d}
                    </div>
                  ))}
                </motion.div>
              </div>
            </>
          ) : (
            <div>
              <span className={styles.wizardCheck}>&#10003;</span>
              <span className={styles.wizardLabel}>Domain: </span>
              <span className={styles.wizardOptionActive}>healthcare</span>
            </div>
          )}
        </div>
      )}

      {/* Framework selection */}
      {(step === "framework" || step === "confirm") && (
        <div>
          {step === "framework" ? (
            <>
              <span className={styles.wizardLabel}>
                ? Select a framework:{" "}
              </span>
              <div style={{ overflow: "hidden", height: "1.6em" }}>
                <motion.div
                  animate={{ y: -frameworkScrollIndex * 1.6 + "em" }}
                  transition={{ duration: 0.15 }}
                >
                  {WIZARD_FRAMEWORKS_SCROLL.map((f, i) => (
                    <div
                      key={f}
                      className={
                        i === frameworkScrollIndex
                          ? styles.wizardOptionActive
                          : styles.wizardOption
                      }
                    >
                      {i === frameworkScrollIndex ? "\u276F " : "  "}
                      {f}
                    </div>
                  ))}
                </motion.div>
              </div>
            </>
          ) : (
            <div>
              <span className={styles.wizardCheck}>&#10003;</span>
              <span className={styles.wizardLabel}>Framework: </span>
              <span className={styles.wizardOptionActive}>PydanticAI</span>
            </div>
          )}
        </div>
      )}

      {/* Confirmation */}
      {step === "confirm" && (
        <div>
          <br />
          <div className={styles.summaryRow}>
            <span className={styles.summaryKey}>Project:</span>
            <span className={styles.summaryValue}>my-healthcare-app</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryKey}>Domain:</span>
            <span className={styles.summaryValue}>healthcare</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryKey}>Framework:</span>
            <span className={styles.summaryValue}>PydanticAI</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryKey}>Data:</span>
            <span className={styles.summaryValue}>Demo data</span>
          </div>
          <br />
          <span className={styles.wizardLabel}>? Generate project? </span>
          {showConfirmYes ? (
            <span className={styles.wizardOptionActive}>Yes</span>
          ) : (
            <span className={styles.cursor} />
          )}
        </div>
      )}
    </div>
  );
}
