/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Circadia'
const SITE_URL = 'https://circadiaapp.com'

interface WelcomeEmailProps {
  displayName?: string
}

const WelcomeEmail = ({ displayName }: WelcomeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} — your night shift fuel plan awaits</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>🌙 {SITE_NAME}</Text>
        <Heading style={h1}>
          {displayName ? `Welcome aboard, ${displayName}!` : 'Welcome aboard!'}
        </Heading>
        <Text style={text}>
          You're all set to start optimising your nutrition, hydration, and energy for night shifts. Here's what you can do:
        </Text>
        <Text style={text}>
          ☕ Generate a personalised shift fuel plan{'\n'}
          💧 Track your hydration and energy levels{'\n'}
          🥗 Choose from multiple diet preferences
        </Text>
        <Button style={button} href={SITE_URL}>
          Plan your first shift
        </Button>
        <Text style={footer}>
          If you have any questions, just reply to this email. We're here to help.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to Circadia 🌙',
  displayName: 'Welcome email',
  previewData: { displayName: 'Jane' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Nunito', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const brand = { fontSize: '14px', fontWeight: 'bold' as const, color: '#3db8a2', letterSpacing: '0.5px', margin: '0 0 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, fontFamily: "'Playfair Display', Georgia, serif", color: '#111827', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 24px', whiteSpace: 'pre-line' as const }
const button = { backgroundColor: '#3db8a2', color: '#0a0e1a', fontSize: '14px', fontWeight: 'bold' as const, borderRadius: '16px', padding: '14px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0' }
