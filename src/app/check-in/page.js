'use client';

import { useState, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, QrCode, Scan } from 'lucide-react';
import { mockEvents } from '@/lib/mockData';

export default function CheckInPage() {
    const [scanning, setScanning] = useState(false);
    const [checkInResult, setCheckInResult] = useState(null);
    const [checkInHistory, setCheckInHistory] = useState([]);
    const [scanInput, setScanInput] = useState('');

    useEffect(() => {
        // 載入簽到歷史
        const history = JSON.parse(localStorage.getItem('mockCheckInHistory') || '[]');
        setCheckInHistory(history);
    }, []);

    // 模擬掃描 QR Code
    const handleScan = () => {
        setScanning(true);

        // 模擬掃描過程
        setTimeout(() => {
            // 從 localStorage 獲取購買記錄
            const purchases = JSON.parse(localStorage.getItem('mockPurchases') || '[]');

            if (purchases.length === 0) {
                setCheckInResult({
                    success: false,
                    message: '找不到票券記錄'
                });
                setScanning(false);
                return;
            }

            // 隨機選一張未使用的票券來模擬掃描
            let foundTicket = null;
            let foundPurchase = null;

            for (const purchase of purchases) {
                const unusedTicket = purchase.tickets.find(t => !t.used);
                if (unusedTicket) {
                    foundTicket = unusedTicket;
                    foundPurchase = purchase;
                    break;
                }
            }

            if (!foundTicket) {
                setCheckInResult({
                    success: false,
                    message: '所有票券都已使用'
                });
                setScanning(false);
                return;
            }

            // 標記票券為已使用
            foundTicket.used = true;
            localStorage.setItem('mockPurchases', JSON.stringify(purchases));

            // 找到對應的活動
            const event = mockEvents.find(e => e.id === foundPurchase.eventId);

            // 記錄簽到
            const checkIn = {
                ticketId: foundTicket.ticketId,
                eventId: foundPurchase.eventId,
                eventName: foundPurchase.eventName,
                checkInTime: new Date().toISOString(),
                location: event?.location || '未知地點'
            };

            const newHistory = [checkIn, ...checkInHistory];
            localStorage.setItem('mockCheckInHistory', JSON.stringify(newHistory));
            setCheckInHistory(newHistory);

            setCheckInResult({
                success: true,
                message: '簽到成功！',
                data: checkIn
            });

            setScanning(false);

            // 3 秒後清除結果
            setTimeout(() => {
                setCheckInResult(null);
            }, 3000);
        }, 1500);
    };

    // 手動輸入票券 ID 簽到
    const handleManualCheckIn = () => {
        if (!scanInput.trim()) {
            alert('請輸入票券 ID');
            return;
        }

        const purchases = JSON.parse(localStorage.getItem('mockPurchases') || '[]');
        let foundTicket = null;
        let foundPurchase = null;

        for (const purchase of purchases) {
            const ticket = purchase.tickets.find(t => t.ticketId === scanInput.trim());
            if (ticket) {
                foundTicket = ticket;
                foundPurchase = purchase;
                break;
            }
        }

        if (!foundTicket) {
            setCheckInResult({
                success: false,
                message: '找不到此票券'
            });
            setTimeout(() => setCheckInResult(null), 3000);
            return;
        }

        if (foundTicket.used) {
            setCheckInResult({
                success: false,
                message: '此票券已被使用'
            });
            setTimeout(() => setCheckInResult(null), 3000);
            return;
        }

        // 標記為已使用
        foundTicket.used = true;
        localStorage.setItem('mockPurchases', JSON.stringify(purchases));

        const event = mockEvents.find(e => e.id === foundPurchase.eventId);

        const checkIn = {
            ticketId: foundTicket.ticketId,
            eventId: foundPurchase.eventId,
            eventName: foundPurchase.eventName,
            checkInTime: new Date().toISOString(),
            location: event?.location || '未知地點'
        };

        const newHistory = [checkIn, ...checkInHistory];
        localStorage.setItem('mockCheckInHistory', JSON.stringify(newHistory));
        setCheckInHistory(newHistory);

        setCheckInResult({
            success: true,
            message: '簽到成功！',
            data: checkIn
        });

        setScanInput('');
        setTimeout(() => setCheckInResult(null), 3000);
    };

    return (
        <div className="container mx-auto px-4 py-10">
            <div className="max-w-4xl mx-auto">
                {/* 標題 */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold mb-2">活動簽到</h1>
                    <p className="text-gray-400">掃描票券 QR Code 進行簽到驗證</p>
                </div>

                {/* 掃描區域 */}
                <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
                    <div className="space-y-6">
                        {/* 掃描器模擬 */}
                        <div className="bg-black rounded-xl overflow-hidden">
                            <div className="aspect-video flex items-center justify-center relative">
                                {scanning ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-64 h-64 border-4 border-blue-500 rounded-lg relative">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-pulse"></div>
                                            <Camera size={80} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4">
                                        <QrCode size={120} className="mx-auto text-gray-600" />
                                        <p className="text-gray-400">點擊下方按鈕開始掃描</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 掃描按鈕 */}
                        <button
                            onClick={handleScan}
                            disabled={scanning}
                            className={`w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-3 ${scanning
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/50'
                                }`}
                        >
                            <Scan size={24} />
                            <span>{scanning ? '掃描中...' : '開始掃描 QR Code'}</span>
                        </button>

                        {/* 手動輸入 */}
                        <div className="pt-6 border-t border-white/10">
                            <p className="text-sm text-gray-400 mb-3">或手動輸入票券 ID：</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={scanInput}
                                    onChange={(e) => setScanInput(e.target.value)}
                                    placeholder="TICKET-xxxxx"
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                    onKeyPress={(e) => e.key === 'Enter' && handleManualCheckIn()}
                                />
                                <button
                                    onClick={handleManualCheckIn}
                                    className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
                                >
                                    確認
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 簽到結果 */}
                {checkInResult && (
                    <div className={`mb-8 p-6 rounded-xl border-2 ${checkInResult.success
                            ? 'bg-green-900/20 border-green-500'
                            : 'bg-red-900/20 border-red-500'
                        }`}>
                        <div className="flex items-center gap-4">
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
                                        <p className="text-gray-300">活動：{checkInResult.data.eventName}</p>
                                        <p className="text-gray-400">
                                            時間：{new Date(checkInResult.data.checkInTime).toLocaleString('zh-TW')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 簽到歷史 */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <CheckCircle size={24} className="text-green-500" />
                        <span>簽到記錄</span>
                    </h2>

                    {checkInHistory.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">尚無簽到記錄</p>
                    ) : (
                        <div className="space-y-3">
                            {checkInHistory.map((record, index) => (
                                <div
                                    key={index}
                                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <h3 className="font-medium">{record.eventName}</h3>
                                            <p className="text-sm text-gray-400 font-mono">{record.ticketId}</p>
                                            <p className="text-xs text-gray-500">{record.location}</p>
                                        </div>
                                        <div className="text-right text-sm text-gray-400">
                                            <p>{new Date(record.checkInTime).toLocaleDateString('zh-TW')}</p>
                                            <p>{new Date(record.checkInTime).toLocaleTimeString('zh-TW')}</p>
                                        </div>
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
