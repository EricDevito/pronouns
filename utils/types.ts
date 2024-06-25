export type AuctionState = 'settled' | 'live' | 'unsettled'

export type FontWeight = 'normal' | 'medium' | 'bold'

export interface Bid {
  id: string
  bidder: Bidder
  amount: string
  bids: Bidder[]
}

export interface Bidder {
  id: string
}

export interface NounSeed {
  accessory: number
  background: number
  body: number
  glasses: number
  head: number
}

export type Status = 'success' | 'error' | 'loading' | 'idle' | 'queued'

export type Rarity = 'Very Common' | 'Common' | 'Medium' | 'Rare' | 'Very Rare' | 'Limited' | 'Very Limited' | 'Only Mint'

export type ToastData = {
  open: boolean
  message: string
  type: Status
}

export type NounType = {
  amount: string
  endTime: number
  bidder: Bidder
  settled: boolean
  bids: Bid[]
  noun: {
    seed: NounSeed
  }
}

// multisig
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

export interface PartialProposalData {
  data: PartialProposal[]
  error?: Error
  loading: boolean
}

// vote
export type QueuedVote = {
  propId: number
  support: number
}

export type Proposals = {
  propId: number
  status: string
  title: string
  isQueued?: boolean
  queuedVote?: QueuedVote
}

export interface Receipt {
  hasVoted: boolean
  support: number
  votes: number
}
