import React from 'react'
import Button from 'components/Button'
import Metric from 'components/Metric'
import Paragraph from 'components/Paragraph'
import Skeleton from 'components/Skeleton'
import { formatDate } from 'utils/index'
import { AuctionState, Status, ToastData } from 'utils/types'
import crosshair from 'public/icons/crosshair.svg'
import FomoNounsEmbed from './FomoNounsEmbed'
import { usePrepareContractWrite, useContractWrite, useAccount, useWaitForTransaction, Address } from 'wagmi'
import Toast from 'components/Toast'
import { ChainId, getContractAddressesForChainOrThrow } from '@nouns/sdk'
const { nounsAuctionHouseProxy } = getContractAddressesForChainOrThrow(ChainId.Mainnet)

type AuctionDetailsProps = {
  status: Status
  isNounder: boolean
  auctionState: AuctionState
  startTime: number
  bids?: number
}

const statusToMessage: Record<Status, string> = {
  success: 'Settlement Confirmed',
  loading: 'Settlement Pending',
  error: 'Settlement Failed',
  idle: 'Settlement Pending',
}

const AuctionDetails = ({ status, isNounder, auctionState, startTime, bids }: AuctionDetailsProps) => {
  const { isConnected } = useAccount()
  const [toast, setToast] = React.useState<ToastData>({ open: false, message: '', type: 'error' })
  const [txHash, setTxHash] = React.useState('')

  const triggerErrorToast = (message: string) => {
    setToast({ message, open: true, type: 'error' })
    const timeout = setTimeout(() => {
      setToast(toast => ({ ...toast, open: false }))
    }, 4000)

    return () => clearTimeout(timeout)
  }

  const triggerDataToast = (status: Status, hash?: string) => {
    hash && setTxHash(hash)
    setToast({ message: statusToMessage[status], open: true, type: status })
    if (status === 'success') {
      const timeout = setTimeout(() => {
        setToast(toast => ({ ...toast, open: false }))
      }, 4000)

      return () => clearTimeout(timeout)
    }
  }

  const NounsAuctionHouseV2ABI = [
    {
      inputs: [],
      name: 'settleCurrentAndCreateNewAuction',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ]

  const {
    config,
    isError: settlementError,
    error,
  } = usePrepareContractWrite({
    address: nounsAuctionHouseProxy as Address,
    abi: NounsAuctionHouseV2ABI,
    enabled: isConnected,
    functionName: 'settleCurrentAndCreateNewAuction',
  })

  const { write: settleAuction, data: settlementTxData } = useContractWrite(config)
  const { status: settlementStatus } = useWaitForTransaction({
    hash: settlementTxData?.hash,
  })

  React.useEffect(() => {
    if (settlementStatus !== 'idle') {
      triggerDataToast(settlementStatus, settlementTxData?.hash)
    }
  }, [settlementStatus, settlementTxData?.hash])

  const callSettlement = () => {
    if (isConnected) {
      return settlementError ? triggerErrorToast(`Insufficient Balance: ${error}`) : settleAuction?.()
    } else {
      triggerErrorToast('Wallet not connected')
    }
  }

  return (
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
            <Toast data={toast} setData={setToast} txHash={txHash}>
              <Button
                className="w-full bg-ui-sulphur text-center text-ui-black hover:bg-ui-sulphur/90"
                type="action-secondary"
                onClick={callSettlement}
              >
                Settle Manually
              </Button>
            </Toast>

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
}

export default AuctionDetails
