# IPFS 伺服器

基於 Helia 的 IPFS 伺服器，提供 JSON 數據的儲存和檢索功能。

## 功能特點

- ✅ 儲存 JSON 數據到 IPFS
- ✅ 通過 CID 檢索數據
- ✅ 持久化儲存
- ✅ RESTful API 設計

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

### 1. 上傳 JSON 數據

**端點:** `POST /upload`

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
  "size": 89
}
```

### 2. 獲取 JSON 數據

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

### 3. 健康檢查

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

## 資料儲存

所有 IPFS 數據都會持久化儲存在 `./data` 目錄中：
- `./data/blocks` - 區塊儲存
- `./data/datastore` - 資料儲存

## 環境變數

- `PORT` - 伺服器端口（預設: 3001）

## 前端整合範例

```javascript
// 上傳數據到 IPFS
async function uploadToIPFS(data) {
  const response = await fetch('http://localhost:3001/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  const result = await response.json();
  return result.cid;
}

// 從 IPFS 獲取數據
async function getFromIPFS(cid) {
  const response = await fetch(`http://localhost:3001/data/${cid}`);
  const result = await response.json();
  return result.data;
}

// 使用範例
const cid = await uploadToIPFS({
  eventId: '123',
  name: '音樂會',
  date: '2026-02-01'
});

console.log('上傳成功，CID:', cid);

const data = await getFromIPFS(cid);
console.log('獲取的數據:', data);
```

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
