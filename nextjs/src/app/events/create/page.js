'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import ConnectView from '@/components/ConnectView';
import FormView from '@/components/FormView';
import ProgressModal from '@/components/ProgressModal';
import ResultModal from '@/components/ResultModal';

export default function CreateEventPage() {
    // Wagmi hooks
    const { address, isConnected, chain } = useAccount();
    const { signMessageAsync } = useSignMessage();

    // 表單狀態
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'technology',
        date: '',
        time: '',
        location: '',
        priceCent: '',
        totalTickets: '',
        image: ''
    });


    // 提交狀態
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStep, setSubmitStep] = useState(''); // idle, signing, preparing, ipfs, database, contract, complete
    const [eventData, setEventData] = useState(null);
    const [signature, setSignature] = useState('');

    // 檢查網路
    useEffect(() => {
        if (isConnected && chain?.id !== 11155111) { // Sepolia chain ID
            alert('請切換到 Sepolia 測試網路');
        }
    }, [isConnected, chain]);

    // 表單輸入處理
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 上傳圖片
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 檢查檔案大小（10MB = 10 * 1024 * 1024 bytes）
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('圖片大小不能超過 10MB');
            e.target.value = ''; // 清空 input
            return;
        }

        try {
            // 讀取圖片
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (readerEvent) => {
                img.onload = () => {
                    // 建立 canvas 進行壓縮
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // 設定 canvas 尺寸為原始圖片尺寸
                    canvas.width = img.width;
                    canvas.height = img.height;

                    // 繪製圖片到 canvas
                    ctx.drawImage(img, 0, 0);

                    // 轉換為 webp 格式，品質 0.75
                    const compressedDataUrl = canvas.toDataURL('image/webp', 0.75);

                    // 更新狀態
                    setFormData(prev => ({
                        ...prev,
                        image: compressedDataUrl
                    }));
                };

                img.src = readerEvent.target.result;
            };

            reader.readAsDataURL(file);
        } catch (error) {
            console.error('圖片處理失敗:', error);
            alert('圖片處理失敗，請重試');
        }
    };

    // 驗證表單
    const validateForm = () => {
        const required = ['name', 'description', 'date', 'time', 'location', 'priceCent', 'totalTickets'];
        for (const field of required) {
            if (!formData[field]) {
                alert(`請填寫 ${getFieldLabel(field)}`);
                return false;
            }
        }

        if (parseInt(formData.priceCent) <= 0) {
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
            priceCent: '票價',
            totalTickets: '票券數量'
        };
        return labels[field] || field;
    };

    // 計算 keccak256 hash (使用真實實作)
    const calculateHash = async (data) => {
        const { keccak256, toUtf8Bytes } = await import('ethers');
        return keccak256(toUtf8Bytes(JSON.stringify(data)));
    };

    // 上傳到 IPFS
    const uploadToIPFS = async (data) => {
        const jsonData = JSON.stringify(data);
        const response = await fetch('/ipfs/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: jsonData,
        });

        if (response.ok === false) {
            throw new Error(result.error || 'Failed to upload data to IPFS');
        }

        const result = await response.json();

        return result?.cid;
    };

    // 上傳到資料庫
    const uploadToDatabase = async (cid, summary) => {
        const jsonData = JSON.stringify({ cid, summary });
        const response = await fetch('/api/v1/events/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: jsonData,
        });
        const result = await response.json();

        if (!result.success || response.ok === false) {
            throw new Error(result.error || 'Failed to upload event to database');
        }

        await new Promise(resolve => setTimeout(resolve, 500));
    };

    // 智慧合約互動 (Mock)
    const interactWithContract = async (cid, dataHash, organizerAddress) => {
        await new Promise(resolve => setTimeout(resolve, 20000));
        const eventId = await calculateHash({ cid, dataHash, organizerAddress });
        return { eventId };
    };

    // 提交表單
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isConnected) {
            alert('請先連接錢包');
            return;
        }

        if (chain?.id !== 11155111) {
            alert('請切換到 Sepolia 測試網路');
            return;
        }

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // 步驟 1: 簽署訊息確認主辦方身份
            setSubmitStep('signing');
            const message = `我確認創建活動: ${formData.name}\n時間: ${new Date().toISOString()}`;
            const sig = await signMessageAsync({ message });
            setSignature(sig);
            console.log('Signature:', sig);

            // 步驟 2: 準備活動完整資訊
            setSubmitStep('preparing');
            const fullEventData = {
                ...formData,
                organizer: address,
                signature: sig,
                createdAt: new Date().toISOString()
            };

            // 步驟 3: 上傳到 IPFS
            setSubmitStep('ipfs');
            const cid = await uploadToIPFS(fullEventData);
            console.log('IPFS CID:', cid);

            // 步驟 4: 計算資料 hash
            const dataHash = await calculateHash(fullEventData);
            console.log('Data Hash:', dataHash);

            // 步驟 5: 上傳摘要到傳統資料庫
            setSubmitStep('database');
            const summary = {
                name: formData.name,
                description: formData.description.substring(0, 60) + '...',
                date: formData.date,
                location: formData.location,
                priceCent: formData.priceCent,
                image: formData.image
            };
            await uploadToDatabase(cid, summary);

            // 步驟 6: 與智慧合約互動
            setSubmitStep('contract');
            const { eventId } = await interactWithContract(cid, dataHash, address);
            console.log('Event ID:', eventId);

            // 步驟 7: 完成
            setSubmitStep('complete');
            setEventData({
                eventId,
                cid,
                dataHash,
                organizer: address,
                signature: sig,
                qrData: JSON.stringify({ eventId, cid })
            });

        } catch (error) {
            console.error('創建活動失敗:', error);
            alert('創建活動失敗: ' + error.message);
            setIsSubmitting(false);
            setSubmitStep('');
        }
    };

    return (
        <div className="min-h-screen py-12 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        建立活動
                    </h1>
                    <p className="text-gray-400">
                        填寫活動資訊，連接錢包後即可創建去中心化活動票券
                    </p>
                </div>

                {/* 錢包連接 */}
                <ConnectView />

                {/* 表單 */}
                <FormView
                    formData={formData}
                    handleInputChange={handleInputChange}
                    handleImageUpload={handleImageUpload}
                    handleSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            </div>

            {/* 提交進度 Modal */}
            {isSubmitting && submitStep !== 'complete' && <ProgressModal submitStep={submitStep} />}

            {/* 成功結果 Modal */}
            {submitStep === 'complete' && <ResultModal eventData={eventData} />}
        </div>
    );
}
