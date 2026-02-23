/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code — Barangay Palma-Urbano</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://orkhzcxtutbzoggbvlrr.supabase.co/storage/v1/object/public/email-assets/logo.png?v=1"
          alt="Barangay Palma-Urbano"
          width="64"
          height="64"
          style={logo}
        />
        <Heading style={h1}>Confirm your identity</Heading>
        <Text style={text}>Use the code below to verify your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can
          safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#2563EB',
  letterSpacing: '4px',
  margin: '0 0 30px',
}
const footer = {
  fontSize: '12px',
  color: '#616D80',
  margin: '30px 0 0',
  fontFamily: "'Poppins', Arial, sans-serif",
}
