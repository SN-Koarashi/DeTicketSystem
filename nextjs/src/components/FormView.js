import { Calendar, MapPin, DollarSign, Users, FileText, Image as ImageIcon, Wallet, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
export default function FormView({
    formData = {},
    handleInputChange = () => { },
    handleImageUpload = () => { },
    handleSubmit = () => { },
    isSubmitting = false
}) {
    const router = useRouter();
    const { isConnected, chain } = useAccount();
    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 基本資訊 */}
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <FileText size={24} className="text-blue-400" />
                        基本資訊
                    </h3>

                    <div className="space-y-4">
                        {/* 活動名稱 */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                活動名稱 <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="例：2024 台北音樂節"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                disabled={!isConnected || chain?.id !== 11155111}
                                required
                            />
                        </div>

                        {/* 活動描述 */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                活動描述 <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="詳細描述您的活動..."
                                rows={4}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                disabled={!isConnected || chain?.id !== 11155111}
                                required
                            />
                        </div>

                        {/* 活動分類 */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                活動分類
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                disabled={!isConnected || chain?.id !== 11155111}
                            >
                                <option value="technology">科技</option>
                                <option value="music">音樂</option>
                                <option value="education">教育</option>
                                <option value="art">藝術</option>
                                <option value="business">商業</option>
                                <option value="other">其他</option>
                            </select>
                        </div>

                        {/* 活動圖片 */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                活動圖片
                            </label>
                            <div className="flex items-center gap-4">
                                <label className="flex-1 cursor-pointer">
                                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 transition-colors">
                                        <ImageIcon size={20} />
                                        <span>
                                            {formData.image ? '已選擇圖片' : '選擇圖片'}
                                        </span>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        disabled={!isConnected || chain?.id !== 11155111}
                                    />
                                </label>

                                {formData.image && (
                                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-700">
                                        { /* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={formData.image}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 時間地點 */}
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Calendar size={24} className="text-purple-400" />
                        時間與地點
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                        {/* 日期 */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                活動日期 <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                disabled={!isConnected || chain?.id !== 11155111}
                                required
                            />
                        </div>

                        {/* 時間 */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                活動時間 <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="time"
                                name="time"
                                value={formData.time}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                disabled={!isConnected || chain?.id !== 11155111}
                                required
                            />
                        </div>

                        {/* 地點 */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">
                                活動地點 <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    placeholder="例：台北市信義區市府路 1 號"
                                    className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                    disabled={!isConnected || chain?.id !== 11155111}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 票券設定 */}
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <DollarSign size={24} className="text-green-400" />
                        票券設定
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                        {/* 票價 */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                票價 (¢ Cents) <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type="number"
                                    name="priceCent"
                                    value={formData.priceCent}
                                    onChange={handleInputChange}
                                    placeholder="1"
                                    step="1"
                                    min="0"
                                    className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                    disabled={!isConnected || chain?.id !== 11155111}
                                    required
                                />
                            </div>
                        </div>

                        {/* 票券數量 */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                票券數量 <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type="number"
                                    name="totalTickets"
                                    value={formData.totalTickets}
                                    onChange={handleInputChange}
                                    placeholder="100"
                                    min="1"
                                    className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                    disabled={!isConnected || chain?.id !== 11155111}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* 收益分潤說明 */}
                    <div className="mt-4 p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                        <p className="text-sm text-blue-300">
                            💡 收益分潤：主辦方獲得 75%，平台獲得 25%
                        </p>
                    </div>
                </div>

                {/* 提交按鈕 */}
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors cursor-pointer"
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        disabled={!isConnected || chain?.id !== 11155111 || isSubmitting}
                        className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-purple-600"
                    >
                        {isSubmitting ? '處理中...' : '建立活動'}
                    </button>
                </div>
            </form>
        </>
    );
}