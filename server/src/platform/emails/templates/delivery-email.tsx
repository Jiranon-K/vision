import { Body, Button, Container, Head, Html, Img, Link, Preview, Section, Text } from '@react-email/components';
import { CreatorBand, INK, LIME, MUTED, bodyStyle, buttonStyle, containerStyle } from './follower-email-parts';

interface Props {
  creatorName: string;
  byline?: string;
  title: string;
  excerpt: string;
  readTime: string;
  coverImage?: string;
  readUrl: string;
  stopUrl: string;
}

// A remote cover only: a data: URI is blocked by most mail clients and would
// bloat every copy of the email.
const isRemoteImage = (src?: string): src is string => !!src && /^https:\/\//.test(src);

export function DeliveryEmailTemplate({
  creatorName,
  byline,
  title,
  excerpt,
  readTime,
  coverImage,
  readUrl,
  stopUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{excerpt}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <CreatorBand creatorName={creatorName} byline={byline} />
          {isRemoteImage(coverImage) ? (
            <Img src={coverImage} alt="" width="600" style={{ display: 'block', width: '100%', height: 'auto' }} />
          ) : null}
          <Section style={{ padding: '28px' }}>
            <Text
              style={{
                backgroundColor: LIME,
                borderRadius: '999px',
                color: INK,
                display: 'inline-block',
                fontSize: '12px',
                fontWeight: 700,
                margin: '0 0 12px',
                padding: '2px 10px',
              }}
            >
              New Post · {readTime}
            </Text>
            <Text style={{ color: INK, fontSize: '26px', fontWeight: 800, lineHeight: '32px', margin: '0 0 12px' }}>
              {title}
            </Text>
            <Text style={{ color: '#3d3d46', fontSize: '16px', lineHeight: '25px', margin: '0 0 24px' }}>{excerpt}</Text>
            <Button href={readUrl} style={buttonStyle}>
              Read more
            </Button>
          </Section>
          <Section style={{ borderTop: '1px solid #e6e6e1', padding: '18px 28px' }}>
            <Text style={{ color: MUTED, fontSize: '12px', lineHeight: '18px', margin: 0, textAlign: 'center' }}>
              You follow {creatorName} on Vision.{' '}
              <Link href={stopUrl} style={{ color: MUTED, textDecoration: 'underline' }}>
                Stop following
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
