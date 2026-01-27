'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Ticket, Calendar, MapPin, QrCode } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { mockEvents } from '@/lib/mockData';
import Link from 'next/link';

export default function MyTicketsPage() {
    const { address, isConnected } = useAccount();
    const [purchases, setPurchases] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPurchases() {
            setLoading(true);

            // 方法1: 從 localStorage 讀取購買記錄 (當前實作)
            const savedPurchases = JSON.parse(localStorage.getItem('purchases') || '[]');

            // 合併活動資訊
            const purchasesWithEvents = savedPurchases.map(purchase => {
                const event = mockEvents.find(e => e.id === purchase.eventId);
                return { ...purchase, event };
            });

            setPurchases(purchasesWithEvents);
            setLoading(false);
        }

        loadPurchases();
    }, [address, isConnected]);

    const showQRCode = (ticket, purchase) => {
        setSelectedTicket({ ticket, purchase });
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                    <p className="mt-4 text-gray-400">載入中...</p>
                </div>
            </div>
        );
    }

    if (purchases.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20">
                <div className="text-center space-y-4">
                    <Ticket size={80} className="mx-auto text-gray-600" />
                    <h1 className="text-3xl font-bold">您還沒有任何票券</h1>
                    <p className="text-gray-400">購買活動票券後，將會顯示在這裡</p>
                    <Link
                        href="/"
                        className="inline-block mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        瀏覽活動
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-10">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">我的票券</h1>
                <p className="text-gray-400">您購買的所有活動票券</p>
            </div>

            <div className="space-y-6">
                {purchases.map(purchase => (
                    <div
                        key={purchase.id}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden"
                    >
                        <div className="p-6">
                            {/* 活動資訊 */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold">{purchase.eventName}</h2>
                                    {purchase.event && (
                                        <>
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <Calendar size={16} />
                                                <span>{formatDate(purchase.event.date)} {purchase.event.time}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <MapPin size={16} />
                                                <span>{purchase.event.location}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-400">購買日期</p>
                                    <p className="text-gray-300">
                                        {new Date(purchase.purchaseDate).toLocaleDateString('zh-TW')}
                                    </p>
                                </div>
                            </div>

                            {/* 票券列表 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {purchase.tickets.map((ticket, index) => (
                                    <div
                                        key={ticket.ticketId}
                                        className={`bg-gradient-to-br from-blue-900/30 to-purple-900/30 border rounded-lg p-4 ${ticket.used
                                            ? 'border-gray-600 opacity-50'
                                            : 'border-blue-500/50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-gray-400">
                                                票券 #{index + 1}
                                            </span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${ticket.used
                                                ? 'bg-gray-600 text-gray-300'
                                                : 'bg-green-600 text-white'
                                                }`}>
                                                {ticket.used ? '已使用' : '未使用'}
                                            </span>
                                        </div>

                                        <p className="text-xs text-gray-400 mb-3 font-mono break-all">
                                            {ticket.ticketId}
                                        </p>

                                        {!ticket.used && (
                                            <button
                                                onClick={() => showQRCode(ticket, purchase)}
                                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                            >
                                                <QrCode size={16} />
                                                <span>顯示 QR Code</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* 總計資訊 */}
                            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
                                <span className="text-gray-400">總計</span>
                                <span className="font-medium">
                                    {purchase.quantity} 張票券 · {purchase.totalPrice} ETH
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* QR Code 彈窗 */}
            {selectedTicket && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedTicket(null)}
                >
                    <div
                        className="bg-gray-900 rounded-xl p-8 max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-2xl font-bold mb-4 text-center">
                            {selectedTicket.purchase.eventName}
                        </h3>

                        {/* QR Code 佔位（實際需要 QR Code 生成庫） */}
                        <div className="bg-white p-8 rounded-lg mb-4">
                            <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                                <QrCode size={200} className="text-gray-400" />
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-400 mb-6">
                            <p>票券 ID: {selectedTicket.ticket.ticketId}</p>
                            <p className="text-center text-xs">
                                請在活動現場出示此 QR Code 進行簽到
                            </p>
                        </div>

                        <button
                            onClick={() => setSelectedTicket(null)}
                            className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            關閉
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
