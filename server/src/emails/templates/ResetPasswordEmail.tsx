import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface ResetPasswordEmailProps {
  resetUrl: string;
  recipientName?: string;
}

export function ResetPasswordEmail({ resetUrl, recipientName }: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Vision password</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f6f9fc', padding: '20px' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '32px', maxWidth: '560px', margin: '0 auto', border: '3px solid #000' }}>
          <Heading style={{ color: '#111', fontSize: '24px', margin: '0 0 16px' }}>
            Reset your password
          </Heading>
          <Text style={{ color: '#444', fontSize: '16px' }}>
            Hi {recipientName || 'there'},
          </Text>
          <Text style={{ color: '#444', fontSize: '16px' }}>
            We received a request to reset the password for your Vision account.
            Click the button below to choose a new password.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button
              href={resetUrl}
              style={{
                backgroundColor: '#D4FF3F',
                color: '#000',
                padding: '12px 24px',
                borderRadius: '0',
                border: '3px solid #000',
                fontWeight: 'bold',
                textDecoration: 'none',
              }}
            >
              Reset password
            </Button>
          </Section>
          <Text style={{ color: '#666', fontSize: '14px' }}>
            Or paste this link into your browser:
            <br />
            <a href={resetUrl} style={{ color: '#0066cc' }}>{resetUrl}</a>
          </Text>
          <Text style={{ color: '#999', fontSize: '12px', marginTop: '32px' }}>
            This link expires in 1 hour. If you didn&apos;t request a password reset, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ResetPasswordEmail;
