'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { calculateABIHash, calculateHash, categories, formatDate, formatTime, verifyEventSignature, verifyEventOnChain } from '@/lib/utils';
import { Calendar, MapPin, Users, Tag, ArrowLeft, ShoppingCart, CheckCircle, XCircle, Shield, AlertTriangle } from 'lucide-react';

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const [purchaseResult, setPurchaseResult] = useState(null);
    const [event, setEvent] = useState(null);
    const [ipfsData, setIpfsData] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseStep, setPurchaseStep] = useState(''); // 'verifying', 'purchasing', 'confirming'
    const [purchaseComplete, setPurchaseComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [verificationStatus, setVerificationStatus] = useState({ isVerified: false, isVerifying: true, error: null });

    useEffect(() => {
        if (params.id) {
            async function fetchEvents() {
                try {
                    const response = await fetch('/ipfs/data/' + params.id);
                    const data = await response.json();

                    return data;
                } catch (error) {
                    console.error('Error fetching events:', error);
                    return null;
                }
            }

            fetchEvents().then(async data => {
                if (data && data.success) {
                    setEvent({
                        ...data.data,
                        id: params.id
                    });

                    setIpfsData(data.data);

                    // 驗證 IPFS 數據簽名
                    setVerificationStatus({ isVerified: false, isVerifying: true, error: null });
                    const verifyResult = await verifyEventSignature(data.data);

                    if (verifyResult.isValid) {
                        setVerificationStatus({ isVerified: true, isVerifying: false, error: null });
                        console.log('✓ IPFS 數據簽名驗證成功');
                    } else {
                        setVerificationStatus({ isVerified: false, isVerifying: false, error: verifyResult.error });
                        console.warn('✗ IPFS 數據簽名驗證失敗:', verifyResult.error);
                    }
                }
            }).finally(() => {
                setIsLoading(false);
            });
        }
    }, [params.id]);

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="min-h-screen">
                <div className="container mx-auto px-4 py-6">
                    <div className="h-6 bg-white/10 rounded w-32 animate-pulse"></div>
                </div>
                <div className="container mx-auto px-4 pb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* 左側骨架屏 */}
                        <div className="space-y-6">
                            <div className="relative h-96 bg-white/10 rounded-xl animate-pulse"></div>
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-4">
                                <div className="h-8 bg-white/10 rounded w-3/4 animate-pulse"></div>
                                <div className="h-6 bg-white/10 rounded w-24 animate-pulse"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-white/10 rounded w-full animate-pulse"></div>
                                    <div className="h-4 bg-white/10 rounded w-5/6 animate-pulse"></div>
                                    <div className="h-4 bg-white/10 rounded w-4/6 animate-pulse"></div>
                                </div>
                                <div className="space-y-3 pt-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-5 h-5 bg-white/10 rounded animate-pulse"></div>
                                            <div className="h-4 bg-white/10 rounded w-48 animate-pulse"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* 右側骨架屏 */}
                        <div>
                            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-6">
                                <div className="h-8 bg-white/10 rounded w-32 animate-pulse"></div>
                                <div className="bg-white/5 rounded-lg p-4 space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex justify-between">
                                            <div className="h-4 bg-white/10 rounded w-20 animate-pulse"></div>
                                            <div className="h-4 bg-white/10 rounded w-24 animate-pulse"></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="h-12 bg-white/10 rounded animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <p className="text-xl text-gray-400">找不到此活動</p>
            </div>
        );
    }

    const totalPrice = (parseInt(event.priceCent) * quantity);

    const handlePurchase = async () => {
        if (!isConnected) {
            alert('請先連接錢包');
            return;
        }

        setIsPurchasing(true);
        setPurchaseStep('verifying');

        try {
            // 步驟 1: 鏈上驗證 - 確保 IPFS 數據與智慧合約記錄一致（防止 IPFS 節點造假）
            console.log('🔍 開始鏈上驗證...');
            const cid = event.id;
            const onChainVerification = await verifyEventOnChain(cid, ipfsData);

            if (!onChainVerification.isValid) {
                alert(`⚠️ 鏈上驗證失敗！\n\n${onChainVerification.error}\n\n此活動數據可能已被篡改，建議不要購買。`);
                setIsPurchasing(false);
                setPurchaseStep('');
                return;
            }

            console.log('✓ 鏈上驗證成功，數據未被篡改');
            const eventId = onChainVerification.eventId;
            console.log('Event ID:', eventId);

            const ticketNonce = Math.floor(Math.random() * 1000000000);
            // 步驟 2: 生成隨機票券 ID (nonce)
            setPurchaseStep('purchasing');
            console.log('Ticket Nonce:', ticketNonce);

            // 步驟 3: 與智慧合約互動（購買票券）
            const { BrowserProvider, Contract } = await import('ethers');

            // 從環境變數取得智慧合約地址
            const contractAddress = process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS;

            // 智慧合約 ABI
            const contractABI = [
                {
                    "inputs": [
                        { "internalType": "uint256", "name": "ticketPriceUSD", "type": "uint256" }
                    ],
                    "name": "calculateRequiredETH",
                    "outputs": [
                        { "internalType": "uint256", "name": "requiredETH", "type": "uint256" }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [
                        { "internalType": "bytes32", "name": "eventId", "type": "bytes32" },
                        { "internalType": "uint256", "name": "ticketNonce", "type": "uint256" }
                    ],
                    "name": "purchaseTicket",
                    "outputs": [
                        { "internalType": "bytes32", "name": "paymentId", "type": "bytes32" }
                    ],
                    "stateMutability": "payable",
                    "type": "function"
                }
            ];

            // 獲取 provider 和 signer
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // 創建合約實例
            const contract = new Contract(contractAddress, contractABI, signer);

            // 步驟 4: 計算需要支付的 ETH 數量
            const ticketPriceUSD = parseInt(event.priceCent); // 價格以美分為單位
            const requiredETH = await contract.calculateRequiredETH(ticketPriceUSD);
            console.log('Required ETH:', requiredETH.toString());

            // 步驟 5: 調用 purchaseTicket 函數（支付計算出的 ETH）
            const tx = await contract.purchaseTicket(eventId, ticketNonce, {
                value: requiredETH
            });

            console.log('Transaction sent:', tx.hash);

            // 步驟 6: 等待交易確認
            setPurchaseStep('confirming');
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt.hash);

            // 從事件日誌中取得 paymentId
            const paymentId = receipt.logs[0].topics[1];
            console.log('Payment ID:', paymentId);

            // 步驟 7: 儲存購票記錄到 localStorage
            const purchaseRecord = {
                id: Date.now().toString(),
                eventId: event.id,
                eventName: event.name,
                paymentId: paymentId,
                transactionHash: receipt.hash,
                quantity: quantity,
                totalPrice: (parseInt(event.priceCent) / 100).toFixed(2) + ' USD',
                purchaseDate: new Date().toISOString(),
                tickets: [
                    {
                        ticketId: paymentId, // 使用 paymentId 作為票券ID
                        used: false,
                        eventId: event.id,
                        buyerAddress: address,
                        nonce: ticketNonce,
                        eventIdHash: eventId
                    }
                ]
            };

            // 讀取現有購買記錄
            const existingPurchases = JSON.parse(localStorage.getItem('purchases') || '[]');
            existingPurchases.push(purchaseRecord);
            localStorage.setItem('purchases', JSON.stringify(existingPurchases));

            // 步驟 8: 購票成功
            setPurchaseComplete(true);

            // 1.5秒後導向「我的票券」頁面
            setTimeout(() => {
                router.push('/my-tickets');
            }, 1500);

        } catch (error) {
            console.error('購票失敗:', error);
            handlePurchaseError(error.message);
        } finally {
            setIsPurchasing(false);
            setPurchaseStep('');
        }
    };

    // 處理購票失敗
    const handlePurchaseError = (errorMessage) => {
        let message = '購票失敗';

        if (errorMessage.includes('Tickets sold out')) {
            message = '票券已售完';
        }

        setPurchaseResult({
            success: false,
            message: message,
            error: errorMessage
        });

        setTimeout(() => {
            setPurchaseResult(null);
        }, 10000);
    };

    if (purchaseComplete) {
        return (
            <div className="container mx-auto px-4 py-20">
                <div className="max-w-2xl mx-auto text-center space-y-6">
                    <CheckCircle size={80} className="mx-auto text-green-500" />
                    <h1 className="text-4xl font-bold">購票成功！</h1>
                    <p className="text-xl text-gray-300">
                        您已成功購買 {quantity} 張票券
                    </p>
                    <p className="text-gray-400">
                        即將導向至「我的票券」頁面...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* 返回按鈕 */}
            <div className="container mx-auto px-4 py-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                    <ArrowLeft size={20} />
                    <span>返回活動列表</span>
                </button>
            </div>

            <div className="container mx-auto px-4 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 左側：活動圖片與資訊 */}
                    <div className="space-y-6">
                        <div className="relative h-96 rounded-xl overflow-hidden">
                            <Image
                                src={event.image && event.image.length > 0 ? event.image : "/placeholder.webp"}
                                alt={event.name}
                                fill
                                className="object-cover"
                            />
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-4">
                            <h1 className="text-3xl font-bold">{event.name}</h1>

                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-3 py-1 bg-blue-600 rounded-full text-sm">
                                    {categories[event.category]}
                                </span>

                                {/* 驗證狀態徽章 */}
                                {verificationStatus.isVerifying ? (
                                    <span className="px-3 py-1 bg-gray-600/50 rounded-full text-sm flex items-center gap-1.5">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                        驗證中...
                                    </span>
                                ) : verificationStatus.isVerified ? (
                                    <span className="px-3 py-1 bg-green-600/80 rounded-full text-sm flex items-center gap-1.5">
                                        <Shield size={14} />
                                        資訊完整性已驗證
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-red-600/80 rounded-full text-sm flex items-center gap-1.5">
                                        <AlertTriangle size={14} />
                                        驗證失敗
                                    </span>
                                )}
                            </div>

                            {/* 驗證失敗警告 */}
                            {!verificationStatus.isVerifying && !verificationStatus.isVerified && (
                                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-red-400 font-medium">⚠️ 數據簽名驗證失敗</p>
                                            <p className="text-red-300 text-sm">
                                                此活動的 IPFS 數據可能已被篡改或損壞，建議謹慎購買。
                                            </p>
                                            {verificationStatus.error && (
                                                <p className="text-red-300/70 text-xs mt-2 break-all">
                                                    錯誤詳情：{verificationStatus.error}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <p className="text-gray-300 text-lg leading-relaxed">
                                {event.description}
                            </p>

                            <div className="space-y-3 pt-4">
                                <div className="flex items-center gap-3 text-gray-300">
                                    <Calendar size={20} className="text-blue-400" />
                                    <span>{formatDate(event.heldAt)} {formatTime(event.heldAt)}</span>
                                </div>

                                <div className="flex items-center gap-3 text-gray-300">
                                    <MapPin size={20} className="text-blue-400" />
                                    <span>{event.location}</span>
                                </div>

                                <div className="flex items-center gap-3 text-gray-300">
                                    <Users size={20} className="text-blue-400" />
                                    <span>最大供應量 {event.totalTickets} 張</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Tag size={20} className="text-blue-400" />
                                    <span className="text-2xl font-bold text-blue-400">
                                        {(event.priceCent / 100).toFixed(2)} $USD
                                    </span>
                                    <span className="text-gray-400">/ 張</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <p className="text-sm text-gray-400 w-full break-all">
                                    主辦單位：{event.organizer}
                                </p>
                                <p className="text-sm text-gray-400 w-full break-all">
                                    單位簽章：{event.signature}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 右側：購票表單 */}
                    <div className="lg:sticky lg:top-24 h-fit">
                        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-6">
                            <h2 className="text-2xl font-bold">購買票券</h2>

                            {!isConnected && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                    <p className="text-yellow-400">請先連接錢包才能購票</p>
                                </div>
                            )}

                            {false ? (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                    <p className="text-red-400 text-center text-lg font-medium">
                                        此活動票券已售完
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* 數量選擇 */}
                                    {/* <div className="space-y-2">
                                        <label className="block text-gray-300">購買數量</label>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-xl transition-colors cursor-pointer"
                                                disabled={quantity <= 1}
                                            >
                                                −
                                            </button>
                                            <span className="text-3xl font-bold w-16 text-center">
                                                {quantity}
                                            </span>
                                            <button
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-xl transition-colors cursor-pointer"
                                                disabled={false}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-400">
                                            最多可購買 {event.totalTickets} 張
                                        </p>
                                    </div> */}

                                    {/* 價格摘要 */}
                                    <div className="bg-white/5 rounded-lg p-4 space-y-2">
                                        <div className="flex justify-between text-gray-300">
                                            <span>單價</span>
                                            <span>{(event.priceCent / 100).toFixed(2)} $USD</span>
                                        </div>
                                        <div className="flex justify-between text-gray-300">
                                            <span>數量</span>
                                            <span>× {quantity}</span>
                                        </div>
                                        <div className="border-t border-white/10 pt-2 mt-2"></div>
                                        <div className="flex justify-between text-xl font-bold">
                                            <span>總計</span>
                                            <span className="text-blue-400">{(totalPrice / 100).toFixed(2)} $USD</span>
                                        </div>
                                    </div>

                                    {/* 驗證警告（如果驗證失敗） */}
                                    {!verificationStatus.isVerifying && !verificationStatus.isVerified && (
                                        <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-3">
                                            <p className="text-yellow-400 text-sm text-center flex items-center justify-center gap-2">
                                                <AlertTriangle size={16} />
                                                資料驗證失敗，購買風險較高
                                            </p>
                                        </div>
                                    )}

                                    {/* 購買按鈕 */}
                                    <button
                                        onClick={handlePurchase}
                                        disabled={!isConnected || isPurchasing || verificationStatus.isVerifying}
                                        className={`w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${!isConnected || isPurchasing || verificationStatus.isVerifying
                                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                            : !verificationStatus.isVerified
                                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white hover:shadow-lg hover:shadow-yellow-500/50 cursor-pointer'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/50 cursor-pointer'
                                            }`}
                                    >
                                        {verificationStatus.isVerifying ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                <span>驗證中...</span>
                                            </>
                                        ) : isPurchasing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                <span>
                                                    {purchaseStep === 'verifying' && '鏈上驗證中...'}
                                                    {purchaseStep === 'purchasing' && '發送交易中...'}
                                                    {purchaseStep === 'confirming' && '等待確認中...'}
                                                    {!purchaseStep && '處理中...'}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart size={20} />
                                                <span>{!verificationStatus.isVerified ? '⚠️ 仍要購買' : '確認購買'}</span>
                                            </>
                                        )}
                                    </button>

                                    {/* 說明文字 */}
                                    <div className="text-sm text-gray-400 space-y-1">
                                        <p>✓ 購買前會驗證鏈上數據</p>
                                        <p>✓ 票券以 NFT 形式發行</p>
                                        <p>✓ 不可轉售或轉移</p>
                                        <p>✓ 區塊鏈存證，防偽造</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* 錯誤或成功訊息顯示 */}
                        {purchaseResult && (
                            <div className={`mt-4 p-6 rounded-xl border-2 ${purchaseResult.success
                                ? 'bg-green-900/20 border-green-500'
                                : 'bg-red-900/20 border-red-500'
                                }`}>
                                <div className="flex items-start gap-4">
                                    {purchaseResult.success ? (
                                        <CheckCircle size={48} className="text-green-500 flex-shrink-0" />
                                    ) : (
                                        <XCircle size={48} className="text-red-500 flex-shrink-0" />
                                    )}
                                    <div className="flex-1">
                                        <h3 className={`text-2xl font-bold mb-2 ${purchaseResult.success ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            {purchaseResult.message}
                                        </h3>
                                        {purchaseResult.error && (
                                            <p className="text-xs text-red-300 mt-2 opacity-70 break-all">
                                                {purchaseResult.error}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
