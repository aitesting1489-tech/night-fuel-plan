/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {siteName} — confirm your email to get started</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>🌙 {siteName}</Text>
        <Heading style={h1}>Welcome aboard</Heading>
        <Text style={text}>
          Thanks for joining{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          ! We're excited to help you fuel your night shifts with gentle nourishment.
        </Text>
        <Text style={text}>
          Confirm your email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) to get started:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verify Email
        </Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Nunito', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const brand = { fontSize: '14px', fontWeight: 'bold' as const, color: '#3db8a2', letterSpacing: '0.5px', margin: '0 0 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, fontFamily: "'Playfair Display', Georgia, serif", color: '#111827', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 24px' }
const link = { color: '#3db8a2', textDecoration: 'underline' }
const button = { backgroundColor: '#3db8a2', color: '#0a0e1a', fontSize: '14px', fontWeight: 'bold' as const, borderRadius: '16px', padding: '14px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0' }
