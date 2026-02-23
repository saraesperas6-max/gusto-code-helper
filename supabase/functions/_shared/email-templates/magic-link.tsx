/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link — Barangay Palma-Urbano</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://orkhzcxtutbzoggbvlrr.supabase.co/storage/v1/object/public/email-assets/logo.png?v=1"
          alt="Barangay Palma-Urbano"
          width="64"
          height="64"
          style={logo}
        />
        <Heading style={h1}>Your login link</Heading>
        <Text style={text}>
          Click the button below to log in to Barangay Palma-Urbano. This link
          will expire shortly.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Log In
        </Button>
        <Text style={footer}>
          If you didn't request this link, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Poppins', Arial, sans-serif" }
const container = { padding: '30px 25px' }
const logo = { borderRadius: '50%', marginBottom: '20px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#263047',
  margin: '0 0 20px',
  fontFamily: "'Poppins', Arial, sans-serif",
}
const text = {
  fontSize: '14px',
  color: '#616D80',
  lineHeight: '1.6',
  margin: '0 0 25px',
  fontFamily: "'Poppins', Arial, sans-serif",
}
const button = {
  backgroundColor: '#2563EB',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '12px 24px',
  textDecoration: 'none',
  fontFamily: "'Poppins', Arial, sans-serif",
}
const footer = {
  fontSize: '12px',
  color: '#616D80',
  margin: '30px 0 0',
  fontFamily: "'Poppins', Arial, sans-serif",
}
