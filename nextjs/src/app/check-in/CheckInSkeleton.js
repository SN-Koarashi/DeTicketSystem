export default function CheckInSkeleton() {
    return (
        <div className="container mx-auto px-4 py-10">
            <div className="max-w-4xl mx-auto">
                {/* 標題區域 skeleton */}
                <div className="mb-8 text-center">
                    <div className="h-10 w-48 bg-white/10 rounded-lg mx-auto mb-2 animate-pulse"></div>
                    <div className="h-5 w-64 bg-white/10 rounded mx-auto animate-pulse"></div>

                    {/* 錢包狀態 skeleton */}
                    <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                        <div className="h-5 w-40 bg-white/10 rounded mx-auto animate-pulse"></div>
                    </div>
                </div>

                {/* 掃描/輸入區域 skeleton */}
                <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
                    <div className="space-y-6">
                        {/* QR Code 區域 skeleton */}
                        <div className="rounded-xl overflow-hidden">
                            <div className="text-center space-y-4">
                                <div className="w-[120px] h-[120px] bg-white/10 rounded-lg mx-auto animate-pulse"></div>
                                <div className="h-4 w-48 bg-white/10 rounded mx-auto animate-pulse"></div>
                            </div>
                        </div>

                        {/* 輸入區域 skeleton */}
                        <div className="pt-6 border-t border-white/10">
                            <div className="h-4 w-64 bg-white/10 rounded mb-3 animate-pulse"></div>
                            <div className="space-y-3">
                                {/* 輸入框 skeleton */}
                                <div className="w-full h-12 bg-white/5 border border-white/10 rounded-lg animate-pulse"></div>

                                {/* 按鈕 skeleton */}
                                <div className="w-full h-12 bg-white/10 rounded-lg animate-pulse"></div>
                            </div>
                            <div className="h-3 w-96 bg-white/10 rounded mt-2 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* 驗票記錄區域 skeleton */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    {/* 標題 skeleton */}
                    <div className="mb-4 flex items-center gap-2">
                        <div className="w-6 h-6 bg-white/10 rounded-full animate-pulse"></div>
                        <div className="h-7 w-32 bg-white/10 rounded animate-pulse"></div>
                    </div>

                    {/* 記錄列表 skeleton */}
                    <div className="space-y-3">
                        {[1, 2, 3].map((index) => (
                            <div
                                key={index}
                                className="bg-white/5 border border-white/10 rounded-lg p-4"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="h-4 w-full bg-white/10 rounded animate-pulse"></div>
                                        </div>
                                        <div className="text-right ml-4 space-y-1">
                                            <div className="h-4 w-24 bg-white/10 rounded animate-pulse"></div>
                                            <div className="h-4 w-20 bg-white/10 rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="h-3 w-3/4 bg-white/10 rounded animate-pulse"></div>
                                    <div className="h-3 w-1/2 bg-white/10 rounded animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
