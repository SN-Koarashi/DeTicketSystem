'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, DollarSign, Users, FileText, Image as ImageIcon, Wallet, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { formatAddress } from '@/lib/utils';

export default function CreateEventPage() {
    const router = useRouter();
    
    // 錢包狀態
    const [walletConnected, setWalletConnected] = useState(false);
    const [walletAddress, setWalletAddress] = useState('');
    
    // 表單狀態
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'concert',
        date: '',
        time: '',
        location: '',
        price: '',
        totalTickets: '',
        image: ''
    });
    
    // 提交狀態
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStep, setSubmitStep] = useState(''); // idle, wallet, ipfs, contract, complete
    const [eventData, setEventData] = useState(null);

    // 連接錢包
    const handleConnectWallet = async () => {
        try {
            // Phase 1: Mock 錢包連接
            const mockAddress = '0x' + Math.random().toString(16).slice(2, 42);
            setWalletAddress(mockAddress);
            setWalletConnected(true);
            localStorage.setItem('mockWalletAddress', mockAddress);
            
            // TODO Phase 3: 真實錢包連接
            // if (typeof window.ethereum !== 'undefined') {
            //     const accounts = await window.ethereum.request({ 
            //         method: 'eth_requestAccounts' 
            //     });
            //     setWalletAddress(accounts[0]);
            //     setWalletConnected(true);
            // }
        } catch (error) {
            console.error('錢包連接失敗:', error);
            alert('錢包連接失敗，請重試');
        }
    };

    // 表單輸入處理
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 上傳圖片 (Mock)
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Mock: 使用 data URL
            const reader = new FileReader();
            reader.onload = (e) => {
                setFormData(prev => ({
                    ...prev,
                    image: e.target.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    // 驗證表單
    const validateForm = () => {
        const required = ['name', 'description', 'date', 'time', 'location', 'price', 'totalTickets'];
        for (const field of required) {
            if (!formData[field]) {
                alert(`請填寫 ${getFieldLabel(field)}`);
                return false;
            }
        }
        
        if (parseFloat(formData.price) <= 0) {
            alert('票價必須大於 0');
            return false;
        }
        
        if (parseInt(formData.totalTickets) <= 0) {
            alert('票券數量必須大於 0');
            return false;
        }
        
        return true;
    };

    // 取得欄位標籤
    const getFieldLabel = (field) => {
        const labels = {
            name: '活動名稱',
            description: '活動描述',
            date: '活動日期',
            time: '活動時間',
            location: '活動地點',
            price: '票價',
            totalTickets: '票券數量'
        };
        return labels[field] || field;
    };

    // 計算 keccak256 hash (Mock)
    const calculateHash = (data) => {
        // Phase 1: Mock hash
        const str = JSON.stringify(data);
        let hash = '0x';
        for (let i = 0; i < 64; i++) {
            hash += Math.floor(Math.random() * 16).toString(16);
        }
        return hash;
        
        // TODO Phase 3: 使用 ethers.js
        // const ethers = require('ethers');
        // return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(data)));
    };

    // 上傳到 IPFS (Mock)
    const uploadToIPFS = async (data) => {
        // Phase 1: Mock IPFS
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockCID = 'Qm' + Math.random().toString(36).slice(2, 48);
        return mockCID;
        
        // TODO Phase 2: 真實 IPFS 上傳
        // const client = create({ url: 'https://ipfs.infura.io:5001' });
        // const { cid } = await client.add(JSON.stringify(data));
        // return cid.toString();
    };

    // 上傳到資料庫 (Mock)
    const uploadToDatabase = async (cid, summary) => {
        // Phase 1: Mock
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // TODO Phase 2: 呼叫 Hono API
        // await fetch('/api/events', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ cid, ...summary })
        // });
    };

    // 智慧合約互動 (Mock)
    const interactWithContract = async (cid, dataHash, organizerAddress) => {
        // Phase 1: Mock
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 計算活動識別碼 (CID + dataHash + organizerAddress 的 hash)
        const eventId = calculateHash({ cid, dataHash, organizerAddress });
        
        return { eventId };
        
        // TODO Phase 3: 真實合約互動
        // const contract = new ethers.Contract(contractAddress, abi, signer);
        // const tx = await contract.createEvent(cid, dataHash, organizerAddress);
        // await tx.wait();
        // const eventId = await contract.getEventId(cid, dataHash, organizerAddress);
        // return { eventId };
    };

    // 提交表單
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!walletConnected) {
            alert('請先連接錢包');
            return;
        }
        
        if (!validateForm()) {
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            // 步驟 1: 準備活動完整資訊
            setSubmitStep('preparing');
            const fullEventData = {
                ...formData,
                organizer: walletAddress,
                createdAt: new Date().toISOString()
            };
            
            // 步驟 2: 上傳到 IPFS
            setSubmitStep('ipfs');
            const cid = await uploadToIPFS(fullEventData);
            console.log('IPFS CID:', cid);
            
            // 步驟 3: 計算資料 hash
            const dataHash = calculateHash(fullEventData);
            console.log('Data Hash:', dataHash);
            
            // 步驟 4: 上傳摘要到傳統資料庫
            setSubmitStep('database');
            const summary = {
                name: formData.name,
                description: formData.description,
                date: formData.date,
                location: formData.location,
                price: formData.price,
                totalTickets: formData.totalTickets,
                image: formData.image
            };
            await uploadToDatabase(cid, summary);
            
            // 步驟 5: 與智慧合約互動
            setSubmitStep('contract');
            const { eventId } = await interactWithContract(cid, dataHash, walletAddress);
            console.log('Event ID:', eventId);
            
            // 步驟 6: 完成
            setSubmitStep('complete');
            setEventData({
                eventId,
                cid,
                dataHash,
                organizer: walletAddress,
                qrData: JSON.stringify({ eventId, cid })
            });
            
        } catch (error) {
            console.error('創建活動失敗:', error);
            alert('創建活動失敗: ' + error.message);
            setIsSubmitting(false);
            setSubmitStep('');
        }
    };

    // 渲染提交進度
    const renderSubmitProgress = () => {
        const steps = [
            { key: 'preparing', label: '準備資料', icon: FileText },
            { key: 'ipfs', label: '上傳至 IPFS', icon: Upload },
            { key: 'database', label: '儲存至資料庫', icon: FileText },
            { key: 'contract', label: '智慧合約上鏈', icon: Wallet },
            { key: 'complete', label: '完成', icon: CheckCircle }
        ];
        
        const currentStepIndex = steps.findIndex(s => s.key === submitStep);
        
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="bg-gray-900 p-8 rounded-2xl max-w-md w-full mx-4 border border-gray-700">
                    <h3 className="text-2xl font-bold mb-6 text-center">創建活動中...</h3>
                    
                    <div className="space-y-4">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isComplete = index < currentStepIndex;
                            const isCurrent = index === currentStepIndex;
                            
                            return (
                                <div 
                                    key={step.key}
                                    className={`flex items-center gap-3 p-3 rounded-lg ${
                                        isCurrent ? 'bg-blue-600/20 border border-blue-600/50' :
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
    };

    // 渲染成功結果
    const renderSuccessResult = () => {
        if (!eventData) return null;
        
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="bg-gray-900 p-8 rounded-2xl max-w-2xl w-full mx-4 border border-gray-700">
                    <div className="text-center mb-6">
                        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        <h3 className="text-3xl font-bold text-green-400">活動創建成功！</h3>
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
                            <div className="bg-white p-6 rounded-lg">
                                <div className="aspect-square bg-gray-200 flex items-center justify-center text-gray-600 text-sm">
                                    QR Code 預覽<br/>
                                    (Phase 2 實作)
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                內含: 活動識別碼、CID
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/events/' + eventData.eventId)}
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            查看活動
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                        >
                            返回首頁
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen py-12 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        創建活動
                    </h1>
                    <p className="text-gray-400">
                        填寫活動資訊，連接錢包後即可創建去中心化活動票券
                    </p>
                </div>

                {/* 錢包連接 */}
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-600/30 rounded-xl p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">連接錢包</h3>
                            <p className="text-sm text-gray-400">
                                {walletConnected 
                                    ? '已連接，您的地址將成為活動主辦方' 
                                    : '請先連接錢包以繼續創建活動'
                                }
                            </p>
                        </div>
                        
                        {!walletConnected ? (
                            <button
                                onClick={handleConnectWallet}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <Wallet size={20} />
                                連接錢包
                            </button>
                        ) : (
                            <div className="px-6 py-3 bg-green-600/20 border border-green-600/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={20} className="text-green-400" />
                                    <span className="text-green-400 font-mono">
                                        {formatAddress(walletAddress)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 表單 */}
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
                                    disabled={!walletConnected}
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
                                    disabled={!walletConnected}
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
                                    disabled={!walletConnected}
                                >
                                    <option value="concert">音樂會</option>
                                    <option value="conference">研討會</option>
                                    <option value="sports">體育</option>
                                    <option value="exhibition">展覽</option>
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
                                            disabled={!walletConnected}
                                        />
                                    </label>
                                    
                                    {formData.image && (
                                        <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-700">
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
                                    disabled={!walletConnected}
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
                                    disabled={!walletConnected}
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
                                        disabled={!walletConnected}
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
                                    票價 (ETH) <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="0.01"
                                        step="0.001"
                                        min="0"
                                        className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                        disabled={!walletConnected}
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
                                        disabled={!walletConnected}
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
                            className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={!walletConnected || isSubmitting}
                            className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-purple-600"
                        >
                            {isSubmitting ? '創建中...' : '創建活動'}
                        </button>
                    </div>
                </form>
            </div>

            {/* 提交進度 Modal */}
            {isSubmitting && submitStep !== 'complete' && renderSubmitProgress()}

            {/* 成功結果 Modal */}
            {submitStep === 'complete' && renderSuccessResult()}
        </div>
    );
}
