import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'DemandGenius — Hotel & Event Service Marketplace India';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0c4a6e 100%)',
          display: 'flex', flexDirection: 'column',
          padding: '60px 70px', fontFamily: 'sans-serif', position: 'relative',
        }}
      >
        {/* Grid dots background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(14,165,233,0.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}/>

        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26px',
          }}>⚡</div>
          <span style={{ fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
            DemandGenius
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <p style={{
            fontSize: '58px', fontWeight: 900, color: '#fff',
            lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-1px',
          }}>
            Hotel & Event Services,
          </p>
          <p style={{
            fontSize: '58px', fontWeight: 900, lineHeight: 1.1,
            margin: '0 0 32px', letterSpacing: '-1px',
            background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
            backgroundClip: 'text', color: 'transparent',
          }}>
            Managed in One Place.
          </p>
          <p style={{ fontSize: '22px', color: 'rgba(255,255,255,0.65)', margin: '0 0 48px', maxWidth: '680px' }}>
            Create inquiries · Send outreach via Email & WhatsApp · Track vendor responses in real time
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {['🏨 Hotels', '🍽 Catering', '🚌 Transport', '🎉 Events', '✉ Email Outreach', '💬 WhatsApp API', '📊 Thread Tracking'].map(f => (
              <div key={f} style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '100px', padding: '8px 18px',
                fontSize: '16px', color: '#e2e8f0', fontWeight: 700,
              }}>{f}</div>
            ))}
          </div>
        </div>

        {/* Bottom domain bar */}
        <div style={{
          position: 'absolute', bottom: '40px', right: '70px',
          fontSize: '16px', color: 'rgba(255,255,255,0.4)', fontWeight: 700,
        }}>
          {process.env.NEXT_PUBLIC_SITE_URL?.replace('https://', '') || 'dplan-ebon.vercel.app'}
        </div>
      </div>
    ),
    { ...size }
  );
}
