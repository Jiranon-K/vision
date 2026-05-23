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
import * as React from 'react';

interface VerifyEmailProps {
  verifyUrl: string;
  recipientName?: string;
}

export function VerifyEmail({ verifyUrl, recipientName }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your Vision email</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f6f9fc', padding: '20px' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '32px', maxWidth: '560px', margin: '0 auto', border: '3px solid #000' }}>
          <Heading style={{ color: '#111', fontSize: '24px', margin: '0 0 16px' }}>
            Confirm your email
          </Heading>
          <Text style={{ color: '#444', fontSize: '16px' }}>
            Hi {recipientName || 'there'},
          </Text>
          <Text style={{ color: '#444', fontSize: '16px' }}>
            Welcome to Vision! Please confirm your email address by clicking the button below.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button
              href={verifyUrl}
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
              Verify email
            </Button>
          </Section>
          <Text style={{ color: '#666', fontSize: '14px' }}>
            Or paste this link into your browser:
            <br />
            <a href={verifyUrl} style={{ color: '#0066cc' }}>{verifyUrl}</a>
          </Text>
          <Text style={{ color: '#999', fontSize: '12px', marginTop: '32px' }}>
            This link expires in 24 hours.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default VerifyEmail;
