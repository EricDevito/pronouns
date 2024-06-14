import { useQuery } from '@tanstack/react-query'
import { getDefaultProvider } from 'ethers'
import { useEffect, useState } from 'react'
import { getLatestNounId, getNoun, getAccount, getSeeds, getTraitStats, getAmounts, getOpenseaData, getProps } from 'utils/index'
import { useBlockNumber, useConnect } from 'wagmi'

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
