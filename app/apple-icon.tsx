import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 80,
          background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontFamily: 'system-ui, sans-serif',
          borderRadius: '20px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: '60px', marginBottom: '-10px' }}>🎓</div>
          <div style={{ fontSize: '32px', fontWeight: '900' }}>E</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
