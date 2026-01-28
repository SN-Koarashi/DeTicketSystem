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
        const blockstore = new FsBlockstore('./data/blocks');
        const datastore = new FsDatastore('./data/datastore');

        helia = await createHelia({
            blockstore,
            datastore,
        });

        fs = unixfs(helia);

        for await (const pinnedCid of helia.pins.ls()) {
            console.log('Pinned:', pinnedCid.toString());
        }

        await helia.gc();
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

// 上傳 JSON 數據到 IPFS（支援兩階段提交）
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

        // 存入 IPFS（暫存，不立即 pin）
        const cid = await fs.addBytes(bytes, {
            // 不立即 pin，等待後續確認
            pin: false
        });

        console.log('✅ 數據已暫存到 IPFS（未 pin），CID:', cid.toString());
        console.log('⚠️  請記得在交易成功後呼叫 /pin/:cid 來持久化資料');

        return c.json({
            success: true,
            cid: cid.toString(),
            size: bytes.length,
            pinned: false,
            message: '資料已暫存，請在交易成功後 pin'
        });
    } catch (error) {
        console.error('❌ 上傳失敗:', error);
        return c.json({
            error: '上傳失敗',
            message: error.message
        }, 500);
    }
});

// Pin 資料（確認交易成功後持久化）
app.post('/pin/:cid', async (c) => {
    try {
        const cidString = c.req.param('cid');

        if (!cidString) {
            return c.json({
                error: '缺少 CID 參數'
            }, 400);
        }

        // 從字串創建 CID 對象
        const { CID } = await import('multiformats/cid');
        const cid = CID.parse(cidString);

        // Pin 資料
        await helia.pins.add(cid);

        console.log('📌 資料已 pin，CID:', cidString);

        return c.json({
            success: true,
            cid: cidString,
            pinned: true,
            message: '資料已持久化'
        });
    } catch (error) {
        console.error('❌ Pin 失敗:', error);
        return c.json({
            error: 'Pin 失敗',
            message: error.message
        }, 500);
    }
});

// Unpin 資料（交易失敗時清理）
app.delete('/pin/:cid', async (c) => {
    try {
        const cidString = c.req.param('cid');

        if (!cidString) {
            return c.json({
                error: '缺少 CID 參數'
            }, 400);
        }

        // 從字串創建 CID 對象
        const { CID } = await import('multiformats/cid');
        const cid = CID.parse(cidString);

        // Unpin 資料
        await helia.pins.rm(cid);

        console.log('🗑️  資料已 unpin（將被垃圾回收），CID:', cidString);

        return c.json({
            success: true,
            cid: cidString,
            pinned: false,
            message: '資料已標記為可清理'
        });
    } catch (error) {
        console.error('❌ Unpin 失敗:', error);
        return c.json({
            error: 'Unpin 失敗',
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
        let content = await catWithTimeout(cid, 3000);
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

// 封裝一個帶 timeout 的 cat
async function catWithTimeout(cid, timeoutMs = 5000) {
    return new Promise(async (resolve, reject) => {
        let timer = setTimeout(() => reject(new Error('NOT FOUND')), timeoutMs);

        try {
            const decoder = new TextDecoder();
            let content = '';
            for await (const chunk of fs.cat(cid)) {
                content += decoder.decode(chunk, { stream: true });

                // 每次讀到 chunk，就重置 timer
                clearTimeout(timer);
                timer = setTimeout(() => reject(new Error('NOT FOUND')), timeoutMs);
            }
            clearTimeout(timer);
            resolve(content);
        } catch (err) {
            clearTimeout(timer);
            reject(err);
        }
    });
}

// 啟動伺服器
async function startServer() {
    await initHelia();

    serve({
        fetch: app.fetch,
        port: PORT,
    });

    console.log(`🚀 IPFS 伺服器運行在 http://localhost:${PORT}`);
    console.log(`📝 API 端點:`);
    console.log(`   - POST   /upload        - 上傳 JSON 數據（暫存）`);
    console.log(`   - POST   /pin/:cid     - Pin 資料（持久化）`);
    console.log(`   - DELETE /pin/:cid     - Unpin 資料（清理）`);
    console.log(`   - GET    /data/:cid    - 獲取數據`);
    console.log(`   - GET    /health       - 健康檢查`);
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
