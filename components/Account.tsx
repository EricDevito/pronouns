import { Address, useEnsName } from 'wagmi'
import { truncateAddress } from 'utils/index'

type AccountProps = {
  address: string
  className?: string
  isEns?: boolean
  alwaysAvatar?: boolean
  textHoverColor?: string
}

const Account = ({ address, isEns = false, alwaysAvatar = false, className = '', textHoverColor }: AccountProps) => {
  const { data: ensName } = useEnsName({
    address: address as Address,
    enabled: !isEns,
  })

  return (
    <a
      href={`https://etherscan.io/address/${address}`}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center ${textHoverColor ?? 'hover:text-white/70'} justify-center transition ease-in-out overflow-hidden${`${
        className.length ? ' ' : ''
      }${className}`}`}
    >
      <img
        alt={`${address} profile`}
        className={`mr-2 h-6 w-6 rounded-full ${alwaysAvatar ? '' : 'inline lg:hidden xl:inline'}`}
        src={`https://cdn.stamp.fyi/avatar/${address}`}
      />
      <span className="truncate tabular-nums">{ensName ? ensName : isEns ? address : truncateAddress(address)}</span>
    </a>
  )
}

export default Account
