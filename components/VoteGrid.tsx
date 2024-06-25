import React, { useState } from 'react'
import Vote from 'components/Vote'
import { usePendingGnosisTransactions } from 'utils/hooks'
import { PartialProposal } from 'utils/types'

interface ActiveProposalsProps {
  activeProposals: PartialProposal[]
  isConnected: boolean
  address: string | undefined
}

const VoteGrid: React.FC<ActiveProposalsProps> = ({ activeProposals, isConnected, address }) => {
  const [pendingTxData, setPendingTxData] = useState<{
    pendingTransactions: any[] | undefined
  }>({ pendingTransactions: undefined })

  const { pendingTransactions, loading } = usePendingGnosisTransactions(address, '0x6f3E6272A167e8AcCb32072d08E0957F9c79223d')

  React.useEffect(() => {
    if (isConnected && address) {
      const fetchPendingTx = async () => {
        setPendingTxData({ pendingTransactions })
      }
      fetchPendingTx()
    }
  }, [address, isConnected, pendingTransactions])

  if (loading) {
    return <div>Loading pending transactions...</div>
  }

  return (
    <>
      {activeProposals?.map((prop: any, index: number) => {
        const pendingTx = pendingTxData.pendingTransactions?.find(tx => Number(tx.propId) === prop.propId)
        const isAvail = pendingTx && Number(pendingTx.propId) === prop.propId

        return (
          <div key={index} className="col-span-1">
            <Vote propId={prop.propId} status={prop.status.toString()} title={prop.title} isQueued={isAvail} queuedVote={pendingTx} />
          </div>
        )
      })}
    </>
  )
}

export default VoteGrid
