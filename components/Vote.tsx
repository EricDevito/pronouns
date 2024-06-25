import React from 'react'
import { ChainId, getContractAddressesForChainOrThrow } from '@nouns/sdk'
import { Address, useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi'
import Button from 'components/Button'
import Paragraph from 'components/Paragraph'
import Toast from 'components/Toast'
import { Proposals, Receipt, Status, ToastData } from 'utils/types'
const { nounsDAOProxy } = getContractAddressesForChainOrThrow(ChainId.Mainnet)
import SafeApiKit from '@safe-global/api-kit'
import { useAutoConnect } from 'utils/hooks'

const statusToMessage: Record<Status, string> = {
  queued: 'Vote Queued',
  success: 'Bid Confirmed',
  loading: 'Bid Pending',
  error: 'Bid Failed',
  idle: 'Bid Pending',
}

const Vote = ({ propId, status, title, isQueued, queuedVote }: Proposals) => {
  const apiKit = new SafeApiKit({
    chainId: BigInt(ChainId.Mainnet),
  })

  const [isMultisig, setisMultisig] = React.useState<boolean>(false)

  const autoConnect = useAutoConnect()
  const walletClient = useAccount()

  React.useEffect(() => {
    if (autoConnect) {
      if (walletClient.connector?.name == 'Safe') {
        setisMultisig(true)
      }
    }
  }, [autoConnect, walletClient.connector])

  const [reason, setReason] = React.useState<string>('')

  const { isConnected, address } = useAccount()
  const [toast, setToast] = React.useState<ToastData>({ open: false, message: '', type: 'error' })
  const [txHash, setTxHash] = React.useState('')
  const [votingDirection, setVotingDirection] = React.useState<number | undefined>(undefined)
  const [isVoteQueued, setIsVoteQueued] = React.useState<boolean | undefined>(isQueued)
  const [queuedVoteDirection, setQueuedVoteDirection] = React.useState<number | undefined>(queuedVote ? queuedVote.support : undefined)

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

  const NounsDAOLogicV4ABI = [
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'proposalId',
          type: 'uint256',
        },
        {
          internalType: 'uint8',
          name: 'support',
          type: 'uint8',
        },
        {
          internalType: 'uint32',
          name: 'clientId',
          type: 'uint32',
        },
      ],
      name: 'castRefundableVote',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'proposalId',
          type: 'uint256',
        },
        {
          internalType: 'uint8',
          name: 'support',
          type: 'uint8',
        },
        {
          internalType: 'string',
          name: 'reason',
          type: 'string',
        },
        {
          internalType: 'uint32',
          name: 'clientId',
          type: 'uint32',
        },
      ],
      name: 'castRefundableVoteWithReason',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'proposalId',
          type: 'uint256',
        },
        {
          internalType: 'address',
          name: 'voter',
          type: 'address',
        },
      ],
      name: 'getReceipt',
      outputs: [
        {
          components: [
            {
              internalType: 'bool',
              name: 'hasVoted',
              type: 'bool',
            },
            {
              internalType: 'uint8',
              name: 'support',
              type: 'uint8',
            },
            {
              internalType: 'uint96',
              name: 'votes',
              type: 'uint96',
            },
          ],
          internalType: 'struct NounsDAOStorage.Receipt',
          name: '',
          type: 'tuple',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ]

  const {
    config,
    isError: voteError,
    error,
  } = usePrepareContractWrite({
    address: nounsDAOProxy as Address,
    abi: NounsDAOLogicV4ABI,
    enabled: isConnected && votingDirection !== undefined,
    functionName: reason ? 'castRefundableVoteWithReason' : 'castRefundableVote',
    args: reason ? [propId, votingDirection, reason, 14] : [propId, votingDirection, 14],
  })

  const { write: castVote, data: voteTxData } = useContractWrite(config)
  const { status: voteStatus } = useWaitForTransaction({
    hash: voteTxData?.hash,
  })

  const fetchTransactionStatus = async () => {
    if (isMultisig) {
      const queued = await apiKit.getTransaction(voteTxData?.hash as string)

      if (queued) {
        return 'queued'
      }
    } else {
      return voteStatus
    }
  }

  const { data } = useContractRead({
    address: nounsDAOProxy as Address,
    abi: NounsDAOLogicV4ABI,
    functionName: 'getReceipt',
    enabled: isConnected,
    args: [propId?.toString(), address],
  })

  const receipt = data as Receipt

  const voterInfo = () => {
    if (receipt?.hasVoted) {
      let votingDirection = ''
      switch (receipt.support) {
        case 0:
          votingDirection = 'Against'
          break
        case 1:
          votingDirection = 'For'
          break
        case 2:
          votingDirection = 'Abstain'
          break
        default:
          votingDirection = 'Invalid'
          break
      }
      return `Voted ${votingDirection} with ${receipt.votes} Nouns`
    }
    return ''
  }

  const queuedVoteInfo = () => {
    if (queuedVote || queuedVoteDirection) {
      let votingDirection = ''
      switch (queuedVote ? queuedVote?.support : queuedVoteDirection) {
        case 0:
          votingDirection = 'Against'
          break
        case 1:
          votingDirection = 'For'
          break
        case 2:
          votingDirection = 'Abstain'
          break
        default:
          votingDirection = 'Invalid'
          break
      }
      return `Queued ${votingDirection}`
    }
    return ''
  }

  const queueVote = () => {
    if (isConnected) {
      if (votingDirection == undefined) {
        return triggerErrorToast(`Select a voting direction!`)
      }

      return voteError ? triggerErrorToast(`Error: ${error}`) : castVote?.()
    } else {
      triggerErrorToast('Wallet not connected')
    }
  }

  React.useEffect(() => {
    fetchTransactionStatus().then(txnStatus => {
      if (txnStatus == 'queued') {
        triggerDataToast(txnStatus, voteTxData?.hash)
        setIsVoteQueued(true)
        setQueuedVoteDirection(votingDirection)
      } else if (txnStatus !== 'idle') {
        triggerDataToast(voteStatus, voteTxData?.hash)
      }
    })
  }, [voteStatus])

  const propTitleDisplay = `${propId}: ${title.length > 20 ? `${title.substring(0, 17)}...` : title}`

  return (
    <div className="flex flex-col gap-y-4 rounded-xl border border-white/10 p-4">
      <div className="flex justify-between">
        <Paragraph>{propTitleDisplay}</Paragraph>
      </div>

      <textarea
        className="h-20 resize-none rounded-md bg-white/5"
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="reason (optional)"
        rows={4}
        style={{ minHeight: '80px', paddingLeft: '8px' }}
      />
      <div className="grid grid-cols-3 gap-2">
        <Button
          key={0}
          weight="normal"
          onClick={() => setVotingDirection(1)}
          type="outline"
          className={votingDirection === 1 ? 'bg-green-500' : 'bg-transparent'}
        >
          For
        </Button>
        <Button
          key={1}
          weight="normal"
          onClick={() => setVotingDirection(0)}
          type="outline"
          className={votingDirection === 0 ? 'bg-red-500' : 'bg-transparent'}
        >
          Against
        </Button>
        <Button
          key={2}
          weight="normal"
          onClick={() => setVotingDirection(2)}
          type="outline"
          className={votingDirection === 2 ? 'bg-orange-500' : 'bg-transparent'}
        >
          Abstain
        </Button>
      </div>
      <div className="flex flex-col gap-y-2">
        <Toast data={toast} setData={setToast} txHash={txHash}>
          <Button onClick={queueVote} type="action" disabled={receipt?.hasVoted || isVoteQueued || !!queuedVote}>
            {receipt?.hasVoted ? (
              <span style={{ fontSize: voterInfo().length > 20 ? '0.96em' : '1em' }}>{voterInfo()}</span>
            ) : isVoteQueued == true || !!queuedVote ? (
              <span style={{ fontSize: voterInfo().length > 20 ? '0.96em' : '1em' }}>{queuedVoteInfo()}</span>
            ) : (
              'Queue Vote'
            )}
          </Button>
        </Toast>
      </div>
    </div>
  )
}

export default React.memo(Vote)
