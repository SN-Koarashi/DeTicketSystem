# RainbowKit 錢包連接設置說明

## 已完成的功能

✅ **RainbowKit 整合**
- 使用 RainbowKit + Wagmi + TanStack Query
- 支援多種錢包連接 (MetaMask, WalletConnect, Coinbase Wallet 等)
- 深色主題配置

✅ **Sepolia 測試網路**
- 自動切換到 Sepolia 網路
- 顯示網路狀態
- 錯誤提示

✅ **訊息簽署功能**
- 使用 `useSignMessage` hook
- 確認主辦方身份
- 簽名儲存在活動資料中

✅ **創建活動流程**
1. 連接錢包
2. 簽署訊息確認身份
3. 準備活動資料
4. 上傳至 IPFS (Mock)
5. 儲存至資料庫 (Mock)
6. 智慧合約上鏈 (Mock)
7. 生成活動識別碼 (使用真實 keccak256)

## 使用方式

### 1. 設置環境變數

複製 `.env.local.example` 為 `.env.local`，並填入你的 WalletConnect Project ID:

```bash
cp .env.local.example .env.local
```

到 https://cloud.walletconnect.com/ 註冊並獲取 Project ID，然後更新 `.env.local`:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id
```

### 2. 安裝依賴

已安裝的套件:
- `@rainbow-me/rainbowkit@^2.2.8`
- `wagmi@^2.17.5`
- `@tanstack/react-query`
- `ethers@^6.15.0`

### 3. 啟動開發伺服器

```bash
npm run dev
```

### 4. 測試錢包連接

1. 訪問 http://localhost:3000/events/create
2. 點擊「Connect Wallet」按鈕
3. 選擇你的錢包 (建議使用 MetaMask)
4. 確保切換到 Sepolia 測試網路
5. 填寫活動表單
6. 點擊「創建活動」會觸發簽名請求

## 主要檔案說明

### `/src/lib/wagmi.js`
配置 Wagmi 和 RainbowKit，設定 Sepolia 網路

### `/src/components/Providers.js`
提供 WagmiProvider、QueryClientProvider 和 RainbowKitProvider

### `/src/app/layout.js`
包裹整個應用的 Providers

### `/src/app/events/create/page.js`
主辦者創建活動頁面，包含:
- 錢包連接狀態檢查
- 網路驗證 (Sepolia)
- 訊息簽署
- 完整的創建流程

### `/src/components/WalletConnect.js`
簡化的錢包連接按鈕 (使用 RainbowKit 內建)

## 下一步 (Phase 2 & 3)

- [ ] 整合真實的 IPFS 上傳 (Pinata/Infura)
- [ ] 實作 Hono API 資料庫互動
- [ ] 撰寫智慧合約
- [ ] 部署合約到 Sepolia
- [ ] 整合真實的合約呼叫
- [ ] QR Code 生成功能

## 獲取 Sepolia 測試幣

1. 訪問 https://sepoliafaucet.com/
2. 或 https://www.infura.io/faucet/sepolia
3. 輸入你的錢包地址獲取測試幣

## 故障排除

### 錯誤: "請切換到 Sepolia 測試網路"
- 在 MetaMask 中切換到 Sepolia 測試網路
- 如果沒有 Sepolia，點擊網路下拉選單 → 顯示測試網路

### 簽名請求沒有彈出
- 檢查錢包是否已連接
- 檢查是否在正確的網路上
- 查看瀏覽器控制台錯誤訊息

### RainbowKit 按鈕沒有顯示
- 檢查 `.env.local` 是否正確設置
- 重啟開發伺服器
- 清除瀏覽器快取
