"use client";

import { FileText, Wallet, Upload, CheckCircle, Loader2, Pin } from 'lucide-react';

export default function Modal({
    submitStep = "idle"
}) {
    const steps = [
        { key: 'signing', label: '簽署訊息', icon: Wallet },
        { key: 'preparing', label: '準備資料', icon: FileText },
        { key: 'ipfs', label: '暫存至 IPFS', icon: Upload },
        { key: 'contract', label: '智慧合約上鏈', icon: Wallet },
        { key: 'ipfs-pin', label: '持久化 IPFS 資料', icon: Pin },
        { key: 'database', label: '儲存至資料庫', icon: FileText },
        { key: 'complete', label: '完成', icon: CheckCircle }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === submitStep);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-8 rounded-2xl max-w-md w-full mx-4 border border-gray-700">
                <h3 className="text-2xl font-bold mb-6 text-center">活動建立中...</h3>

                <div className="space-y-4">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isComplete = index < currentStepIndex;
                        const isCurrent = index === currentStepIndex;

                        return (
                            <div
                                key={step.key}
                                className={`flex items-center gap-3 p-3 rounded-lg ${isCurrent ? 'bg-blue-600/20 border border-blue-600/50' :
                                    isComplete ? 'bg-green-600/20 border border-green-600/50' :
                                        'bg-gray-800 border border-gray-700'
                                    }`}
                            >
                                {isCurrent ? (
                                    <Loader2 className="animate-spin text-blue-400" size={20} />
                                ) : isComplete ? (
                                    <CheckCircle className="text-green-400" size={20} />
                                ) : (
                                    <Icon className="text-gray-500" size={20} />
                                )}

                                <span className={
                                    isCurrent ? 'text-blue-400 font-medium' :
                                        isComplete ? 'text-green-400' :
                                            'text-gray-500'
                                }>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}