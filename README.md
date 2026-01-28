# DeTicket System

> 去中心化票務與簽到系統 - 基於以太坊區塊鏈的活動票務平台

一個結合區塊鏈技術、IPFS 分散式儲存與傳統資料庫的去中心化票務系統，提供安全、透明且不可竄改的活動售票與簽到解決方案。

## 系統概述

DeTicket System 是一個去中心化售票平台，解決傳統票務系統中的信任問題、票券偽造問題以及中心化平台的高額手續費問題。系統整合了：

- **智慧合約** - 以太坊 Sepolia 測試網上的票務智慧合約
- **IPFS** - 分散式儲存活動完整資訊
- **傳統資料庫** - 快速查詢活動摘要
- **Web3 錢包** - 使用者身份認證與付款

### 核心優勢

- **透明公正** - 所有交易記錄上鏈，可公開驗證  
- **防偽造** - 票券資訊雜湊，不可竄改  
- **即時驗票** - 區塊鏈即時驗證，防止重複使用  
- **自動分帳** - 智慧合約自動執行 75/25 分潤  
- **去中心化儲存** - IPFS 確保活動資訊永久保存  

## 功能特性

### 主辦者功能

- **建立活動** - 填寫活動資訊並部署至區塊鏈
- **設定票價** - 支援美元計價，自動轉換為 ETH
- **票券管理** - 設定最大票券供應量，自動追蹤已售數量
- **QR Code 生成** - 為每個活動生成專屬識別碼
- **自動收款** - 每筆購票 75% 款項自動撥付給主辦者

### 參加者功能

- **瀏覽活動** - 首頁展示所有可購票活動
- **連接錢包** - 支援 MetaMask、WalletConnect 等主流錢包
- **購買票券** - 使用 ETH 購買活動票券
- **票券 QR Code** - 獲得唯一的付款識別碼 QR Code
- **防重複使用** - 票券掃描後立即失效

### 驗票功能

- **掃描 QR Code** - 現場掃描參加者票券
- **即時驗證** - 鏈上即時驗證票券有效性
- **防重複入場** - 已使用票券自動標記時間戳
- **驗票結果** - 即時回傳成功或失敗狀態

## 技術架構

```
┌─────────────────────────────────────────────────────────────┐
│                        使用者介面                             │
│                    Next.js 15 + React 19                     │
│           (RainbowKit + Wagmi + Ethers.js)                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
┌────────────────┐  ┌────────────────┐
│   Hono API     │  │  IPFS Server   │
│  (Cloudflare)  │  │   (Helia)      │
│   MySQL DB     │  │  Port: 3001    │
└────────┬───────┘  └────────┬───────┘
         │                   │
         └─────────┬─────────┘
                   │
                   ▼
         ┌──────────────────┐
         │  Smart Contract  │
         │ Ethereum Sepolia │
         │ (Chainlink Oracle)│
         └──────────────────┘
```

### 技術堆疊

#### 前端 (nextjs/)
- **框架**: Next.js 15.5.9 (App Router)
- **UI 庫**: React 19.2.3 + TailwindCSS 4
- **Web3**: 
  - Wagmi 2.17.5 - 以太坊互動
  - RainbowKit 2.2.8 - 錢包連接
  - Ethers.js 6.15.0 - 合約互動
- **其他**: react-qr-code (QR Code 生成)

#### 後端 API (backend/hono/)
- **框架**: Hono 4.10.3 (輕量級 Web 框架)
- **資料庫**: MySQL 3.6.0

#### IPFS 伺服器 (backend/ipfs/)
- **IPFS 實作**: Helia 5.5.1
- **儲存引擎**: 
  - blockstore-fs (區塊儲存)
  - datastore-fs (資料儲存)
- **API**: Hono 4.0.0

#### 智慧合約 (hardhat/)
- **開發框架**: Hardhat 2.26.0
- **區塊鏈**: Ethereum Sepolia Testnet
- **Oracle**: Chainlink Price Feeds (ETH/USD)
- **語言**: Solidity ^0.8.19

## 環境需求

### 必要軟體

- **Node.js**: 22.x 或更高版本 (推薦使用 nvm 管理)
- **npm**: 9.x 或更高版本
- **Git**: 最新版本

### 開發工具

- **MetaMask** 或其他 Web3 錢包
- **MySQL**: 8.0 或更高版本 (用於 Hono API)
- **VS Code** (推薦)

### 區塊鏈需求

