import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Connect from 'components/Connect'
import Search from 'components/Search'
import logo from 'public/pronouns-logo.svg'
import { useRouter } from 'next/router'
import Button from './Button'

const Nav = ({ latestId, isMultisig }: { latestId?: number; isMultisig?: boolean }) => {
  const { push } = useRouter()

  const pushPage = () => {
    push('/multisig')
  }

  return (
    <div className="xs:no-flex-wrap flex flex-wrap items-center justify-between gap-x-4 gap-y-4 border-b border-b-white/10 px-10 py-6 sm:gap-x-0 sm:gap-y-0 lg:grid lg:grid-cols-3">
      <Link href="/">
        <a className="flex items-center">
          <Image src={logo} alt="Pronouns" width={188} height={22} />
        </a>
      </Link>
      <Search latestId={latestId} />
      {isMultisig ? (
        <div className="flex items-center justify-end gap-x-2">
          <Button onClick={pushPage} type="action" className="w-40">
            Multisig Voting
          </Button>
          <Connect />
        </div>
      ) : (
        <div className="flex items-center justify-end">
          <Connect />
        </div>
      )}
    </div>
  )
}

export default React.memo(Nav)
