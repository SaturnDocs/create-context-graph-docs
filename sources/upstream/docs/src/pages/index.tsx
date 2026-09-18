import type { ReactNode } from "react";
import { useState, lazy, Suspense } from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import { motion, AnimatePresence } from "framer-motion";

import { TerminalAnimation } from "@site/src/components/animations/TerminalAnimation";
import { HERO_COPY, SECTION_COPY } from "@site/src/data/animation-config";
import { Terminal } from "@site/src/components/ui/Terminal";

import styles from "./index.module.css";

// Lazy-load below-fold sections for performance
const AppPreview = lazy(() =>
  import("@site/src/components/animations/AppPreview").then((m) => ({
    default: m.AppPreview,
  }))
);
const ContextGraphExplainer = lazy(() =>
  import("@site/src/components/animations/ContextGraphExplainer").then((m) => ({
    default: m.ContextGraphExplainer,
  }))
);
const DomainCarousel = lazy(() =>
  import("@site/src/components/animations/DomainCarousel").then((m) => ({
    default: m.DomainCarousel,
  }))
);
const FrameworkGrid = lazy(() =>
  import("@site/src/components/animations/FrameworkGrid").then((m) => ({
    default: m.FrameworkGrid,
  }))
);
const HowItWorks = lazy(() =>
  import("@site/src/components/animations/HowItWorks").then((m) => ({
    default: m.HowItWorks,
  }))
);
const TrustBar = lazy(() =>
  import("@site/src/components/animations/TrustBar").then((m) => ({
    default: m.TrustBar,
  }))
);

function SectionPlaceholder({ height = "50vh" }: { height?: string }) {
  return <div style={{ minHeight: height }} />;
}

// --- Hero Section ---

function HeroSection(): ReactNode {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {HERO_COPY.headline}
        </motion.h1>

        <motion.p
          className={styles.tagline}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {HERO_COPY.subheadline}
        </motion.p>

        <motion.div
          className={styles.ctaRow}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link className={styles.ctaPrimary} to={HERO_COPY.ctaPrimaryHref}>
            {HERO_COPY.ctaPrimary}
          </Link>
          <Link
            className={styles.ctaSecondary}
            to={HERO_COPY.ctaSecondaryHref}
          >
            {HERO_COPY.ctaSecondary} &rarr;
          </Link>
        </motion.div>

        {/* Terminal / App Preview crossfade */}
        <div className={styles.heroAnimation}>
          <AnimatePresence mode="wait">
            {!showPreview ? (
              <motion.div
                key="terminal"
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
              >
                <TerminalAnimation
                  onComplete={() => setShowPreview(true)}
                />
              </motion.div>
            ) : (
              <Suspense
                fallback={<SectionPlaceholder height="400px" />}
              >
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <AppPreview />
                </motion.div>
              </Suspense>
            )}
          </AnimatePresence>
        </div>

        {showPreview && (
          <motion.p
            className={styles.previewLabel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {SECTION_COPY.appPreview}
          </motion.p>
        )}
      </div>
    </section>
  );
}

// --- Bottom CTA Section ---

function BottomCTA(): ReactNode {
  return (
    <section className={styles.bottomCta}>
      <div className={styles.bottomCtaInner}>
        <motion.h2
          className={styles.bottomCtaTitle}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {SECTION_COPY.bottomCta}
        </motion.h2>

        <Terminal
          title="create-context-graph"
          maxWidth={560}
          copyCommand="uvx create-context-graph"
        >
          <span style={{ color: "var(--color-terminal-purple)" }}>$ </span>
          <span style={{ color: "var(--color-terminal-green)" }}>
            uvx create-context-graph
          </span>
          <span className={styles.blinkingCursor} />
        </Terminal>

        <div className={styles.ctaRow}>
          <Link className={styles.ctaPrimary} to={HERO_COPY.ctaPrimaryHref}>
            {HERO_COPY.ctaPrimary}
          </Link>
          <Link
            className={styles.ctaSecondary}
            to={HERO_COPY.ctaSecondaryHref}
          >
            {HERO_COPY.ctaSecondary} &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

// --- Main Page ---

export default function Home(): ReactNode {
  return (
    <Layout
      title="AI agents with graph memory"
      description="Interactive CLI scaffolding tool that generates domain-specific context graph applications with Neo4j"
    >
      <HeroSection />

      <Suspense fallback={<SectionPlaceholder />}>
        <ContextGraphExplainer />
      </Suspense>

      <Suspense fallback={<SectionPlaceholder />}>
        <DomainCarousel />
      </Suspense>

      <Suspense fallback={<SectionPlaceholder />}>
        <FrameworkGrid />
      </Suspense>

      <Suspense fallback={<SectionPlaceholder />}>
        <HowItWorks />
      </Suspense>

      <Suspense fallback={<SectionPlaceholder height="100px" />}>
        <TrustBar />
      </Suspense>

      <BottomCTA />
    </Layout>
  );
}
