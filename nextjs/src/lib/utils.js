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
        const { signature, signedDataHash, organizer, name, createdAt } = ipfsData;

        let dataToVerify = Object.assign({}, ipfsData); // 複製數據以便修改
        delete dataToVerify.signedDataHash; // 排除簽名欄位
        delete dataToVerify.signature; // 排除簽名欄位

        // 重新計算數據 hash（排除簽名本身）
        const calculatedHash = await calculateHash(dataToVerify);

        // 檢查 hash 是否匹配
        if (calculatedHash !== signedDataHash) {
            return {
                isValid: false,
                error: '數據 hash 不匹配，數據可能已被篡改'
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

/**
 * 驗證 IPFS 數據與智慧合約記錄的一致性（鏈上驗證）
 * 這是防止 IPFS 節點造假的唯一可靠方式
 * 
 * @param {string} cid - IPFS CID
 * @param {Object} ipfsData - 從 IPFS 獲取的完整活動數據
 * @returns {Promise<Object>} - { isValid: boolean, error?: string, eventId?: string }
 */
export const verifyEventOnChain = async (cid, ipfsData) => {
    try {
        // 檢查必要欄位
        if (!ipfsData.signedDataHash || !ipfsData.organizer) {
            return {
                isValid: false,
                error: '缺少必要欄位（signedDataHash, organizer）'
            };
        }

        const { signedDataHash, organizer } = ipfsData;

        // 計算 eventId（與合約中的計算方式相同）
        const eventId = await calculateABIHash(cid, signedDataHash, organizer);

        // 連接智慧合約
        const { BrowserProvider, Contract } = ethers;
        const contractAddress = process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS;

        // 智慧合約 ABI（只需要 getEventInfo 函數）
        const contractABI = [
            {
                "inputs": [
                    { "internalType": "bytes32", "name": "eventId", "type": "bytes32" }
                ],
                "name": "getEventInfo",
                "outputs": [
                    { "internalType": "address", "name": "organizer", "type": "address" },
                    { "internalType": "uint256", "name": "ticketsSold", "type": "uint256" },
                    { "internalType": "uint256", "name": "maxTicketSupply", "type": "uint256" },
                    { "internalType": "uint256", "name": "ticketPriceUSD", "type": "uint256" },
                    { "internalType": "bool", "name": "exists", "type": "bool" }
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ];

        // 獲取 provider（只讀，不需要 signer）
        const provider = new BrowserProvider(window.ethereum);
        const contract = new Contract(contractAddress, contractABI, provider);

        // 查詢鏈上活動資訊
        const [onChainOrganizer, ticketsSold, maxTicketSupply, ticketPriceUSD, exists] =
            await contract.getEventInfo(eventId);

        // 檢查活動是否存在
        if (!exists) {
            return {
                isValid: false,
                error: '活動不存在於智慧合約中，此 IPFS 數據可能是偽造的',
                eventId
            };
        }

        // 檢查主辦方地址是否匹配
        if (onChainOrganizer.toLowerCase() !== organizer.toLowerCase()) {
            return {
                isValid: false,
                error: '主辦方地址與鏈上記錄不符，數據已被篡改',
                eventId
            };
        }

        // 驗證成功
        console.log('✓ 鏈上驗證成功:', {
            eventId,
            organizer: onChainOrganizer,
            ticketsSold: ticketsSold.toString(),
            maxTicketSupply: maxTicketSupply.toString(),
            ticketPriceUSD: ticketPriceUSD.toString()
        });

        return {
            isValid: true,
            eventId,
            onChainData: {
                organizer: onChainOrganizer,
                ticketsSold: Number(ticketsSold),
                maxTicketSupply: Number(maxTicketSupply),
                ticketPriceUSD: Number(ticketPriceUSD)
            }
        };

    } catch (error) {
        console.error('鏈上驗證失敗:', error);
        return {
            isValid: false,
            error: `鏈上驗證過程發生錯誤: ${error.message}`
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