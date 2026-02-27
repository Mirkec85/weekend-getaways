import {
  Html,
  Head,
  Body,
  Preview,
  Container,
  Section,
  Row,
  Column,
  Img,
  Text,
  Heading,
  Hr,
  Link,
} from '@react-email/components'
import * as React from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

export interface DealCard {
  destinationName: string
  flightPriceEur: number
  departLabel: string       // e.g. "Fri 21 Feb"
  returnLabel: string       // e.g. "Sun 23 Feb"
  blurb: string             // from blurbs.json
  hotelEstimateEur: number  // from hotel-estimates or default 80
  observedLabel: string     // e.g. "Thu 19 Feb 08:12 CET"
  bookingUrl: string        // already has UTM params appended
  imageUrl?: string         // optional city photo URL
}

export interface WeeklyDealsProps {
  deals: DealCard[]
  weekLabel: string         // e.g. "Weekend of 21-23 Feb 2026"
  unsubscribeUrl?: string   // footer link
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function DealCardText({ deal }: { deal: DealCard }) {
  return (
    <>
      <Heading as="h2" style={h2Style}>
        {deal.destinationName}
      </Heading>
      <Text style={priceStyle}>
        Flight from EUR {deal.flightPriceEur}
      </Text>
      <Text style={metaStyle}>
        {deal.departLabel} {'->'} {deal.returnLabel}
      </Text>
      <Text style={blurbStyle}>{deal.blurb}</Text>
      <Text style={metaStyle}>
        Hotel est. ~EUR {deal.hotelEstimateEur}/night
      </Text>
      <Text style={observedStyle}>
        Observed: {deal.observedLabel}
      </Text>
      <Link href={deal.bookingUrl} style={ctaStyle}>
        Book now -&gt;
      </Link>
    </>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export default function WeeklyDeals({
  deals,
  weekLabel,
  unsubscribeUrl,
}: WeeklyDealsProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {`Weekend deals from Zagreb - from EUR ${deals[0]?.flightPriceEur ?? ''}`}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>

          {/* Header */}
          <Section>
            <Heading as="h1" style={h1Style}>
              Flajko ✈️
            </Heading>
            <Text style={subheadStyle}>{weekLabel}</Text>
          </Section>
          <Hr style={hrStyle} />

          {/* Deal cards */}
          {deals.map((deal, i) => (
            <Section key={i} style={cardStyle}>
              {deal.imageUrl ? (
                <Row>
                  <Column style={imageColStyle}>
                    <Img
                      src={deal.imageUrl}
                      width={180}
                      height={120}
                      alt={deal.destinationName}
                      style={imgStyle}
                    />
                  </Column>
                  <Column style={textColStyle}>
                    <DealCardText deal={deal} />
                  </Column>
                </Row>
              ) : (
                <Row>
                  <Column>
                    <DealCardText deal={deal} />
                  </Column>
                </Row>
              )}
            </Section>
          ))}

          {/* Footer */}
          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            You&apos;re receiving this because you subscribed to Flajko.
          </Text>
          {unsubscribeUrl ? (
            <Link href={unsubscribeUrl} style={unsubscribeStyle}>
              Unsubscribe
            </Link>
          ) : null}

        </Container>
      </Body>
    </Html>
  )
}

// ── Inline styles (no className — Gmail strips class-based CSS) ──────────────

const bodyStyle: React.CSSProperties = {
  backgroundColor: '#f6f9fc',
  fontFamily: 'sans-serif',
}

const containerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  padding: '24px',
}

const h1Style: React.CSSProperties = {
  fontSize: '24px',
  color: '#1a1a1a',
  margin: '0 0 8px 0',
}

const subheadStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#666666',
  margin: '0',
}

const hrStyle: React.CSSProperties = {
  borderColor: '#e0e0e0',
  margin: '24px 0',
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#f8f8f8',
  padding: '16px',
  borderRadius: '8px',
  marginBottom: '24px',
}

const imageColStyle: React.CSSProperties = {
  width: '180px',
  verticalAlign: 'top',
  paddingRight: '16px',
}

const imgStyle: React.CSSProperties = {
  borderRadius: '6px',
  display: 'block',
  objectFit: 'cover',
}

const textColStyle: React.CSSProperties = {
  verticalAlign: 'top',
}

const h2Style: React.CSSProperties = {
  fontSize: '20px',
  color: '#1a1a1a',
  margin: '0 0 8px 0',
}

const priceStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#0070f3',
  margin: '0 0 8px 0',
}

const metaStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#444444',
  margin: '0 0 4px 0',
}

const blurbStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#333333',
  margin: '8px 0',
}

const observedStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#999999',
  margin: '4px 0',
}

const ctaStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#0070f3',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 'bold',
}

const footerStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#999999',
  textAlign: 'center' as const,
}

const unsubscribeStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#999999',
  display: 'block',
  textAlign: 'center' as const,
}