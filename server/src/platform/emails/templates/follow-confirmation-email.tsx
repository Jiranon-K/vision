import { Body, Button, Container, Head, Html, Preview, Section, Text } from '@react-email/components';
import { CreatorBand, INK, MUTED, bodyStyle, buttonStyle, containerStyle } from './follower-email-parts';

interface Props {
  creatorName: string;
  confirmUrl: string;
}

export function FollowConfirmationEmailTemplate({ creatorName, confirmUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Confirm you want {creatorName}&apos;s new Posts</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <CreatorBand creatorName={creatorName} />
          <Section style={{ padding: '28px' }}>
            <Text style={{ color: INK, fontSize: '20px', fontWeight: 700, lineHeight: '28px', margin: '0 0 20px' }}>
              Confirm you want {creatorName}&apos;s new Posts by email.
            </Text>
            <Button href={confirmUrl} style={buttonStyle}>
              Confirm follow
            </Button>
            <Text style={{ color: MUTED, fontSize: '13px', lineHeight: '20px', margin: '24px 0 0' }}>
              This link expires in 48 hours. If you didn&apos;t ask to follow, ignore this email and nothing happens.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
