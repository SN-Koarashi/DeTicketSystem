# DeTicketSystem 智慧合約

去中心化售票與簽到系統的 Ethereum Sepolia 智慧合約。

## 功能特性

### 函數A: 建立活動 (createEvent)
- 傳入參數：CID、活動資料 Hash、主辦者地址、最大票券供應量、票券價格(USD)
- 使用 keccak256 對所有參數進行 hash 生成唯一的活動識別碼
- 儲存活動資訊：主辦者地址、已售票券數量、最大供應量、票券價格

### 函數B: 購買票券 (purchaseTicket)
- 傳入參數：活動識別碼、票券 ID (nonce)、買家地址
- 生成付款識別碼 = keccak256(活動識別碼, nonce, 買家地址)
- 檢查票券是否售罄
- 使用 Chainlink Price Feed 取得當前 ETH/USD 價格計算所需 ETH 金額
- 自動分帳：25% 給合約建立者，75% 給活動主辦者
- 初始化付款識別碼的使用時間戳為 0 (未使用)

### 函數C: 驗票 (verifyTicket)
- 傳入付款識別碼
- 檢查是否為票券擁有者
- 檢查票券使用狀態：
  - 時間戳 = 0：未使用，更新為當前時間並返回 true
  - 時間戳 > 0：已使用，返回 false

### Chainlink Oracle 整合
- **ETH/USD 價格查詢**：使用 Chainlink Price Feed 取得即時 ETH 價格

## 合約架構

```
DeTicketSystem.sol
├── 狀態變數
│   ├── contractOwner (合約建立者)
│   ├── priceFeed (Chainlink Price Feed)
│   ├── events (活動資訊 mapping)
│   └── ticketUsageTimestamp (票券使用狀態 mapping)
├── 函數
│   ├── createEvent (建立活動)
│   ├── purchaseTicket (購買票券)
│   ├── verifyTicket (驗票)
│   ├── getLatestETHPrice (取得 ETH 價格)
│   ├── calculateRequiredETH (計算所需 ETH)
│   ├── getEventInfo (查詢活動資訊)
│   └── getTicketUsageStatus (查詢票券使用狀態)
└── 事件
    ├── EventCreated
    ├── TicketPurchased
    └── TicketVerified
```

## 安裝與設定

### 1. 安裝依賴

```bash
cd hardhat
npm install
```

### 2. 環境設定

複製 `.env.example` 為 `.env` 並填入您的設定：

```bash
cp .env.example .env
```

編輯 `.env` 檔案：

```env
SEPOLIA_RPC_URL=https://rpc.sepolia.org
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

⚠️ **重要**：不要將 `.env` 檔案提交到 Git！

### 3. 編譯合約

```bash
npx hardhat compile
```

## 測試

執行完整測試套件：

```bash
npx hardhat test
```

執行特定測試檔案：

```bash
npx hardhat test test/DeTicketSystem.test.js
```

查看測試覆蓋率：

```bash
npx hardhat coverage
```

## 部署

### 本地部署 (Hardhat Network)

```bash
npx hardhat run scripts/deploy.js
```

### Sepolia 測試網部署

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

部署後會顯示：
- 合約地址
- 建立者地址
- 當前 ETH 價格
- 自動進行 Etherscan 驗證

## 使用範例

### 1. 建立活動

```javascript
const eventId = await deTicketSystem.createEvent(
  "QmYourIPFSCID...",                    // IPFS CID
  ethers.keccak256(ethers.toUtf8Bytes("event data")), // 活動資料 hash
  "0xOrganizerAddress...",               // 主辦者地址
  1000,                                  // 最大票券供應量
  5000                                   // 票券價格 $50.00 (5000 cents)
);
```

### 2. 購買票券

```javascript
// 計算所需 ETH
const requiredETH = await deTicketSystem.calculateRequiredETH(5000);

// 購買票券
const paymentId = await deTicketSystem.purchaseTicket(
  eventId,
  12345,  // nonce (隨機數)
  { value: requiredETH }
);
```

### 3. 驗票

```javascript
const isValid = await deTicketSystem.verifyTicket(paymentId);
if (isValid) {
  console.log("驗票成功！");
} else {
  console.log("票券已使用或無效！");
}
```

### 4. 查詢活動資訊

```javascript
const eventInfo = await deTicketSystem.getEventInfo(eventId);
console.log("主辦者:", eventInfo.organizer);
console.log("已售票券:", eventInfo.ticketsSold);
console.log("最大供應量:", eventInfo.maxTicketSupply);
```

## Chainlink Price Feed 地址

### Sepolia 測試網
- **ETH/USD**: `0x694AA1769357215DE4FAC081bf1f309aDC325306`

### 其他網路
可在 [Chainlink Data Feeds](https://docs.chain.link/data-feeds/price-feeds/addresses) 查詢其他網路的 Price Feed 地址。

## 安全考量

1. **重入攻擊防護**：使用 Checks-Effects-Interactions 模式
2. **整數溢位**：Solidity 0.8+ 內建溢位保護
3. **分帳失敗處理**：使用 `require` 確保轉帳成功，失敗則回滾
4. **存取控制**：活動只能由指定的主辦者管理
5. **票券唯一性**：使用 keccak256 確保付款識別碼唯一

## Gas 優化

- 使用 `immutable` 儲存不可變的變數
- 使用 `uint256` 而非較小的整數類型（避免額外打包成本）
- 批次操作減少交易次數
- 啟用 Solidity 優化器 (runs: 200)

## 測試網水龍頭

需要 Sepolia ETH 進行測試？

- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
- [Chainlink Sepolia Faucet](https://faucets.chain.link/sepolia)

## 開發工具

- **Hardhat**: 以太坊開發環境
- **Ethers.js v6**: 與智慧合約互動
- **Chainlink**: 去中心化 Oracle 服務
- **Chai**: 測試框架

## 專案結構

```
hardhat/
├── contracts/
│   ├── DeTicketSystem.sol       # 主合約
│   └── mocks/
│       └── MockV3Aggregator.sol # 測試用 Mock
├── scripts/
│   └── deploy.js                # 部署腳本
├── test/
│   └── DeTicketSystem.test.js   # 測試檔案
├── hardhat.config.js            # Hardhat 配置
├── package.json                 # 依賴管理
└── .env.example                 # 環境變數範本
```

## 授權

MIT License

## 支援

如有問題或建議，請開啟 Issue 或 Pull Request。
