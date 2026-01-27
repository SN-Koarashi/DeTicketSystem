# 驗票功能使用指南

## 功能概述

驗票頁面 (`/check-in`) 允許票券擁有者進行驗票操作，驗證後票券會在區塊鏈上標記為已使用。

## 重要須知

### 1. 驗票者必須是票券擁有者

根據智慧合約的設計，只有票券的購買者（擁有者）才能驗證票券。智慧合約會檢查：
- `ticketOwner[paymentId] == msg.sender`
- 如果不符合，會拋出錯誤："Only ticket owner can verify"

### 2. 付款識別碼格式

- 格式：`0x` 開頭的 66 字元（包含 0x）
- 範例：`0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`
- 這是在購票時生成的 `bytes32` 類型的唯一識別碼

### 3. 一次性驗證

- 每張票券只能驗證一次
- 驗證後，智慧合約會記錄時間戳
- 再次驗證同一票券會失敗

## 使用流程

### 步驟 1：連接錢包
1. 訪問 `/check-in` 頁面
2. 使用頁面右上角的 "Connect Wallet" 按鈕連接錢包
3. **重要**：必須使用購票時的錢包地址

### 步驟 2：輸入付款識別碼

有兩種方式：

#### 方式 A：掃描 QR Code（未來功能）
- 點擊「開始掃描 QR Code」按鈕
- 使用相機掃描票券上的 QR Code
- 目前為演示版本，會自動從 localStorage 讀取票券

#### 方式 B：手動輸入
1. 在輸入框中貼上付款識別碼（ticketId）
2. 格式必須是：`0x...` (66 字元)
3. 可以從「我的票券」頁面複製

### 步驟 3：驗證票券
1. 點擊「驗證票券」按鈕
2. 在錢包中確認交易
3. 等待交易確認（約 12-15 秒）

### 步驟 4：查看結果

#### 成功時
- 顯示綠色提示：「驗票成功！票券已核銷」
- 顯示票券資訊和交易 hash
- 記錄會保存在驗票歷史中

#### 失敗時
- 可能的錯誤訊息：
  - **「您不是此票券的擁有者」** → 請使用購票時的錢包
  - **「此票券已被使用」** → 該票券已經驗證過
  - **「交易被拒絕」** → 用戶取消了錢包簽名

## 環境配置

### 合約地址設置

在 `.env.local` 文件中設置合約地址：

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

替換為你部署的智慧合約地址。

### 獲取部署地址

部署合約後，從終端輸出中複製：

```bash
npx hardhat run scripts/deploy.js --network sepolia

# 輸出範例：
# DeTicketSystem deployed to: 0x1234567890123456789012345678901234567890
```

將這個地址配置到環境變數中。

## 技術實現

### 前端流程

```javascript
// 1. 用戶輸入付款識別碼
const ticketId = "0x..."

// 2. 調用智慧合約
writeContract({
    address: CONTRACT_ADDRESS,
    abi: DeTicketSystemABI.abi,
    functionName: 'verifyTicket',
    args: [ticketId],
})

// 3. 等待交易確認
useWaitForTransactionReceipt({ hash })

// 4. 更新 UI 和本地記錄
localStorage.setItem('checkInHistory', ...)
```

### 智慧合約邏輯

```solidity
function verifyTicket(bytes32 paymentId) external returns (bool) {
    // 檢查是否為票券擁有者
    require(ticketOwner[paymentId] == msg.sender, "Only ticket owner can verify");
    
    // 檢查是否已使用
    if (ticketUsageTimestamp[paymentId] == 0) {
        // 記錄使用時間
        ticketUsageTimestamp[paymentId] = block.timestamp;
        emit TicketVerified(paymentId, block.timestamp);
        return true;
    }
    
    return false; // 已使用
}
```

## 驗票歷史

驗票記錄會保存在本地 localStorage 中，包含：
- 付款識別碼
- 驗證時間
- 驗證者地址
- 交易 hash

可以在驗票頁面底部查看歷史記錄。

## 常見問題

### Q: 為什麼必須是購票者才能驗票？
A: 這是智慧合約的安全設計，防止他人惡意驗證票券。只有票券擁有者有權核銷自己的票券。

### Q: 票券可以轉讓嗎？
A: 根據當前合約設計，票券與購買者地址綁定，無法轉讓。

### Q: 驗票需要 gas 費嗎？
A: 是的，驗票是一個寫入區塊鏈的操作，需要支付少量 Sepolia ETH 作為 gas 費。

### Q: 如何獲取測試幣？
A: 訪問 Sepolia 水龍頭網站：
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

### Q: 驗票失敗怎麼辦？
A: 
1. 確認使用的是購票時的錢包地址
2. 檢查付款識別碼格式是否正確
3. 確認票券尚未被使用
4. 檢查錢包中有足夠的 ETH 支付 gas 費

## 下一步優化

1. **真實 QR Code 掃描**
   - 整合 `react-qr-reader` 或類似庫
   - 使用裝置相機掃描票券

2. **NFC 支持**
   - 支持 NFC 標籤讀取
   - 適用於實體票券

3. **批量驗票**
   - 主辦方可以批量處理多張票券
   - 提高簽到效率

4. **離線驗票**
   - 支持離線模式
   - 後續同步到鏈上
