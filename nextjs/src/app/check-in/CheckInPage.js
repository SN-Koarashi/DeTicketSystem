'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { CheckCircle, XCircle, QrCode, Wallet } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function CheckInPage() {
    const searchParams = useSearchParams();
    const paymentId = searchParams.get('paymentId') || '';
    const { address, isConnected } = useAccount();
    const [checkInResult, setCheckInResult] = useState(null);
    const [checkInHistory, setCheckInHistory] = useState([]);
    const [ticketIdInput, setTicketIdInput] = useState(paymentId);
    const [isVerifying, setIsVerifying] = useState(false);
    const [txHash, setTxHash] = useState(null);
    const [eventInfo, setEventInfo] = useState(null);
    const [isLoadingEventInfo, setIsLoadingEventInfo] = useState(false);

    useEffect(() => {
        // 載入簽到歷史
        const history = JSON.parse(localStorage.getItem('checkInHistory') || '[]');
        setCheckInHistory(history);
    }, []);

    // 從智慧合約獲取票券對應的活動資訊
    const fetchEventInfo = useCallback(async (paymentId) => {
        try {
            setIsLoadingEventInfo(true);

            // 使用 ethers.js 調用智慧合約
            const { JsonRpcProvider, Contract } = await import('ethers');

            // 從環境變數取得智慧合約地址
            const contractAddress = process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS;

            // 智慧合約 ABI - 新增的 getTicketEventInfo 函數
            const contractABI = [
                {
                    "inputs": [
                        { "internalType": "bytes32", "name": "paymentId", "type": "bytes32" }
                    ],
                    "name": "getTicketEventInfo",
                    "outputs": [
                        { "internalType": "bytes32", "name": "eventId", "type": "bytes32" },
                        { "internalType": "string", "name": "cid", "type": "string" },
                        { "internalType": "bool", "name": "exists", "type": "bool" }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                }
            ];

            // 使用公開的 RPC provider（不需要錢包）
            const provider = new JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');

            // 創建合約實例
            const contract = new Contract(contractAddress, contractABI, provider);

            // 調用 getTicketEventInfo 獲取活動資訊
            const [eventId, cid, exists] = await contract.getTicketEventInfo(paymentId);

            if (!exists || !cid) {
                setEventInfo(null);
                return null;
            }

            // 從後端 API 或 IPFS 獲取活動詳情
            try {
                const response = await fetch('/api/v1/events');
                const data = await response.json();

                // 從所有活動中找到對應 CID 的活動
                const event = data?.data?.find(e => e.cid === cid);

                if (event) {
                    const eventDetails = JSON.parse(event.summary);
                    setEventInfo({
                        eventId: eventId,
                        cid: cid,
                        name: eventDetails.name,
                        date: eventDetails.date,
                        time: eventDetails.time,
                        location: eventDetails.location,
                        category: eventDetails.category,
                        organizer: eventDetails.organizer
                    });
                    return eventDetails;
                }
            } catch (error) {
                console.error('獲取活動詳情失敗:', error);
            }

            // 如果從 API 獲取失敗，至少顯示 CID 和 eventId
            setEventInfo({
                eventId: eventId,
                cid: cid,
                name: '未知活動',
                date: '-',
                time: '-',
                location: '-'
            });

            return { cid, eventId };

        } catch (error) {
            console.error('獲取活動資訊失敗:', error);
            setEventInfo(null);
            return null;
        } finally {
            setIsLoadingEventInfo(false);
        }
    }, []);

    // 當付款識別碼改變時，自動獲取活動資訊
    useEffect(() => {
        const fetchInfo = async () => {
            const inputValue = paymentId || ticketIdInput;
            if (inputValue && inputValue.length === 66 && inputValue.startsWith('0x')) {
                await fetchEventInfo(inputValue.trim());
            } else {
                setEventInfo(null);
            }
        };

        // 使用 debounce 避免頻繁調用
        const timeoutId = setTimeout(fetchInfo, 500);
        return () => clearTimeout(timeoutId);
    }, [ticketIdInput, paymentId, fetchEventInfo]);

    // 處理驗票成功
    const handleVerifySuccess = (ticketId, transactionHash) => {
        const checkIn = {
            ticketId: ticketId,
            checkInTime: new Date().toISOString(),
            verifier: address,
            txHash: transactionHash
        };

        const newHistory = [checkIn, ...checkInHistory];
        localStorage.setItem('checkInHistory', JSON.stringify(newHistory));
        setCheckInHistory(newHistory);

        // 更新本地票券記錄為已使用
        const purchases = JSON.parse(localStorage.getItem('purchases') || '[]');
        let ticketFound = false;
        const updatedPurchases = purchases.map(purchase => {
            if (purchase.tickets && purchase.tickets.length > 0) {
                const updatedTickets = purchase.tickets.map(ticket => {
                    if (ticket.ticketId === ticketId) {
                        ticketFound = true;
                        return { ...ticket, used: true, usedAt: new Date().toISOString() };
                    }
                    return ticket;
                });
                return { ...purchase, tickets: updatedTickets };
            }
            return purchase;
        });

        if (ticketFound) {
            localStorage.setItem('purchases', JSON.stringify(updatedPurchases));
            console.log('票券已標記為已使用');
        }

        setCheckInResult({
            success: true,
            message: '驗票成功！票券已核銷',
            data: checkIn
        });

        setIsVerifying(false);
        setTicketIdInput('');
        setTxHash(null);

        // 5 秒後清除結果
        setTimeout(() => {
            setCheckInResult(null);
        }, 5000);
    };

    // 處理驗票失敗
    const handleVerifyError = (errorMessage) => {
        let message = '驗票失敗';

        if (errorMessage.includes('Only ticket owner')) {
            message = '您不是此票券的擁有者';
        } else if (errorMessage.includes('already used')) {
            message = '此票券已被使用';
        } else if (errorMessage.includes('rejected')) {
            message = '交易被拒絕';
        }

        setCheckInResult({
            success: false,
            message: message,
            error: errorMessage
        });

        setTimeout(() => {
            setCheckInResult(null);
        }, 5000);
    };

    // 調用智慧合約驗票
    const handleVerifyTicket = async () => {
        if (!isConnected) {
            alert('請先連接錢包');
            return;
        }

        if (!ticketIdInput.trim()) {
            alert('請輸入付款識別碼');
            return;
        }

        if (ticketIdInput.trim().length !== 66 || !ticketIdInput.startsWith('0x')) {
            alert('付款識別碼格式錯誤（應為 0x 開頭的 66 字元）');
            return;
        }

        try {
            setIsVerifying(true);
            setCheckInResult(null);

            // 首先獲取活動資訊
            console.log('正在獲取活動資訊...');
            const eventData = await fetchEventInfo(ticketIdInput.trim());

            if (!eventData) {
                throw new Error('無法找到對應的活動資訊，此票券可能不存在');
            }

            console.log('活動資訊:', eventData);

            // 使用 ethers.js 調用智慧合約（與購票頁面相同方式）
            const { BrowserProvider, Contract } = await import('ethers');

            // 從環境變數取得智慧合約地址
            const contractAddress = process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS;

            // 智慧合約 ABI
            const contractABI = [
                {
                    "inputs": [
                        { "internalType": "bytes32", "name": "paymentId", "type": "bytes32" }
                    ],
                    "name": "verifyTicket",
                    "outputs": [
                        { "internalType": "bool", "name": "success", "type": "bool" }
                    ],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ];

            // 獲取 provider 和 signer
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // 創建合約實例
            const contract = new Contract(contractAddress, contractABI, signer);

            // ! 錢包會進行模擬交易，所以這裡應該不需要撰寫 callStatic 了
            // ? 因為合約已經重新部署，改為使用 require 檢查失敗情況而不是直接返回 false
            // // 先使用 callStatic 檢查驗票結果（不實際發送交易）
            // const canVerify = await contract.verifyTicket.staticCall(ticketIdInput.trim());
            // console.log('驗票檢查結果:', canVerify);

            // if (!canVerify) {
            //     throw new Error('驗票失敗：票券可能已被使用或不存在');
            // }

            // 調用 verifyTicket 函數
            const tx = await contract.verifyTicket(ticketIdInput.trim());

            console.log('Transaction sent:', tx.hash);
            setTxHash(tx.hash);

            // 等待交易確認
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt.hash);

            // 驗票成功
            handleVerifySuccess(ticketIdInput.trim(), receipt.hash);

        } catch (err) {
            console.error('驗票錯誤:', err);
            handleVerifyError(err.message);
            setIsVerifying(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-10">
            <div className="max-w-4xl mx-auto">
                {/* 標題 */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold mb-2">活動驗票</h1>
                    <p className="text-gray-400">掃描或輸入付款識別碼進行票券驗證</p>
                    {!isConnected && (
                        <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
                            <p className="text-yellow-400 flex items-center justify-center gap-2">
                                <Wallet size={20} />
                                請先連接錢包才能進行驗票
                            </p>
                        </div>
                    )}
                    {isConnected && (
                        <div className="mt-4 p-3 bg-green-900/20 border border-green-500/50 rounded-lg">
                            <p className="text-green-400 text-sm">
                                已連接: {address?.slice(0, 6)}...{address?.slice(-4)}
                            </p>
                        </div>
                    )}
                </div>

                {/* 掃描/輸入區域 */}
                <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
                    <div className="space-y-6">
                        {/* 掃描器模擬 */}
                        <div className="rounded-xl overflow-hidden">
                            <div className="text-center space-y-4">
                                <QrCode size={120} className="mx-auto text-gray-600" />
                                <p className="text-gray-400">請掃描 QR Code 開啟此頁面</p>
                            </div>
                        </div>

                        {/* 手動輸入 */}
                        <div className="pt-6 border-t border-white/10">
                            <p className="text-sm text-gray-400 mb-3">或手動輸入付款識別碼（bytes32）：</p>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={paymentId || ticketIdInput}
                                    onChange={(e) => setTicketIdInput(e.target.value)}
                                    placeholder="0x..."
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm"
                                    onKeyPress={(e) => e.key === 'Enter' && handleVerifyTicket()}
                                    disabled={!isConnected || isVerifying || paymentId.length > 0}
                                />

                                {/* 活動資訊卡片 */}
                                {isLoadingEventInfo && (
                                    <div className="p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                            <p className="text-blue-400 text-sm">正在獲取活動資訊...</p>
                                        </div>
                                    </div>
                                )}

                                {eventInfo && !isLoadingEventInfo && (
                                    <div className="p-4 bg-purple-900/20 border border-purple-500/50 rounded-lg">
                                        <h3 className="text-lg font-bold text-purple-400 mb-2">活動資訊</h3>
                                        <div className="space-y-1 text-sm">
                                            <p className="text-gray-300">
                                                <span className="text-gray-500">活動名稱：</span>
                                                {eventInfo.name}
                                            </p>
                                            <p className="text-gray-300">
                                                <span className="text-gray-500">日期時間：</span>
                                                {eventInfo.date} {eventInfo.time}
                                            </p>
                                            <p className="text-gray-300">
                                                <span className="text-gray-500">地點：</span>
                                                {eventInfo.location}
                                            </p>
                                            {eventInfo.category && (
                                                <p className="text-gray-300">
                                                    <span className="text-gray-500">分類：</span>
                                                    {eventInfo.category}
                                                </p>
                                            )}
                                            <p className="text-gray-400 text-xs break-all mt-2">
                                                <span className="text-gray-500">CID：</span>
                                                {eventInfo.cid}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleVerifyTicket}
                                    disabled={!isConnected || isVerifying || !ticketIdInput.trim()}
                                    className={`w-full px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${!isConnected || isVerifying || !ticketIdInput.trim()
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                                        }`}
                                >
                                    {isVerifying ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>處理中...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={20} />
                                            <span>驗證票券</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                ⓘ 付款識別碼格式：0x 開頭的 66 字元（包含 0x）
                            </p>
                        </div>
                    </div>
                </div>

                {/* 驗票結果 */}
                {checkInResult && (
                    <div className={`mb-8 p-6 rounded-xl border-2 ${checkInResult.success
                        ? 'bg-green-900/20 border-green-500'
                        : 'bg-red-900/20 border-red-500'
                        }`}>
                        <div className="flex items-start gap-4">
                            {checkInResult.success ? (
                                <CheckCircle size={48} className="text-green-500 flex-shrink-0" />
                            ) : (
                                <XCircle size={48} className="text-red-500 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                                <h3 className={`text-2xl font-bold mb-2 ${checkInResult.success ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    {checkInResult.message}
                                </h3>
                                {checkInResult.success && checkInResult.data && (
                                    <div className="text-sm space-y-1">
                                        <p className="text-gray-300 font-mono text-xs break-all">
                                            票券: {checkInResult.data.ticketId}
                                        </p>
                                        <p className="text-gray-400">
                                            時間：{new Date(checkInResult.data.checkInTime).toLocaleString('zh-TW')}
                                        </p>
                                        {checkInResult.data.txHash && (
                                            <p className="text-gray-400 text-xs break-all">
                                                交易: <a className="underline text-blue-400" href={`https://sepolia.etherscan.io/tx/${checkInResult.data.txHash}`} target="_blank" rel="noopener noreferrer">{checkInResult.data.txHash}</a>
                                            </p>
                                        )}
                                    </div>
                                )}
                                {checkInResult.error && (
                                    <p className="text-xs text-red-300 mt-2 opacity-70 break-all">
                                        {checkInResult.error}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 驗票歷史 */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <CheckCircle size={24} className="text-green-500" />
                        <span>驗票記錄</span>
                    </h2>

                    {checkInHistory.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">尚無驗票記錄</p>
                    ) : (
                        <div className="space-y-3">
                            {checkInHistory.map((record, index) => (
                                <div
                                    key={index}
                                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-400 font-mono break-all">
                                                    {record.ticketId}
                                                </p>
                                            </div>
                                            <div className="text-right text-sm text-gray-400 ml-4">
                                                <p>{new Date(record.checkInTime).toLocaleDateString('zh-TW')}</p>
                                                <p>{new Date(record.checkInTime).toLocaleTimeString('zh-TW')}</p>
                                            </div>
                                        </div>
                                        {record.txHash && (
                                            <p className="text-xs text-gray-500 break-all">
                                                交易: <a className="underline text-blue-400" href={`https://sepolia.etherscan.io/tx/${record.txHash}`} target="_blank" rel="noopener noreferrer">{record.txHash}</a>
                                            </p>
                                        )}
                                        {record.verifier && (
                                            <p className="text-xs text-gray-500">
                                                驗證者: {record.verifier.slice(0, 6)}...{record.verifier.slice(-4)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
