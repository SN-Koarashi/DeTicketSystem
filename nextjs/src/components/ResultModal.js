"use client";

import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import QRCode from "react-qr-code";

export default function Modal({
    eventData
}) {
    const router = useRouter();

    if (!eventData) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-6 rounded-2xl max-w-2xl w-full mx-4 border border-gray-700" style={{
                overflowY: "auto",
                maxHeight: "100vh"
            }}>
                <div className="text-center mb-4 flex flex-row items-center gap-4 justify-center">
                    <CheckCircle className="w-16 h-16 text-green-400" />
                    <h3 className="text-3xl font-bold text-green-400">活動建立成功</h3>
                </div>

                <div className="space-y-4 bg-gray-800 p-6 rounded-xl mb-6">
                    <div>
                        <label className="text-sm text-gray-400">活動識別碼</label>
                        <p className="text-sm font-mono bg-gray-900 p-3 rounded mt-1 break-all">
                            {eventData.eventId}
                        </p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-400">IPFS CID</label>
                        <p className="text-sm font-mono bg-gray-900 p-3 rounded mt-1 break-all">
                            {eventData.cid}
                        </p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-400">主辦者地址</label>
                        <p className="text-sm font-mono bg-gray-900 p-3 rounded mt-1 break-all">
                            {eventData.organizer}
                        </p>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                        <label className="text-sm text-gray-400 mb-2 block">活動 QR Code 資料</label>
                        <div className="bg-white p-2 rounded-lg w-[212px] mx-auto">
                            <div className="aspect-square bg-gray-200 flex items-center justify-center text-gray-600 text-sm">
                                <QRCode
                                    value={location.origin + '/events/' + eventData.cid}
                                    size={200}
                                    level="H"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            {location.origin + '/events/' + eventData.cid}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => router.push('/events/' + eventData.cid)}
                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
                    >
                        查看活動
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors cursor-pointer"
                    >
                        返回首頁
                    </button>
                </div>
            </div>
        </div >
    );
}