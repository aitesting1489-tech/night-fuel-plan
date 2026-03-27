/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Circadia'

interface ContactConfirmationProps {
  name?: string
}

const ContactConfirmationEmail = ({ name }: ContactConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Thanks for reaching out to {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>🌙 {SITE_NAME}</Text>
        <Heading style={h1}>
          {name ? `Thanks, ${name}!` : 'Thanks for reaching out!'}
        </Heading>
        <Text style={text}>
          We've received your message and will get back to you as soon as possible. We typically respond within 24 hours.
        </Text>
        <Text style={text}>
          In the meantime, feel free to explore your shift fuel plans and keep optimising your night shift routine.
        </Text>
        <Text style={footer}>
          Best regards,{'\n'}The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactConfirmationEmail,
  subject: 'Thanks for contacting Circadia',
  displayName: 'Contact confirmation',
  previewData: { name: 'Jane' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Nunito', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const brand = { fontSize: '14px', fontWeight: 'bold' as const, color: '#3db8a2', letterSpacing: '0.5px', margin: '0 0 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, fontFamily: "'Playfair Display', Georgia, serif", color: '#111827', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 24px', whiteSpace: 'pre-line' as const }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0', whiteSpace: 'pre-line' as const }
