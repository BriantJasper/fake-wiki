import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Atlas of Nowhere — an encyclopedia of things that don\'t exist';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Atlas of Nowhere';
const PAPER = '#f6f1e3';
const INK = '#1c1611';
const ACCENT = '#9a3a1a';
const RULE = '#d6cdb8';

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: PAPER,
          color: INK,
          fontFamily: 'serif',
          padding: 80,
        }}
      >
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 22,
            color: ACCENT,
            letterSpacing: 6,
            textTransform: 'uppercase',
            marginBottom: 36,
          }}
        >
          {SITE_NAME}
        </div>
        <div style={{ width: 80, height: 1, background: RULE, marginBottom: 36, display: 'flex' }} />
        <div
          style={{
            fontSize: 92,
            lineHeight: 1.05,
            letterSpacing: -2,
            fontWeight: 500,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span>An encyclopedia</span>
          <span>of things that</span>
          <span style={{ fontStyle: 'italic', color: ACCENT }}>do not exist.</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
