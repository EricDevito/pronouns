import type { AppProps } from 'next/app'
import Head from 'next/head'
import PlausibleProvider from 'next-plausible'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultWallets, darkTheme } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config.js'
import 'styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()
const styleConfig = resolveConfig(tailwindConfig)
const { publicClient: provider, webSocketPublicClient: webSocketProvider } = configureChains(
  [mainnet],
  [alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? '' }), publicProvider()]
)

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ''
const { connectors } = getDefaultWallets({
  appName: 'Pronouns',
  projectId,
  chains: [mainnet],
})

const wagmiClient = createConfig({
  autoConnect: true,
  connectors: connectors,
  publicClient: provider,
  webSocketPublicClient: webSocketProvider,
})

const App = ({ Component, pageProps }: AppProps) => (
  <>
    <Head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=5" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="theme-color" content="#ffffff" />
      <meta name="title" content="Pronouns | The Nouns interface for power users" />
      <meta name="description" content="The Nouns interface for power users." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://pronouns.gg/" />
      <meta property="og:title" content="Pronouns | The Nouns interface for power users" />
      <meta property="og:description" content="The Nouns interface for power users." />
      <meta property="og:image" content="https://pronouns.gg/pronouns-header.png" />
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content="https://pronouns.gg/" />
      <meta property="twitter:title" content="The Nouns interface for power users." />
      <meta property="twitter:description" content="The Nouns interface for power users." />
      <meta property="twitter:image" content="https://pronouns.gg/pronouns-header.png" />
      <title>Pronouns | The Nouns interface for power users</title>
      <link rel="shortcut icon" href="/favicon.ico" />
    </Head>
    <PlausibleProvider domain="pronouns.gg">
      <QueryClientProvider client={queryClient}>
        <WagmiConfig config={wagmiClient}>
          <RainbowKitProvider
            theme={darkTheme({
              // @ts-ignore
              accentColor: styleConfig?.theme?.colors?.white,
              // @ts-ignore
              accentColorForeground: styleConfig?.theme?.colors?.ui?.black,
              fontStack: 'system',
            })}
            chains={[mainnet]}
          >
            <Component {...pageProps} />
          </RainbowKitProvider>
        </WagmiConfig>
      </QueryClientProvider>
    </PlausibleProvider>
  </>
)

export default App