- **以太坊錢包** - 含有 Sepolia 測試網 ETH
- **Sepolia Testnet** - [取得測試幣](https://sepoliafaucet.com/)
- **Etherscan API Key** - [註冊取得](https://etherscan.io/apis)

### 服務需求

- **MySQL 資料庫** - 用於儲存活動摘要
- **IPFS 節點** - 本地 IPFS 伺服器（已整合在專案中）

## 安裝步驟

### 1. 克隆專案

```bash
git clone https://github.com/SN-Koarashi/DeTicketSystem.git
cd DeTicketSystem
```

### 2. 使用正確的 Node.js 版本

```bash
nvm use 22
```

如果沒有安裝 Node.js 22：

```bash
nvm install 22
nvm use 22
```

### 3. 安裝依賴

#### 安裝所有子專案依賴

```bash
# 安裝前端依賴
cd nextjs
npm install

# 安裝 Hono API 依賴
cd ../backend/hono
npm install

# 安裝 IPFS 伺服器依賴
cd ../ipfs
npm install

# 安裝 Hardhat 依賴
cd ../../hardhat
npm install
```

### 4. 設定環境變數

#### Hardhat 智慧合約 (.env)

在 `hardhat/` 目錄下創建 `.env` 檔案：

```bash
cd hardhat
cp .env.example .env  # 如果有範例檔案
```

編輯 `.env`：

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

⚠️ **安全提示**: 絕不要將私鑰提交到 Git！

#### Hono API 設定

在 `backend/hono/src/index.js` 中配置資料庫連線：

```javascript
db = new DatabaseConnection(
  "your_mysql_host",      // 預設: localhost
  "de_ticket",           // 資料庫名稱
  "your_db_username",    // 資料庫使用者
  "your_db_password",    // 資料庫密碼
  3306                   // 埠號
);
```

### 5. 設定 MySQL 資料庫

建立資料庫與必要的資料表：`backend/hono/de_ticket.sql`

### 6. 編譯與部署智慧合約

```bash
cd hardhat

# 編譯合約
npx hardhat compile

# 執行測試
npx hardhat test

# 部署到 Sepolia 測試網
npx hardhat run scripts/deploy.js --network sepolia
```

記下部署後的合約地址，需要在前端配置中使用。

### 7. 更新前端合約地址

在 `nextjs/next.config.mjs` 配置檔案中更新智慧合約地址及 WalletConnect Project ID (用於驗證使用者錢包)：

```javascript
    env: {
        NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: "PROJECT_ID",
        NEXT_PUBLIC_SMART_CONTRACT_ADDRESS: "CONTRACT_ADDRESS"
    },
```

## 使用指南

### 啟動開發環境

需要同時啟動三個服務：

#### 1. 啟動 IPFS 伺服器

```bash
cd backend/ipfs
npm start
# 運行在 http://localhost:3001
```

#### 2. 啟動 Hono API

```bash
cd backend/hono
npm run dev
# 運行在 http://localhost:8081
```

#### 3. 啟動 Next.js 前端

```bash
cd nextjs
npm run dev
# 運行在 http://localhost:3000
```

### 訪問應用

開啟瀏覽器訪問: `http://localhost:3000`

## API 文檔

### Hono API 端點

**Base URL**: `http://localhost:8081/api/v1`

#### 活動相關 API

- **GET** `/events` - 取得所有活動列表
- **POST** `/events/create` - 建立新活動

### IPFS API 端點

**Base URL**: `http://localhost:3001`

#### IPFS 操作

- **POST** `/upload` - 上傳 JSON 資料到 IPFS
  ```bash
  curl -X POST http://localhost:3001/upload \
    -H "Content-Type: application/json" \
    -d '{"eventData": "..."}'
  ```
  
- **GET** `/data/:cid` - 根據 CID 取得資料
  ```bash
  curl http://localhost:3001/data/QmYourCID
  ```

## 智慧合約

### 合約地址 (Sepolia Testnet)

部署後更新此處的合約地址。

### 主要函數

#### 1. createEvent - 建立活動

```solidity
function createEvent(
    string memory cid,
    bytes32 contentHash,
    address organizer,
    uint256 maxTicketSupply,
    uint256 ticketPriceUSD
) external returns (bytes32 eventId)
```

#### 2. purchaseTicket - 購買票券

```solidity
function purchaseTicket(
    bytes32 eventId,
    uint256 nonce,
    address buyer
) external payable returns (bytes32 paymentId)
```

#### 3. verifyTicket - 驗證票券

```solidity
function verifyTicket(
    bytes32 paymentId
) external returns (bool)
```

### Chainlink Oracle 整合

- **Price Feed**: ETH/USD (Sepolia: `0x694AA1769357215DE4FAC081bf1f309aDC325306`)
- **時間戳**: 使用 `block.timestamp`

詳細合約文檔請參閱: [hardhat/CONTRACT_README.md](hardhat/CONTRACT_README.md)

## 專案結構

```
DeTicketAndCheckIn/
├── nextjs/                    # Next.js 前端應用
│   ├── src/
│   │   ├── app/              # App Router 頁面
│   │   │   ├── page.js       # 首頁 - 活動列表
│   │   │   ├── events/       # 活動相關頁面
│   │   │   │   ├── [id]/     # 活動詳情
│   │   │   │   └── create/   # 建立活動
│   │   │   ├── my-tickets/   # 我的票券
│   │   │   └── check-in/     # 驗票頁面
│   │   ├── components/       # React 組件
│   │   │   ├── ConnectView.js    # 錢包連接
│   │   │   ├── EventCard.js      # 活動卡片
│   │   │   ├── Header.js         # 頁首導航
│   │   │   └── WalletConnect.js  # 錢包連接邏輯
│   │   └── lib/              # 工具函數
│   │       ├── wagmi.js      # Web3 配置
│   │       └── utils.js      # 通用工具
│   └── package.json
│
├── backend/
│   ├── hono/                 # Hono API 服務
│   │   ├── src/
│   │   │   ├── index.js      # 主程式入口
│   │   │   ├── routes/       # API 路由
│   │   │   │   ├── event.js  # 活動相關路由
│   │   │   │   └── index.js  # 路由匯總
│   │   │   └── lib/          # 資料庫連接等
│   │   ├── wrangler.jsonc    # Cloudflare Workers 配置
│   │   └── package.json
│   │
│   └── ipfs/                 # IPFS 伺服器
│       ├── server.js         # IPFS 服務器主程式
│       ├── data/             # IPFS 本地儲存
│       └── package.json
│
├── hardhat/                  # 智慧合約開發
│   ├── contracts/            # Solidity 合約
│   │   ├── DeTicketSystem.sol    # 主合約
│   │   └── mocks/                # 測試用 Mock
│   ├── scripts/              # 部署腳本
│   │   └── deploy.js
│   ├── test/                 # 合約測試
│   │   └── DeTicketSystem.test.js
│   ├── hardhat.config.js     # Hardhat 配置
│   ├── CONTRACT_README.md    # 合約詳細文檔
│   └── package.json
│
├── PLAN.md                   # 專案開發計劃
└── package.json              # 根專案配置
```

## 工作流程

### 主辦者建立活動流程

1. 連接 Web3 錢包
2. 填寫活動資訊（名稱、描述、地點、時間、票價、最大票數）
3. 系統將完整活動資訊上傳至 IPFS，取得 CID
4. 將活動摘要存入 MySQL 資料庫（快速查詢用）
5. 呼叫智慧合約 `createEvent`，將 CID、資料 Hash、主辦者地址上鏈
6. 取得活動識別碼，生成活動專屬 QR Code

### 參加者購票流程

1. 瀏覽活動列表，選擇想參加的活動
2. 點擊活動卡片，查看活動詳細資訊（從 IPFS 取得）
3. 連接 Web3 錢包
4. 點擊「購買票券」
5. 智慧合約計算所需 ETH 金額（透過 Chainlink 取得即時匯率）
6. 確認交易並支付
7. 智慧合約自動分帳：75% 給主辦者，25% 給平台
8. 生成付款識別碼，展示票券 QR Code

### 現場驗票流程

1. 主辦者開啟驗票頁面
2. 使用相機掃描參加者的票券 QR Code
3. 系統解析付款識別碼
4. 呼叫智慧合約 `verifyTicket` 函數
5. 合約檢查票券使用狀態：
   - 未使用（timestamp = 0）→ 更新為當前時間，返回 ✅ 驗票成功
   - 已使用（timestamp > 0）→ 返回 ❌ 票券已使用

## 測試

### 智慧合約測試

```bash
cd hardhat

# 執行所有測試
npx hardhat test

# 執行特定測試檔案
npx hardhat test test/DeTicketSystem.test.js

# 查看測試覆蓋率
npx hardhat coverage

# 查看 Gas 使用報告
REPORT_GAS=true npx hardhat test
```

### 本地測試網路

使用 Hardhat 本地節點：

```bash
# 啟動本地節點
npx hardhat node

# 在另一個終端部署合約
npx hardhat run scripts/deploy.js --network localhost
```

## 影片素材來源

首頁背景影片來源: [Vecteezy - Purple Plexus Abstract Digital Connection](https://www.vecteezy.com/video/27989743-purple-plexus-abstract-digital-connection-moving-dots-and-lines-technology-background)
