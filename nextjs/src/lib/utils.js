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

export const categories = {
    all: '全部',
    music: '音樂',
    education: '教育',
    art: '藝術',
    business: '商業',
    technology: '科技',
    other: '其他'
};