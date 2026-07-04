import { ImageResponse } from 'next/og';

export const alt = 'DemandGenius — Hotel & Event Service Marketplace India';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  const domain = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dplan-ebon.vercel.app').replace('https://', '');
  const features = ['🏨 Hotels', '🍽 Catering', '🚌 Transport', '🎉 Events', '✉ Email Outreach', '💬 WhatsApp API'];

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
        <p style={{ fontSize: '56px', fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-1px' }}>
          Hotel & Event Services,
        </p>
        <p style={{ fontSize: '56px', fontWeight: 900, color: '#38bdf8', lineHeight: 1.1, margin: '0 0 28px', letterSpacing: '-1px' }}>
          Managed in One Place.
        </p>
        <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.60)', margin: '0 0 44px', maxWidth: '700px' }}>
          Create inquiries · Send outreach via Email & WhatsApp · Track vendor responses in real time
        </p>

        {/* Pills */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {features.map(f => (
            <div key={f} style={{
              background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '100px', padding: '8px 18px',
              fontSize: '15px', color: '#e2e8f0', fontWeight: 700,
            }}>{f}</div>
          ))}
        </div>

        {/* Domain */}
        <div style={{ position: 'absolute', bottom: '40px', right: '70px', fontSize: '15px', color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>
          {domain}
        </div>
      </div>
    ),
    { ...size }
  );
}
