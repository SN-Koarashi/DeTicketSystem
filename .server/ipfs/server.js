import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { FsBlockstore } from 'blockstore-fs';
import { FsDatastore } from 'datastore-fs';

const app = new Hono();
const PORT = process.env.PORT || 3001;

// Middleware
app.use('/*', cors());

// 初始化 Helia 節點
let helia;
let fs;

async function initHelia() {
    try {
        // 創建持久化的 blockstore 和 datastore
        const blockstore = new FsBlockstore('./ipfs-data/blocks');
        const datastore = new FsDatastore('./ipfs-data/datastore');

        helia = await createHelia({
            blockstore,
            datastore,
        });

        fs = unixfs(helia);

        console.log('✅ Helia IPFS 節點已初始化');
        console.log('📍 節點 ID:', helia.libp2p.peerId.toString());
    } catch (error) {
        console.error('❌ 初始化 Helia 失敗:', error);
        process.exit(1);
    }
}

// 健康檢查端點
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        service: 'IPFS Server',
        peerId: helia?.libp2p.peerId.toString() || 'not initialized'
    });
});

// 上傳 JSON 數據到 IPFS
app.post('/upload', async (c) => {
    try {
        const jsonData = await c.req.json();

        // 驗證輸入
        if (!jsonData || typeof jsonData !== 'object') {
            return c.json({
                error: '無效的輸入格式，需要 JSON 物件'
            }, 400);
        }

        // 將 JSON 轉換為字串
        const jsonString = JSON.stringify(jsonData);
        const encoder = new TextEncoder();
        const bytes = encoder.encode(jsonString);

        // 存入 IPFS
        const cid = await fs.addBytes(bytes);

        console.log('✅ 數據已上傳到 IPFS，CID:', cid.toString());

        return c.json({
            success: true,
            cid: cid.toString(),
            size: bytes.length
        });
    } catch (error) {
        console.error('❌ 上傳失敗:', error);
        return c.json({
            error: '上傳失敗',
            message: error.message
        }, 500);
    }
});

// 從 IPFS 獲取數據
app.get('/data/:cid', async (c) => {
    try {
        const cid = c.req.param('cid');

        if (!cid) {
            return c.json({
                error: '缺少 CID 參數'
            }, 400);
        }

        // 從 IPFS 讀取數據
        const decoder = new TextDecoder();
        let content = '';

        for await (const chunk of fs.cat(cid)) {
            content += decoder.decode(chunk, { stream: true });
        }

        // 將字串解析為 JSON
        const jsonData = JSON.parse(content);

        console.log('✅ 數據已從 IPFS 獲取，CID:', cid);

        return c.json({
            success: true,
            cid: cid,
            data: jsonData
        });
    } catch (error) {
        console.error('❌ 獲取失敗:', error);

        if (error.message.includes('no block')) {
            return c.json({
                error: '找不到指定的 CID',
                message: '該 CID 不存在或尚未同步'
            }, 404);
        }

        return c.json({
            error: '獲取失敗',
            message: error.message
        }, 500);
    }
});

// 啟動伺服器
async function startServer() {
    await initHelia();

    serve({
        fetch: app.fetch,
        port: PORT,
    });

    console.log(`🚀 IPFS 伺服器運行在 http://localhost:${PORT}`);
    console.log(`📝 API 端點:`);
    console.log(`   - POST   /upload      - 上傳 JSON 數據`);
    console.log(`   - GET    /data/:cid   - 獲取數據`);
    console.log(`   - GET    /health      - 健康檢查`);
}

// 優雅關閉
process.on('SIGINT', async () => {
    console.log('\n🛑 正在關閉 IPFS 伺服器...');
    if (helia) {
        await helia.stop();
    }
    process.exit(0);
});

startServer().catch(console.error);
