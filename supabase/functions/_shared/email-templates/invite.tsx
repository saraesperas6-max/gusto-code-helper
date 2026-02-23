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
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to Barangay Palma-Urbano</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://orkhzcxtutbzoggbvlrr.supabase.co/storage/v1/object/public/email-assets/logo.png?v=1"
          alt="Barangay Palma-Urbano"
          width="64"
          height="64"
          style={logo}
        />
        <Heading style={h1}>You've been invited</Heading>
        <Text style={text}>
          You've been invited to join{' '}
          <Link href={siteUrl} style={link}>
            <strong>Barangay Palma-Urbano</strong>
          </Link>
          . Click the button below to accept and create your account.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accept Invitation
        </Button>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this
          email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
const link = { color: '#2563EB', textDecoration: 'underline' }
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
