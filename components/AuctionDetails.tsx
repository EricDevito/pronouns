import React from 'react'
import Button from 'components/Button'
import Metric from 'components/Metric'
import Paragraph from 'components/Paragraph'
import Skeleton from 'components/Skeleton'
import { formatDate } from 'utils/index'
import { AuctionState, Status } from 'utils/types'
import crosshair from 'public/icons/crosshair.svg'
import FomoNounsEmbed from './FomoNounsEmbed'

type AuctionDetailsProps = {
  status: Status
  isNounder: boolean
  auctionState: AuctionState
  startTime: number
  bids?: number
}

const AuctionDetails = ({ status, isNounder, auctionState, startTime, bids }: AuctionDetailsProps) => (
  <Skeleton
    hasParentElement
    loading={status === 'loading'}
    loadingElement={
      <div className="flex flex-col gap-y-2 rounded-xl border border-white/10 p-4">
        <div className="col-span-2 mb-1 h-5 animate-pulse rounded bg-white/20" />
        <div className="col-span-2 h-8 animate-pulse rounded bg-white/20" />
        <div className="col-span-2 h-8 animate-pulse rounded bg-white/20" />
      </div>
    }
  >
    <div
      className={`${
        auctionState === 'unsettled' && !isNounder
          ? 'lg:h-[calc(100vh_-_143px) flex min-h-[26rem] flex-col gap-y-4 rounded-xl border border-white/10 p-4 sm:h-[calc(100vh_-_143px)]'
          : 'flex flex-col gap-y-4 rounded-xl border border-white/10 p-4'
      }`}
    >
      <Paragraph isLarge>
        {isNounder
          ? 'All Noun auction proceeds are sent to the Nouns DAO. For this reason, the projectʼs founders (‘Nounders’) have chosen to compensate themselves with Nouns. Every 10th Noun for the first 5 years of the project will be sent to their multisig (5/10), where it will be vested and distributed to individual Nounders.'
          : `This auction ended ${formatDate(startTime * 1000, true)}`}
      </Paragraph>
      {auctionState === 'unsettled' && (
        <>
          <Button
            href="https://fomonouns.wtf/"
            className="w-full bg-ui-sulphur text-center text-ui-black hover:bg-ui-sulphur/90"
            type="action-secondary"
          >
            Vote on the next Noun
          </Button>

          <FomoNounsEmbed />
        </>
      )}
      {auctionState === 'settled' && !isNounder && (
        <div className="border-t border-white/10">
          <Metric statClass="tabular-nums" bgColor="transparent" stat={bids} status={status} description="Total Bids" icon={crosshair} />
        </div>
      )}
    </div>
  </Skeleton>
)

export default AuctionDetails
