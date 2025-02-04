import Image from 'next/image'
import { ImageData, getNounData } from '@nouns/assets'
import { buildSVG } from '@nouns/sdk'
import loadingNoun from 'public/loading-skull-noun.gif'
import { NounSeed, Status } from 'utils/types'
import { Address } from 'viem'
import { useContractRead } from 'wagmi'
type NounProps = {
  seed?: NounSeed
  id: number | undefined
  status: Status
  isSmall?: boolean
  className?: string
}

export const NounsDescriptorV3ABI = [
  {
    inputs: [
      {
        components: [
          {
            internalType: 'uint48',
            name: 'background',
            type: 'uint48',
          },
          {
            internalType: 'uint48',
            name: 'body',
            type: 'uint48',
          },
          {
            internalType: 'uint48',
            name: 'accessory',
            type: 'uint48',
          },
          {
            internalType: 'uint48',
            name: 'head',
            type: 'uint48',
          },
          {
            internalType: 'uint48',
            name: 'glasses',
            type: 'uint48',
          },
        ],
        internalType: 'struct INounsSeeder.Seed',
        name: 'seed',
        type: 'tuple',
      },
    ],
    name: 'generateSVGImage',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

const useRenderNoun = (seed: NounSeed) => {
  const { parts, background } = getNounData(seed)

  const { data: svg } = useContractRead({
    address: '0x33a9c445fb4fb21f2c030a6b2d3e2f12d017bfac' as Address,
    abi: NounsDescriptorV3ABI,
    functionName: 'generateSVGImage',
    args: [seed],
    enabled: seed !== undefined,
  })

  if (parts && parts.some(part => part == undefined)) {
    return `data:image/svg+xml;base64,${svg}`
  }
  return `data:image/svg+xml;base64,${window.btoa(buildSVG(parts, ImageData.palette, background))}`
}

const Noun = ({ seed, status, id, isSmall = false, className = '' }: NounProps) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const nounSrc = seed ? useRenderNoun(seed) : 'undefined'

  return (
    <div
      className={`${isSmall ? '' : seed?.background.toString() === '0' ? 'bg-cool' : 'bg-warm'} flex justify-center ${
        isSmall ? 'h-6 w-6' : 'h-64 rounded-lg'
      } text-black ${className}`}
    >
      <Image
        {...(isSmall ? { style: { borderRadius: '50%' } } : {})}
        key={status}
        alt={`Noun ${id}`}
        width={256}
        height={256}
        src={status === 'loading' || seed === undefined ? loadingNoun : nounSrc}
      />
    </div>
  )
}

export default Noun
