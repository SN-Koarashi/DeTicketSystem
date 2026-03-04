'use client';

import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import {
    metaMaskWallet,
    okxWallet,
    phantomWallet,
    walletConnectWallet,
    uniswapWallet
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';

const connectors = connectorsForWallets(
    [
        {
            groupName: 'Recommended',
            wallets: [metaMaskWallet, okxWallet, phantomWallet, uniswapWallet, walletConnectWallet],
        },
    ],
    {
        appName: 'DeTicket - 去中心化售票平台',
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
        chains: [sepolia],
        ssr: true, // If your dApp uses server side rendering (SSR)
    }
);

export const config = createConfig({
    chains: [sepolia],
    connectors,
    transports: {
        [sepolia.id]: http(),
    },
});