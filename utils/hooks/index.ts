import { useQuery } from '@tanstack/react-query'
import { getDefaultProvider } from 'ethers'
import { useEffect, useState } from 'react'
import { getLatestNounId, getNoun, getAccount, getSeeds, getTraitStats, getAmounts, getOpenseaData, getProps } from 'utils/index'
import { useBlockNumber, useConnect } from 'wagmi'
import SafeApiKit from '@safe-global/api-kit'
import { ChainId } from '@nouns/sdk'
import { ethers } from 'ethers'

export const useLatestNounId = () =>
  useQuery(['latestNounId'], getLatestNounId, {
    retry: 1,
  })

export const useNoun = (id?: number, latestId?: number) => {
  const isNounder = Boolean(id === 0 || (id && id % 10 === 0))
  return useQuery(['noun', id, isNounder], () => getNoun(id), {
    refetchOnWindowFocus: id === latestId,
    refetchInterval: id === latestId && 5000,
    staleTime: id === latestId ? 0 : Infinity,
    cacheTime: id === latestId ? 300000 : Infinity,
    retry: 1,
    enabled: id !== undefined && latestId !== undefined,
  })
}

export const useOwner = (address: string) =>
  useQuery(['owner', address], () => address && getAccount(address), {
    retry: 1,
  })

export const useSeeds = () =>
  useQuery(['seeds'], getSeeds, {
    retry: 1,
  })

export const useTraitStats = (seed?: Record<string, string>, id?: number) => {
  return useQuery(['traitStats', id, seed], () => getTraitStats(seed), {
    retry: 1,
  })
}

export const useAmounts = () => {
  return useQuery(['amounts'], getAmounts, {
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    cacheTime: Infinity,
    retry: 1,
  })
}

export const useOpenseaData = () => {
  return useQuery(['floor'], getOpenseaData, {
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    cacheTime: Infinity,
    retry: 1,
  })
}

export const useProposals = () => {
  return useQuery(['proposals'], getProps, {
    retry: 1,
  })
}

export function useBlockNumberData() {
  const { data: blockNumber } = useBlockNumber()
  return blockNumber
}

export function useBlockTimestamp(blockNumber: number | undefined): number | undefined {
  // const { data: blockNumber } = useBlockNumber();
  const [blockTimestamp, setBlockTimestamp] = useState<number | undefined>()

  useEffect(() => {
    const fetchBlockTimestamp = async () => {
      if (blockNumber) {
        const provider = getDefaultProvider('homestead', {
          alchemy: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
        })
        const block = await provider.getBlock(blockNumber)
        setBlockTimestamp(block?.timestamp || undefined)
      }
    }

    fetchBlockTimestamp()
  }, [blockNumber])

  return blockTimestamp
}

export const AUTOCONNECTED_CONNECTOR_IDS = ['safe', 'MetaMask', 'WalletConnect']

export function useAutoConnect() {
  const { connect, connectors } = useConnect()

  useEffect(() => {
    AUTOCONNECTED_CONNECTOR_IDS.forEach(connector => {
      const connectorInstance = connectors.find(c => c.id === connector && c.ready)

      if (connectorInstance) {
        connect({ connector: connectorInstance })
      }
    })
  }, [connect, connectors])

  return true
}

export const usePendingGnosisTransactions = (safeAddress: string | undefined, targetAddress: string) => {
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!safeAddress) {
      setLoading(false)
      return
    }

    const apiKit = new SafeApiKit({
      chainId: BigInt(ChainId.Mainnet),
    })

    const abi = [
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
            internalType: 'uint8',
            name: 'support',
            type: 'uint8',
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
    ]

    const iface = new ethers.utils.Interface(abi)
    const validFunctionNames = ['castRefundableVoteWithReason', 'castRefundableVote', 'castVoteWithReason', 'castVote']

    const fetchPendingTransactions = async () => {
      try {
        const result = (await apiKit.getPendingTransactions(safeAddress)).results
        const filteredResults = result.filter(tx => tx.to.toLowerCase() === targetAddress.toLowerCase() && tx.data !== undefined)
        const decodedTransactions = filteredResults
          .map(tx => {
            if (tx.data == undefined) return false

            const data = tx.data

            try {
              const parsed = iface.parseTransaction({ data })

              if (!validFunctionNames.includes(parsed.name)) {
                return false
              }

              const propId = parsed.args[0]
              const support = parsed.args[1]

              return {
                propId: propId,
                support: support,
              }
            } catch (error) {
              return false
            }
          })
          .filter(Boolean)

        setPendingTransactions(decodedTransactions)
      } catch (error) {
        setError(error as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchPendingTransactions()
  }, [safeAddress, targetAddress])

  return { pendingTransactions, loading, error }
}
