import BigNumber from 'bignumber.js'
import Nav from 'components/Nav'
import Skeleton from 'components/Skeleton'
import { NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import { useLatestNounId, useProposals, useBlockTimestamp } from 'utils/hooks'
import { useAccount, useBlockNumber } from 'wagmi'
import VoteGrid from 'components/VoteGrid'
import { PartialProposal, PartialProposalSubgraphEntity, ProposalState, ProposalSubgraphEntity } from 'utils/types'

const getProposalState = (
  blockNumber: number | undefined,
  blockTimestamp: Date | undefined,
  proposal: PartialProposalSubgraphEntity | ProposalSubgraphEntity,
  isDaoGteV3?: boolean,
  onTimelockV1?: boolean
) => {
  const status = ProposalState[proposal.status]
  if (status === ProposalState.PENDING || status === ProposalState.ACTIVE) {
    if (!blockNumber) {
      return ProposalState.UNDETERMINED
    }
    if (isDaoGteV3 && proposal.updatePeriodEndBlock && blockNumber <= parseInt(proposal.updatePeriodEndBlock)) {
      return ProposalState.UPDATABLE
    }

    if (blockNumber <= parseInt(proposal.startBlock)) {
      return ProposalState.PENDING
    }

    if (
      isDaoGteV3 &&
      blockNumber > +proposal.endBlock &&
      parseInt(proposal.objectionPeriodEndBlock) > 0 &&
      blockNumber <= parseInt(proposal.objectionPeriodEndBlock)
    ) {
      return ProposalState.OBJECTION_PERIOD
    }

    // if past endblock, but onchain status hasn't been changed
    if (blockNumber > parseInt(proposal.endBlock) && blockNumber > parseInt(proposal.objectionPeriodEndBlock)) {
      const forVotes = new BigNumber(proposal.forVotes)
      if (forVotes.lte(proposal.againstVotes) || forVotes.lt(proposal.quorumVotes)) {
        return ProposalState.DEFEATED
      }
      if (!proposal.executionETA) {
        return ProposalState.SUCCEEDED
      }
    }
    return ProposalState.ACTIVE
  }

  // if queued, check if expired
  if (status === ProposalState.QUEUED) {
    if (!blockTimestamp || !proposal.executionETA) {
      return ProposalState.UNDETERMINED
    }
    // if v3+ and not on timelock v1, grace period is 21 days, otherwise 14 days
    const GRACE_PERIOD = isDaoGteV3 && !onTimelockV1 ? 21 * 60 * 60 * 24 : 14 * 60 * 60 * 24
    if (blockTimestamp.getTime() / 1_000 >= parseInt(proposal.executionETA) + GRACE_PERIOD) {
      return ProposalState.EXPIRED
    }
    return status
  }

  return status
}

const parsePartialSubgraphProposal = (
  proposal: PartialProposalSubgraphEntity | undefined,
  blockNumber: number | undefined,
  timestamp: number | undefined,
  isDaoGteV3?: boolean
) => {
  if (!proposal) {
    return
  }
  const onTimelockV1 = proposal.onTimelockV1 === null ? false : true
  return {
    id: proposal.id,
    title: proposal.title ?? 'Untitled',
    status: getProposalState(blockNumber, new Date((timestamp ?? 0) * 1000), proposal, isDaoGteV3, onTimelockV1),
    startBlock: parseInt(proposal.startBlock),
    endBlock: parseInt(proposal.endBlock),
    updatePeriodEndBlock: parseInt(proposal.updatePeriodEndBlock),
    forCount: parseInt(proposal.forVotes),
    againstCount: parseInt(proposal.againstVotes),
    abstainCount: parseInt(proposal.abstainVotes),
    quorumVotes: parseInt(proposal.quorumVotes),
    eta: proposal.executionETA ? new Date(Number(proposal.executionETA) * 1000) : undefined,
  }
}

const Multisig: NextPage = () => {
  const { isConnected, address } = useAccount()
  const [latestId, setLatestId] = React.useState<number>()
  const { data: latestNounId, status: latestNounStatus } = useLatestNounId()
  const { data: props, status: propStatus } = useProposals()

  const blockNumber = useBlockNumber()
  const timestamp = useBlockTimestamp(Number(blockNumber.data))
  const proposals = props?.map((proposal: ProposalSubgraphEntity) =>
    parsePartialSubgraphProposal(proposal, Number(blockNumber.data), timestamp, true)
  )
  const activeProposals =
    proposals
      ?.filter((proposal: PartialProposal) => proposal.status === ProposalState.ACTIVE)
      .sort((a: PartialProposal, b: PartialProposal) => (a.id ?? '').localeCompare(b.id ?? ''))
      .map((proposal: PartialProposal) => ({
        propId: proposal.id ? Number(proposal.id) : undefined,
        status: proposal.status,
        title: proposal.title,
      })) || []

  React.useEffect(() => {
    if (latestNounStatus === 'success') {
      setLatestId(Number(latestNounId))
    }
  }, [latestNounId, latestNounStatus])

  return (
    <div className="bg-ui-black text-white">
      <Head>
        <meta name="title" content="Auction | Pronouns" />
        <meta property="og:title" content="Auction | Pronouns" />
        <title>Multisig | Pronouns</title>
      </Head>
      <Nav latestId={latestId} />
      <div className="grid w-full grid-cols-1 gap-x-6 gap-y-6 px-10 py-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <Skeleton
          className=""
          loading={propStatus !== 'success'}
          loadingElement={
            <div className="flex flex-col gap-y-2 rounded-xl border border-white/10 p-4">
              <div className="col-span-2 mb-1 h-5 animate-pulse rounded bg-white/20" />
              <div className="col-span-2 h-8 animate-pulse rounded bg-white/20" />
              <div className="col-span-2 h-8 animate-pulse rounded bg-white/20" />
            </div>
          }
        >
          <VoteGrid activeProposals={activeProposals} isConnected={isConnected} address={address} />
        </Skeleton>
      </div>
    </div>
  )
}
export default Multisig
