import BigNumber from 'bignumber.js'
import Nav from 'components/Nav'
import Skeleton from 'components/Skeleton'
import Vote from 'components/Vote'
import { NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import { useEffect, useState } from 'react'
import { useLatestNounId, useProposals, useBlockNumberData, useBlockTimestamp } from 'utils/hooks'
import { useBlockNumber } from 'wagmi'

export enum ProposalState {
  UNDETERMINED = -1,
  PENDING,
  ACTIVE,
  CANCELLED,
  DEFEATED,
  SUCCEEDED,
  QUEUED,
  EXPIRED,
  EXECUTED,
  VETOED,
  OBJECTION_PERIOD,
  UPDATABLE,
}
export interface PartialProposal {
  id: string | undefined
  title: string
  status: ProposalState
  forCount: number
  againstCount: number
  abstainCount: number
  startBlock: number
  endBlock: number
  eta: Date | undefined
  quorumVotes: number
  objectionPeriodEndBlock: number
  updatePeriodEndBlock: number
}

export interface ProposalTransactionDetails {
  targets: string[]
  values: string[]
  signatures: string[]
  calldatas: string[]
  encodedProposalHash: string
}
export interface PartialProposalSubgraphEntity {
  id: string
  title: string
  status: keyof typeof ProposalState
  forVotes: string
  againstVotes: string
  abstainVotes: string
  startBlock: string
  endBlock: string
  executionETA: string | null
  quorumVotes: string
  objectionPeriodEndBlock: string
  updatePeriodEndBlock: string
  onTimelockV1: boolean | null
  signers: { id: string }[]
}

export interface ProposalSubgraphEntity extends ProposalTransactionDetails, PartialProposalSubgraphEntity {
  description: string
  createdBlock: string
  createdTransactionHash: string
  createdTimestamp: string
  proposer: { id: string }
  proposalThreshold: string
  onTimelockV1: boolean
  voteSnapshotBlock: string
}

interface PartialProposalData {
  data: PartialProposal[]
  error?: Error
  loading: boolean
}

const partialProposalsQuery = ` {
    proposals(first: 100, orderBy: createdBlock, orderDirection: desc) {
      id
      title
      status
      forVotes
      againstVotes
      abstainVotes
      quorumVotes
      executionETA
      startBlock
      endBlock
      updatePeriodEndBlock
      objectionPeriodEndBlock
      onTimelockV1
      signers {
        id
      }
  }`

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

export const useAllProposalsViaSubgraph = async (): Promise<PartialProposalData> => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState()

  const blockNumber = useBlockNumberData()
  const timestamp = useBlockTimestamp(Number(blockNumber))

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://api.goldsky.com/api/public/project_cldf2o9pqagp43svvbk5u3kmo/subgraphs/nouns/prod/gn', {
          method: 'post',
          body: JSON.stringify({
            query: partialProposalsQuery,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const responseData = await response.json()

        const proposals = responseData.data?.proposals?.map((proposal: ProposalSubgraphEntity) =>
          parsePartialSubgraphProposal(proposal, Number(blockNumber), timestamp, true)
        )

        setData(proposals)
      } catch (e: any) {
        setError(e)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [blockNumber, timestamp])

  return { data, loading, error }
}

const Multisig: NextPage = () => {
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
        propId: proposal.id,
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
            <div className="col-span-1 animate-pulse rounded bg-white/20">{/* <Vote propId={0} status={""} title={""} /> */}</div>
          }
        >
          {activeProposals.map((prop: any, index: number) => (
            <div key={index} className="col-span-1">
              <Vote propId={prop.propId} status={prop.status} title={prop.title} />
            </div>
          ))}
        </Skeleton>
      </div>
    </div>
  )
}
export default Multisig
