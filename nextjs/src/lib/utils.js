import { ethers } from "ethers";

// 格式化日期
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// 格式化時間
export function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 格式化錢包地址
export function formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// 生成 QR Code 資料
export function generateQRData(ticketId, eventId, userAddress) {
    return JSON.stringify({
        ticketId,
        eventId,
        userAddress,
        timestamp: Date.now()
    });
}

// 驗證 QR Code 資料
export function verifyQRData(qrData) {
    try {
        const data = JSON.parse(qrData);
        return data.ticketId && data.eventId && data.userAddress;
    } catch {
        return false;
    }
}

// 計算剩餘票券
export function getRemainingTickets(event) {
    return event.totalTickets - event.soldTickets;
}

// 檢查活動是否已售完
export function isEventSoldOut(event) {
    return event.soldTickets >= event.totalTickets;
}

// 檢查活動是否已過期
export function isEventExpired(event) {
    const eventDate = new Date(`${event.date} ${event.time}`);
    return eventDate < new Date();
}

// 計算 keccak256 hash (使用真實實作)
export const calculateHash = async (data) => {
    const { keccak256, toUtf8Bytes } = ethers;
    return keccak256(toUtf8Bytes(JSON.stringify(data)));
};

export const calculateABIHash = async (cid, contentHash, organizer) => {
    // 對應 Solidity 的 abi.encodePacked
    const packed = ethers.solidityPacked(
        ["string", "bytes32", "address"],
        [cid, contentHash, organizer]
    );

    // 計算 keccak256
    const eventId = ethers.keccak256(packed);

    return eventId;
};

/**
 * 驗證 IPFS 活動數據的簽名
 * @param {Object} ipfsData - 從 IPFS 獲取的完整活動數據
 * @returns {Promise<Object>} - { isValid: boolean, error?: string }
 */
export const verifyEventSignature = async (ipfsData) => {
    try {
        // 檢查必要欄位
        if (!ipfsData.signature || !ipfsData.signedDataHash || !ipfsData.organizer) {
            return {
                isValid: false,
                error: '缺少必要的驗證欄位（signature, signedDataHash, organizer）'
            };
        }

        // 提取簽名相關數據
        const { signature, signedDataHash, organizer, name, createdAt, ...dataToVerify } = ipfsData;

        // 重新計算數據 hash（排除簽名本身）
        const calculatedHash = await calculateHash(dataToVerify);

        // 檢查 hash 是否匹配
        if (calculatedHash !== signedDataHash) {
            return {
                isValid: false,
                error: '數據 hash 不匹配，數據可能已被篡改'
            };
        }

        // 重建簽名時的訊息
        const message = `我確認創建以下活動:\n\n活動名稱: ${name}\n數據 Hash: ${signedDataHash}\n時間戳: ${createdAt}`;

        // 驗證簽名
        const recoveredAddress = ethers.verifyMessage(message, signature);

        // 檢查簽名者是否為主辦方
        if (recoveredAddress.toLowerCase() !== organizer.toLowerCase()) {
            return {
                isValid: false,
                error: '簽名無效，簽名者與主辦方地址不符'
            };
        }

        return { isValid: true };

    } catch (error) {
        console.error('簽名驗證失敗:', error);
        return {
            isValid: false,
            error: `驗證過程發生錯誤: ${error.message}`
        };
    }
};

export const categories = {
    all: '全部',
    music: '音樂',
    education: '教育',
    art: '藝術',
    business: '商業',
    technology: '科技',
    other: '其他'
};