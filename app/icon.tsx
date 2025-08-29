import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Stylized "A" - Large right shape */}
        <div
          style={{
            position: 'absolute',
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
            borderRadius: '50% 50% 0 50%',
            transform: 'rotate(45deg)',
            left: '8px',
            top: '4px',
          }}
        />
        
        {/* Stylized "A" - Smaller left shape */}
        <div
          style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
            borderRadius: '50% 50% 0 50%',
            transform: 'rotate(45deg)',
            left: '4px',
            top: '12px',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
