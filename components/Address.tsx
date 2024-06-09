import React from 'react'
// import BigNumber from 'bignumber.js'
// import { utils, BigNumber as EthersBN } from 'ethers'
import { formatEther } from 'viem'
import { Address, useBalance } from 'wagmi'
import { ExternalLinkIcon } from '@heroicons/react/outline'
import Account from 'components/Account'
import Paragraph from 'components/Paragraph'
import Skeleton from 'components/Skeleton'
import Tooltip from 'components/Tooltip'
import { formatNumber } from 'utils/index'
import { Bid } from 'utils/types'
import { useOwner } from 'utils/hooks'

type HeaderProps = {
  address: string
  txHash: string
  bidCount?: number
}

type ListProps = {
  items: Bid[] | undefined
}
// type EthereumAddress = `0x${string}`;
const Header = ({ address, txHash, bidCount = 0 }: HeaderProps) => {
  const { data } = useBalance({
    address: address as Address,
  })
  const { data: owner, status: ownerStatus } = useOwner(address)
  return (
    <div className="relative rounded-lg bg-white/5 px-5 py-4">
      <a
        className="absolute right-2.5 top-2.5 z-10 transition ease-in-out hover:text-white/70"
        aria-label="Top bid on etherscan"
        rel="noreferrer"
        target="_blank"
        // href={`https://etherscan.io/tx/${txHash}`}
        href={`https://etherscan.io/address/${address}`}
      >
        <ExternalLinkIcon aria-label="Etherscan" className="h-4 w-4 opacity-60" />
      </a>
      <div className="flex flex-col justify-between gap-y-4">
        <div>
          <Paragraph className="mb-2 text-xs opacity-60 xxs:text-sm">Highest Bidder</Paragraph>
          <Paragraph className="flex items-center justify-between text-lg">
            <Account alwaysAvatar address={address} />
          </Paragraph>
        </div>
        <div className="flex items-center justify-between gap-x-2">
          <div>
            <Paragraph className="mb-2 text-xs opacity-60 xxs:text-sm">
              Dry Powder <Tooltip darkBg text="Amount of ETH in top bidder's wallet" />
            </Paragraph>
            <Paragraph className="text-lg font-normal tracking-widest">
              Ξ {formatNumber(Number((+(data?.formatted || 0)).toFixed(2)))}
            </Paragraph>
          </div>
          <div>
            <Paragraph className="mb-2 text-xs opacity-60 xxs:text-sm">
              Current Bids <Tooltip darkBg text="Number of bids placed by top bidder in this auction" />
            </Paragraph>
            <Paragraph className="text-lg font-normal tracking-wide">{bidCount}</Paragraph>
          </div>
          <div>
            <Paragraph className="mb-2 text-xs opacity-60 xxs:text-sm">
              Nouns Owned <Tooltip darkBg text="Number of Nouns owned by top bidder" />
            </Paragraph>
            <Skeleton
              className=""
              loading={ownerStatus !== 'success'}
              loadingElement={<div className="col-span-2 mb-1 h-5 animate-pulse rounded bg-white/20" />}
            >
              <Paragraph className="text-lg font-normal tracking-wide">{owner?.tokenBalanceRaw}</Paragraph>
            </Skeleton>
          </div>
        </div>
      </div>
    </div>
  )
}

const List = ({ items }: ListProps) => (
  <div className="flex flex-col gap-y-4 p-3">
    {items?.map((bid: Bid) => (
      <Paragraph key={bid.id} className="flex items-center justify-between truncate">
        <Account className="max-w-[50%] opacity-70 xl:max-w-none" alwaysAvatar address={bid?.bidder?.id as `0x${string}`} />
        <a
          className="mr-1 flex items-center gap-x-4 transition ease-in-out hover:text-white/80"
          rel="noopener noreferer noreferrer"
          target="_blank"
          // href={`https://etherscan.io/tx/${bid?.id}`}
          href={`https://etherscan.io/address/${bid?.bidder.id}`}
        >
          <span className="min-w-[50px] tabular-nums text-white hover:text-white/80">
            {/* Ξ {new BigNumber(formatEther(BigInt((bid?.amount || 0))))}  */}Ξ {formatEther(BigInt(bid?.amount || 0))}
          </span>
          <ExternalLinkIcon aria-label="Etherscan" className="h-4 w-4 opacity-60" />
        </a>
      </Paragraph>
    ))}
  </div>
)

const pkg = {
  Header: React.memo(Header),
  List: React.memo(List),
}

export { pkg as Address }
