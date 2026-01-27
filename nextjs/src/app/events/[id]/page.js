'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { mockEvents } from '@/lib/mockData';
import { calculateABIHash, calculateHash, formatDate, getRemainingTickets, isEventSoldOut } from '@/lib/utils';
import { Calendar, MapPin, Users, Tag, ArrowLeft, ShoppingCart, CheckCircle } from 'lucide-react';

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const [event, setEvent] = useState(null);
    const [ipfsData, setIpfsData] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseComplete, setPurchaseComplete] = useState(false);

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

            fetchEvents().then(data => {
                if (data && data.success) {
                    setEvent({
                        ...data.data,
                        id: params.id
                    });

                    setIpfsData(data.data);
                }
            });
        }
    }, [params.id]);

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

        const cid = event.id;
        const dataHash = await calculateHash(ipfsData);
        const organizer = ipfsData.organizer;

        const eventId = await calculateABIHash(cid, dataHash, organizer);


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
                                src={event.image}
                                alt={event.name}
                                fill
                                className="object-cover"
                            />
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-4">
                            <h1 className="text-3xl font-bold">{event.name}</h1>

                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-blue-600 rounded-full text-sm">
                                    {event.category}
                                </span>
                            </div>

                            <p className="text-gray-300 text-lg leading-relaxed">
                                {event.description}
                            </p>

                            <div className="space-y-3 pt-4">
                                <div className="flex items-center gap-3 text-gray-300">
                                    <Calendar size={20} className="text-blue-400" />
                                    <span>{formatDate(event.date)} {event.time}</span>
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
                                        {event.price} $USD
                                    </span>
                                    <span className="text-gray-400">/ 張</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <p className="text-sm text-gray-400">
                                    主辦單位：{event.organizer}
                                </p>
                                <p className="text-sm text-gray-400 w-100 break-all">
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
                                            <span>{event.priceCent}  ¢ Cents</span>
                                        </div>
                                        <div className="flex justify-between text-gray-300">
                                            <span>數量</span>
                                            <span>× {quantity}</span>
                                        </div>
                                        <div className="border-t border-white/10 pt-2 mt-2"></div>
                                        <div className="flex justify-between text-xl font-bold">
                                            <span>總計</span>
                                            <span className="text-blue-400">{totalPrice}  ¢ Cents</span>
                                        </div>
                                    </div>

                                    {/* 購買按鈕 */}
                                    <button
                                        onClick={handlePurchase}
                                        disabled={!isConnected || isPurchasing}
                                        className={`w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${!isConnected || isPurchasing
                                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/50 cursor-pointer'
                                            }`}
                                    >
                                        {isPurchasing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                <span>處理中...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart size={20} />
                                                <span>確認購買</span>
                                            </>
                                        )}
                                    </button>

                                    {/* 說明文字 */}
                                    <div className="text-sm text-gray-400 space-y-1">
                                        <p>✓ 票券以 NFT 形式發行</p>
                                        <p>✓ 不可轉售或轉移</p>
                                        <p>✓ 區塊鏈存證，防偽造</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
