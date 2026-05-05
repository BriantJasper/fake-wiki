import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#f6f1e8',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', gap: 18 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                background: '#b34121',
              }}
            />
          ))}
        </div>
        <div
          style={{
            fontSize: 22,
            color: '#2a2520',
            letterSpacing: 1,
            display: 'flex',
          }}
        >
          Atlas
        </div>
      </div>
    ),
    { ...size },
  );
}
