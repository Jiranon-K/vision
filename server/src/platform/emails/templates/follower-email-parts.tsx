import { Section, Text } from '@react-email/components';

// The Bold design chosen for Follower email (Jiranon-K/vision#29): a dark band
// that carries the Creator, then the content, then a lime button with a hard
// edge. Inline styles only, because mail clients ignore stylesheets.

export const INK = '#191a23';
export const LIME = '#b9ff66';
export const MUTED = '#6b6b76';

export const bodyStyle = {
  backgroundColor: '#f4f4f1',
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  margin: 0,
  padding: '24px 12px',
};

export const containerStyle = {
  backgroundColor: '#ffffff',
  border: `2px solid ${INK}`,
  borderRadius: '16px',
  maxWidth: '600px',
  margin: '0 auto',
  overflow: 'hidden' as const,
};

export const buttonStyle = {
  backgroundColor: LIME,
  border: `2px solid ${INK}`,
  borderRadius: '12px',
  boxShadow: `4px 4px 0 ${INK}`,
  color: INK,
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 700,
  padding: '14px 28px',
  textDecoration: 'none',
};

export function CreatorBand({ creatorName, byline }: { creatorName: string; byline?: string }) {
  return (
    <Section style={{ backgroundColor: INK, padding: '20px 28px' }}>
      <Text style={{ color: '#ffffff', fontSize: '18px', fontWeight: 800, margin: 0 }}>
        {creatorName} <span style={{ color: LIME }}>via Vision</span>
      </Text>
      {byline ? (
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '4px 0 0' }}>{byline}</Text>
      ) : null}
    </Section>
  );
}
