import React from 'react'
import Image from 'next/image'
import { ImageData, getNounData } from '@nouns/assets'
import cdf from '@stdlib/stats-base-dists-binomial-cdf'
import { buildSVG } from '@nouns/sdk'
import loadingNoun from 'public/loading-skull-noun.gif'
import Progress from 'components/Progress'
import Skeleton from 'components/Skeleton'
import { capitalize } from 'utils/index'
import { NounSeed, Status, Rarity } from 'utils/types'
import { useTraitStats } from 'utils/hooks'
import { EncodedImage } from '@nouns/assets/dist/types'

const traitProbabilityMap: Record<string, number> = {
  Background: 0.5,
  Body: 0.0333333333,
  Accessory: 0.0070422535,
  Head: 0.0039840637,
  Glasses: 0.0434782609,
}

type TableProps = {
  seed?: NounSeed
  status: Status
  id?: number
  latestId?: number
}

const getRarity = (total: number, pct: number): Rarity => {
  if (total === 1 || total === undefined) return 'Only Mint'
  if (total <= 3) return 'Very Limited'
  if (total <= 5) return 'Limited'
  if (pct > 0.8) return 'Very Common'
  if (pct > 0.49) return 'Common'
  if (pct > 0.35) return 'Medium'
  if (pct > 0.25) return 'Rare'
  if (pct > 0.1) return 'Very Rare'
  return 'Limited'
}

const getProgress = (total: number, pct: number, status: Status) => {
  const rarity = getRarity(total, pct)
  return {
    name: '',
    value: <Progress pct={pct} status={status} rarity={rarity} />,
    href: '',
  }
}

const generateTableData = (
  apiData: Record<string, Record<string, number>>,
  status: Status,
  latestId?: number,
  nounParts?: {
    name: string
    image: string
  }[]
) => {
  const traitArr = ['background', 'body', 'accessory', 'head', 'glasses']
  const rowsWithTraits = traitArr.map((trait, j) => {
    const regular = `${trait}-${nounParts?.[j].name}`
    const probRef = `https://www.probe.wtf/nouns?${trait}=${
      nounParts?.[j].name == 'Warm' ? 'e1d7d5' : nounParts?.[j].name == 'Cool' ? 'd5d7e1' : regular
    }`

    return [
      { name: capitalize(trait), value: nounParts?.[j].name, href: '' },
      { name: 'Avg. Sale', value: '', href: '' },
      { name: 'Population', value: '', href: probRef },
      { name: '', value: <Progress rarity="Common" />, href: '' },
    ]
  })
  if (apiData) {
    return rowsWithTraits.map((row, j) =>
      row.map((rowData, i) => {
        if (i === 1) {
          const amount = apiData[traitArr[j]]?.median_sale_price?.toFixed(2)
          return { ...rowData, value: amount ? `Ξ ${amount}` : '—' }
        }
        if (i === 2) {
          return { ...rowData, value: apiData[traitArr[j]]?.total_occurrence ?? '1' }
        }
        if (i === 3) {
          return getProgress(
            apiData[traitArr[j]]?.total_occurrence,
            cdf(apiData[traitArr[j]]?.total_occurrence, (latestId || 1000) + 1, traitProbabilityMap[row[0].name]),
            status
          )
        }
        return rowData
      })
    )
  }
  return rowsWithTraits
}

const generateImage = (parts: EncodedImage[], background: string, id: number) =>
  `data:image/svg+xml;base64,${window.btoa(buildSVG(id === -1 ? [] : [parts[id]], ImageData.palette, background))}`

const renderNounParts = (seed: NounSeed) => {
  const { parts, background } = getNounData(seed)

  return [
    {
      name: background === 'e1d7d5' ? 'Warm' : 'Cool',
      image: generateImage(parts, background, -1),
    },
    {
      name: capitalize(parts[0].filename.replace('body-', '')),
      image: generateImage(parts, background, 0),
    },
    {
      name: capitalize(parts[1].filename.replace('accessory-', '')),
      image: generateImage(parts, background, 1),
    },
    {
      name: capitalize(parts[2].filename.replace('head-', '')),
      image: generateImage(parts, background, 2),
    },
    {
      name: capitalize(parts[3].filename.replace('glasses-', '')),
      image: generateImage(parts, background, 3),
    },
  ]
}

const Table = ({ seed, status, id, latestId }: TableProps) => {
  const { data, status: dataStatus } = useTraitStats(seed as unknown as Record<string, string>, id)

  const bg = seed?.background.toString() === '0' ? 'bg-cool' : 'bg-warm'
  const nounParts = seed && renderNounParts(seed)
  const tableData = generateTableData(data?.body, dataStatus, latestId, nounParts)

  return (
    <div className="grid min-w-[480px] grid-cols-[40px_repeat(3,_minmax(0,_1fr))_auto] gap-4">
      {tableData.map((row, i) => (
        <React.Fragment key={i}>
          <div className={`${bg} flex h-10 w-10 rounded text-black`}>
            <Image
              className="rounded"
              alt={`Noun`}
              width={40}
              height={40}
              src={status === 'loading' || seed === undefined || nounParts === undefined ? loadingNoun : nounParts?.[i].image}
            />
          </div>
          {row.map((data, j) => (
            <div key={j}>
              {data.name ? (
                <Skeleton
                  loading={dataStatus !== 'success'}
                  loadingElement={<div className="mb-1 h-3 animate-pulse rounded bg-white/20" />}
                >
                  {React.isValidElement(data.name) ? (
                    data.name
                  ) : (
                    <div className="text-xs font-light uppercase tracking-wider text-white/60">{data.name}</div>
                  )}
                </Skeleton>
              ) : null}

              {React.isValidElement(data.value) ? (
                data.value
              ) : (
                <Skeleton loading={dataStatus !== 'success'} loadingElement={<div className="h-6 animate-pulse rounded bg-white/20" />}>
                  {j == 2 ? (
                    <a
                      href={data.href}
                      className="text-md mr-1 truncate font-medium transition ease-in-out hover:text-white/80"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {data.value}
                    </a>
                  ) : (
                    <div className="text-md truncate font-medium">{data.value}</div>
                  )}
                </Skeleton>
              )}
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  )
}

export default React.memo(Table)
