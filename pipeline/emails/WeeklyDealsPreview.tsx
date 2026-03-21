import * as React from 'react'
import WeeklyDeals from './WeeklyDeals'
import type { DealCard } from './WeeklyDeals'

const sampleDeals: DealCard[] = [
  {
    destinationName: 'Rome',
    flightPriceEur: 89,
    departLabel: 'Fri 21 Mar',
    returnLabel: 'Sun 23 Mar',
    blurb: 'Ancient ruins, Renaissance art, and the world\'s best pasta just steps from every corner.',
    hotelEstimateEur: 110,
    observedLabel: 'Thu 19 Mar 07:42 CET',
    bookingUrl: 'https://www.kiwi.com',
    imageUrl: 'https://loremflickr.com/360/240/rome,colosseum,italy?lock=1',
  },
  {
    destinationName: 'Vienna',
    flightPriceEur: 112,
    departLabel: 'Fri 21 Mar',
    returnLabel: 'Sun 23 Mar',
    blurb: 'Imperial palaces, classical music, and café culture with elegant streets at every turn.',
    hotelEstimateEur: 110,
    observedLabel: 'Thu 19 Mar 07:42 CET',
    bookingUrl: 'https://www.kiwi.com',
    imageUrl: 'https://loremflickr.com/360/240/vienna,schonbrunn,palace?lock=1',
  },
  {
    destinationName: 'Amsterdam',
    flightPriceEur: 118,
    departLabel: 'Fri 21 Mar',
    returnLabel: 'Sun 23 Mar',
    blurb: 'Canal-lined streets, nice museums, and vibrant neighborhoods connected by bike and water.',
    hotelEstimateEur: 110,
    observedLabel: 'Thu 19 Mar 07:42 CET',
    bookingUrl: 'https://www.kiwi.com',
    imageUrl: 'https://loremflickr.com/360/240/amsterdam,canal,houses?lock=1',
  },
]

export default function WeeklyDealsPreview() {
  return (
    <WeeklyDeals
      deals={sampleDeals}
      weekLabel="Weekend of 20-22 Mar 2026"
      unsubscribeUrl="https://flajko.com/api/unsubscribe?token=preview"
      logoUrl="https://www.figma.com/api/mcp/asset/4a290af3-47b0-45b0-982f-9f8d53bc5be3"
    />
  )
}
