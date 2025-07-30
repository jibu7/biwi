import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // Fallback icon with ChannelZap branding
      <div
        style={{
          fontSize: 20,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontFamily: 'system-ui',
        }}
      >
        CZ
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}
