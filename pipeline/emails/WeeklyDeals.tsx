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
  Link,
} from '@react-email/components'
import * as React from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

export interface DealCard {
  destinationName: string
  flightPriceEur: number
  departLabel: string       // e.g. "Fri 21 Mar"
  returnLabel: string       // e.g. "Sun 23 Mar"
  blurb: string
  hotelEstimateEur: number
  observedLabel: string     // e.g. "Thu 19 Mar 08:12 CET"
  bookingUrl: string
  imageUrl?: string
}

export interface WeeklyDealsProps {
  deals: DealCard[]
  weekLabel: string
  unsubscribeUrl?: string
  logoUrl?: string
}

// ── Deal card ────────────────────────────────────────────────────────────────

function DealCardRow({ deal }: { deal: DealCard }) {
  const imgSrc = deal.imageUrl ?? 'https://placehold.co/360/240'

  return (
    <Section style={dealCardStyle}>
      <Row>
        {/* Left / Top (mobile): city image */}
        <Column
          className="deal-img-col"
          style={{ width: '187px', verticalAlign: 'top' }}
        >
          <Img
            src={imgSrc}
            width={187}
            height={194}
            alt={deal.destinationName}
            className="deal-img"
            style={dealImgStyle}
          />
        </Column>

        {/* Right / Bottom (mobile): content */}
        <Column
          className="deal-content-col"
          style={{ paddingLeft: '20px', verticalAlign: 'top' }}
        >
          {/* City name + price */}
          <Section>
            <Row>
              <Column style={{ verticalAlign: 'top' }}>
                <Text style={cityNameStyle}>{deal.destinationName}</Text>
              </Column>
              <Column style={{ textAlign: 'right', verticalAlign: 'top' }}>
                <Text style={priceStyle}>from €{deal.flightPriceEur}</Text>
              </Column>
            </Row>
          </Section>

          {/* Blurb */}
          <Text style={blurbStyle}>{deal.blurb}</Text>

          {/* Meta rows */}
          <Section style={{ paddingTop: '12px' }}>
            <Row>
              <Column>
                <Text style={metaStyle}>✈ {deal.departLabel} → {deal.returnLabel}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={metaStyle}>🛏 Est. €{deal.hotelEstimateEur}/night</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={metaStyle}>🕐 Observed: {deal.observedLabel}</Text>
              </Column>
            </Row>
          </Section>

          {/* Book Now */}
          <Section style={{ marginTop: '16px' }}>
            <Row>
              <Column>
                <Link href={deal.bookingUrl} style={bookBtnStyle}>
                  Book Now →
                </Link>
              </Column>
            </Row>
          </Section>
        </Column>
      </Row>
    </Section>
  )
}

// ── Email ────────────────────────────────────────────────────────────────────

export default function WeeklyDeals({
  deals,
  weekLabel,
  unsubscribeUrl,
  logoUrl,
}: WeeklyDealsProps) {
  return (
    <Html>
      <Head>
        <style>{`
          @media only screen and (max-width: 600px) {
            /* Header: stack logo above date */
            td.hdr-logo-col,
            td.hdr-date-col {
              display: block !important;
              width: 100% !important;
            }
            td.hdr-date-col p {
              text-align: left !important;
              padding-top: 4px !important;
            }

            /* Deal card: stack image on top, content below */
            td.deal-img-col,
            td.deal-content-col {
              display: block !important;
              width: 100% !important;
            }
            td.deal-content-col {
              padding-left: 0 !important;
              padding-top: 12px !important;
            }
            img.deal-img {
              width: 100% !important;
              height: 200px !important;
              max-width: 100% !important;
            }
          }
        `}</style>
      </Head>
      <Preview>
        {`Weekend deals · from €${deals[0]?.flightPriceEur ?? ''}`}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>

          {/* ── Header ── */}
          <Section style={headerStyle}>
            <Row>
              <Column className="hdr-logo-col">
                {logoUrl
                  ? <Img src={logoUrl} width={100} height={30} alt="Flajko" style={{ display: 'block' }} />
                  : <Text style={logoTextStyle}>Flajko ✈</Text>}
              </Column>
              <Column className="hdr-date-col" align="right">
                <Text style={weekLabelStyle}>{weekLabel}</Text>
              </Column>
            </Row>
          </Section>

          {/* ── Body card ── */}
          <Section style={bodyCardStyle}>
            <Row>
              <Column>
                <Text style={titleStyle}>Pick your flight and enjoy the trip!</Text>
              </Column>
            </Row>

            {deals.map((deal, i) => (
              <React.Fragment key={i}>
                <Row>
                  <Column>
                    <DealCardRow deal={deal} />
                  </Column>
                </Row>
                {i < deals.length - 1
                  ? <Row><Column style={spacerStyle}>&nbsp;</Column></Row>
                  : null}
              </React.Fragment>
            ))}
          </Section>

          {/* ── Footer ── */}
          <Section style={footerStyle}>
            <Row>
              <Column>
                <Text style={footerTextStyle}>
                  If you&apos;d rather not receive this kind of email, you can{' '}
                  {unsubscribeUrl
                    ? <Link href={unsubscribeUrl} style={unsubLinkStyle}>unsubscribe</Link>
                    : 'unsubscribe'}{' '}
                  anytime.
                </Text>
              </Column>
            </Row>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const bodyStyle: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  fontFamily: "'Inter', -apple-system, sans-serif",
  margin: 0,
  padding: 0,
}

const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
}

const headerStyle: React.CSSProperties = {
  paddingLeft: '32px',
  paddingRight: '32px',
  paddingTop: '24px',
  paddingBottom: '24px',
}

const logoTextStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#0284c7',
  margin: 0,
}

const weekLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
  margin: 0,
  lineHeight: '16px',
  textAlign: 'right' as const,
}

const bodyCardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderTopLeftRadius: '16px',
  borderTopRightRadius: '16px',
  padding: '32px',
}

const titleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#333333',
  margin: '0 0 24px 0',
  lineHeight: '32px',
}

const spacerStyle: React.CSSProperties = {
  height: '24px',
  fontSize: '0',
  lineHeight: '0',
}

// Deal card
const dealCardStyle: React.CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: '16px',
  padding: '17px',
  backgroundColor: '#ffffff',
}

const dealImgStyle: React.CSSProperties = {
  borderRadius: '8px',
  display: 'block',
  objectFit: 'cover',
}

const cityNameStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#1f2937',
  margin: 0,
  lineHeight: '24px',
}

const priceStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#0284c7',
  margin: 0,
  lineHeight: '28px',
  textAlign: 'right' as const,
}

const blurbStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '4px 0 0 0',
  lineHeight: '16px',
}

const metaStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0 0 8px 0',
  lineHeight: '16px',
}

const bookBtnStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#0284c7',
  color: '#ffffff',
  padding: '8px 12px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '12px',
  fontWeight: '600',
  lineHeight: '1.5',
}

// Footer
const footerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderBottomLeftRadius: '16px',
  borderBottomRightRadius: '16px',
  padding: '32px',
}

const footerTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#6b7280',
  lineHeight: '20px',
  margin: 0,
}

const unsubLinkStyle: React.CSSProperties = {
  color: '#0284c7',
  textDecoration: 'underline',
}
