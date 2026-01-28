# IPFS 伺服器

基於 Helia 的 IPFS 伺服器，提供 JSON 數據的儲存和檢索功能。

## 功能特點

- ✅ 儲存 JSON 數據到 IPFS
- ✅ 通過 CID 檢索數據
- ✅ 持久化儲存（Pin 機制）
- ✅ 兩階段提交（上傳 + Pin）
- ✅ 支援 Unpin 清理未使用資料
- ✅ 列出所有已 Pin 的資料
- ✅ RESTful API 設計
- ✅ 帶超時機制的資料讀取

## 安裝

```bash
npm install
```

## 啟動伺服器

```bash
npm start
```

開發模式:

```bash
npm run dev
```

伺服器預設運行在 `http://localhost:3001`

## API 端點

### 1. 上傳 JSON 數據（暫存）

**端點:** `POST /upload`

**說明:** 上傳數據到 IPFS 但不立即 Pin，資料會暫存在 blockstore 中。建議在區塊鏈交易成功後再呼叫 `/pin/:cid` 來持久化資料。

**請求範例:**

```bash
curl -X POST http://localhost:3001/upload \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "123",
    "name": "測試活動",
    "description": "這是一個測試活動"
  }'
```

**回應範例:**

```json
{
  "success": true,
  "cid": "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku",
  "size": 89,
  "pinned": false,
  "message": "資料已暫存，請在交易成功後 pin"
}
```

##說明:** 從 IPFS 讀取數據，帶有 3 秒超時機制。

**請求範例:**

```bash
curl http://localhost:3001/data/bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku
```

**回應範例:**

```json
{
  "success": true,
  "cid": "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku",
  "data": {
    "eventId": "123",
    "name": "測試活動",
    "description": "這是一個測試活動"
  }
}
```

**錯誤回應（找不到 CID）:**

```json
{
  "error": "找不到指定的 CID",
  "message": "該 CID 不存在或尚未同步"
}
```

### 2. Pin 資料（固定）

**端點:** `POST /pin/:cid`

**說明:** 當區塊鏈交易成功時，可以 Pin 資料，讓資料持久化儲存。

**請求範例:**

```bash
curl -X POST http://localhost:3001/pin/bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku
```

**回應範例:**

```json
{
  "success": true,
  "cid": "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku",
  "pinned": true,
  "message": "資料已持久化並驗證"
}
```

### 3. Unpin 資料（清理）

**端點:** `DELETE /pin/:cid`

**說明:** 當區塊鏈交易失敗時，可以 Unpin 資料，讓垃圾回收機制清理未使用的區塊。

**請求範例:**

```bash
curl -X DELETE http://localhost:3001/pin/bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku
```

**回應範例:**

```json
{
  "success": true,
  "cid": "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku",
  "pinned": false,
  "message": "資料已標記為可清理"
}
```

### 4. 列出所有 Pin 的資料

**端點:** `GET /pins`

**說明:** 列出所有已 Pin（持久化）的資料 CID。

**請求範例:**

```bash
curl http://localhost:3001/pins
```

**回應範例:**

```json
{
  "success": true,
  "count": 2,
  "pins": [
    "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku",
    "bafkreigdvvzjvky5yqvs4bxgwklcjrtjm6h2pqvjsw6zqhxqzvxd7mkjy4"
  ]
}
```

### 5. 獲取 JSON 數據

**端點:** `GET /data/:cid`

**請求範例:**

```bash
curl http://localhost:3001/data/bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku
```

**回應範例:**

```json
{
  "success": true,
  "cid": "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku",
  "data": {
    "eventId": "123",
    "name": "測試活動",
    "description": "這是一個測試活動"
  }
}
```

### 6. 健康檢查

**端點:** `GET /health`

**請求範例:**

```bash
curl http://localhost:3001/health
```

**回應範例:**

```json
{
  "status": "ok",
  "service": "IPFS Server",
  "peerId": "12D3KooWGjGvULY..."
}
```
兩階段提交流程

為了確保區塊鏈交易和 IPFS 儲存的一致性，建議使用兩階段提交：

1. **階段一：暫存資料**
   - 先呼叫 `POST /upload` 上傳資料到 IPFS（不 Pin）
   - 取得 CID 並將其寫入區塊鏈合約

2. **階段二：持久化**
   - 如果區塊鏈交易**成功**：呼叫 `POST /pin/:cid` 來持久化資料
   - 如果區塊鏈交易**失敗**：呼叫 `DELETE /pin/:cid` 來清理資料

這樣可以避免：
- 區塊鏈交易失敗但 IPFS 資料已持久化（浪費儲存空間）
- 區塊鏈交易成功但 IPFS 資料被垃圾回收（資料遺失）

## 注意事項

1. **CID 生成**: CID 是由 IPFS 根據內容自動生成的，相同內容會產生相同的 CID（內容尋址）
2. **持久化**: 數據會儲存在本地文件系統，重啟後依然可用
3. **CORS**: 伺服器已啟用 CORS，前端可以直接調用
4. **錯誤處理**: API 會返回適當的 HTTP 狀態碼和錯誤訊息

## 疑難排解

### 端口被占用

如果 3001 端口已被使用，可以設置環境變數：

```bash
PORT=3002 npm start
```

### 權限問題

確保應用有權限創建 `./data` 目錄。

## 技術架構

- **Hono** - Web 框架
- **Helia** - IPFS JavaScript 實現
- **UnixFS** - 文件系統抽象層
- **FsBlockstore/FsDatastore** - 持久化儲存
