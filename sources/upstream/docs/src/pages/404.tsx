import React from 'react';
import Layout from '@theme/Layout';

export default function NotFound(): React.JSX.Element {
  return (
    <Layout title="Page Not Found">
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--ifm-color-emphasis-600)', maxWidth: '500px' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a
            href="/docs/intro"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              background: 'var(--ifm-color-primary)',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Introduction
          </a>
          <a
            href="/docs/quick-start"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--ifm-color-primary)',
              color: 'var(--ifm-color-primary)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Quick Start
          </a>
          <a
            href="https://github.com/neo4j-labs/create-context-graph/issues/new?title=Broken+link&body=I+found+a+broken+link+on+the+docs+site."
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--ifm-color-emphasis-300)',
              color: 'var(--ifm-color-emphasis-700)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Report Broken Link
          </a>
        </div>
      </main>
    </Layout>
  );
}
