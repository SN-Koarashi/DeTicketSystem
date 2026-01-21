'use client';

import { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { formatAddress } from '@/lib/utils';

export default function WalletConnect() {
    const [isConnected, setIsConnected] = useState(false);
    const [address, setAddress] = useState(null);

    // Mock 連接錢包功能（Phase 1 不真正連接）
    const handleConnect = async () => {
        try {
            // 模擬錢包連接
            const mockAddress = '0x' + Math.random().toString(16).slice(2, 42);
            setAddress(mockAddress);
            setIsConnected(true);

            // 儲存到 localStorage
            localStorage.setItem('mockWalletAddress', mockAddress);
        } catch (error) {
            console.error('連接錢包失敗:', error);
        }
    };

    const handleDisconnect = () => {
        setAddress(null);
        setIsConnected(false);
        localStorage.removeItem('mockWalletAddress');
    };

    // 頁面載入時檢查是否已連接
    return (
        <div className="flex items-center gap-4">
            {!isConnected ? (
                <button
                    onClick={handleConnect}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <Wallet size={20} />
                    <span>連接錢包</span>
                </button>
            ) : (
                <div className="flex items-center gap-2">
                    <div className="px-4 py-2 bg-green-600/20 border border-green-600/50 rounded-lg">
                        <span className="text-green-400">{formatAddress(address)}</span>
                    </div>
                    <button
                        onClick={handleDisconnect}
                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 rounded-lg transition-colors"
                    >
                        斷開
                    </button>
                </div>
            )}
        </div>
    );
};