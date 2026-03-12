"use client";

import { formatAddress } from '@/lib/utils';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export default function ConnectView() {
    const { address, isConnected, chain } = useAccount();
    return (
        <>
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-600/30 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h3 className="text-xl font-semibold mb-2">連接錢包</h3>
                        <p className="text-sm text-gray-400">
                            {isConnected
                                ? `已連接到 ${chain?.name || 'Unknown'}，您的地址將成為活動主辦方`
                                : '請先連接錢包並切換到 Sepolia 測試網路'
                            }
                        </p>
                        {isConnected && address && (
                            <p className="text-xs text-gray-500 mt-1">
                                地址: {formatAddress(address)}
                            </p>
                        )}
                    </div>

                    <ConnectButton
                        chainStatus="full"
                        showBalance={false}
                    />
                </div>

                {isConnected && chain?.id !== 11155111 && (
                    <div className="mt-4 p-3 bg-red-600/10 border border-red-600/30 rounded-lg">
                        <p className="text-sm text-red-400">
                            ⚠️ 請切換到 Sepolia 測試網路才能建立活動
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};