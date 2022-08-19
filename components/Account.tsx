import { useEnsName } from 'wagmi'
import { truncateAddress } from 'utils/index'

type AccountProps = {
  address: string
  isEns?: boolean
  alwaysAvatar?: boolean
}

const Account = ({ address, isEns = false, alwaysAvatar = false }: AccountProps) => {
  const { data: ensName } = useEnsName({
    address,
    enabled: !isEns,
  })

  return (
    <span className="flex items-center justify-center">
      <img
        alt={`${address} profile`}
        className={`h-6 w-6 mr-2 rounded-full ${alwaysAvatar ? '' : 'inline lg:hidden xl:inline'}`}
        src={`https://cdn.stamp.fyi/avatar/${address}`}
      />
      <span className="truncate">{ensName ? ensName : isEns ? address : truncateAddress(address)}</span>
    </span>
  )
}

export default Account
