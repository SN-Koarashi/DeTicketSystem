import fsExtra from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const blocksDir = path.join(dataDir, 'blocks');
const datastoreDir = path.join(dataDir, 'datastore');

// 確保資料目錄存在
fsExtra.mkdirSync(blocksDir, { recursive: true });
fsExtra.mkdirSync(datastoreDir, { recursive: true });
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { FsBlockstore } from 'blockstore-fs';
import { FsDatastore } from 'datastore-fs';
import { recursive as unixfsRecursive } from 'ipfs-unixfs-exporter';

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
            // 確保 GC 不會刪除 pinned 的區塊
            gcOptions: {
                interval: 60000, // 60秒執行一次 GC
            }
        });

        fs = unixfs(helia);

        console.log('✅ Helia IPFS 節點已初始化');
        console.log('📍 節點 ID:', helia.libp2p.peerId.toString());

        await helia.gc(); // 啟動後立即執行一次 GC

        // 列出現有的 pins
        const pins = [];
        for await (const pin of helia.pins.ls()) {
            pins.push(pin.cid);
        }
        if (pins.length > 0) {
            console.log('📌 已載入的 PIN:', pins.length, '個');
            pins.forEach(pin => console.log('   -', pin));
        }
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

// 列出所有 PIN 的資料
app.get('/pins', async (c) => {
    try {
        const pins = [];
        for await (const pin of helia.pins.ls()) {
            pins.push(pin.cid);
        }

        return c.json({
            success: true,
            count: pins.length,
            pins: pins
        });
    } catch (error) {
        console.error('❌ 列出 pins 失敗:', error);
        return c.json({
            error: '列出 pins 失敗',
            message: error.message
        }, 500);
    }
});

// 上傳二進位檔案到 IPFS（multipart/form-data，支援兩階段提交）
app.post('/upload', async (c) => {
    try {
        const contentType = c.req.header('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
            return c.json({
                error: '無效的輸入格式，需要 multipart/form-data'
            }, 400);
        }

        const formData = await c.req.formData();
        const file = formData.get('file');

        if (!(file instanceof File)) {
            return c.json({
                error: '缺少檔案欄位 file'
            }, 400);
        }

        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        // 存入 IPFS（暫存，不立即 pin）
        // 注意：即使不 pin，區塊也會被寫入 blockstore
        const cid = await fs.addBytes(bytes, {
            pin: false
        });

        console.log('✅ 檔案已暫存到 IPFS（未 pin），CID:', cid.toString());
        console.log('⚠️  請記得在交易成功後呼叫 /pin/:cid 來持久化資料');

        return c.json({
            success: true,
            cid: cid.toString(),
            size: bytes.length,
            pinned: false,
            filename: file.name || null,
            contentType: file.type || 'application/octet-stream',
            message: '檔案已暫存，請在交易成功後 pin'
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

        // Pin 資料（確保 recursive pin）
        await helia.pins.add(cid, {
            // 遞迴 pin 所有相關區塊
            recursive: true
        });

        console.log('📌 資料已 pin，CID:', cidString);

        // 強制刷新 datastore 確保 pin 被持久化
        if (helia.datastore.batch) {
            const batch = helia.datastore.batch();
            await batch.commit();
        }

        // 等待確保 pin 寫入 datastore
        await new Promise(resolve => setTimeout(resolve, 200));

        for await (const res of helia.pins.add(cid)) {
            console.log('Pinning 成功:', res.toString())
        }

        return c.json({
            success: true,
            cid: cidString,
            pinned: true,
            message: '資料已持久化並驗證'
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

// 刪除資料（實際移除本地 blockstore 內的區塊）
app.delete('/delete/:cid', async (c) => {
    try {
        const cidString = c.req.param('cid');

        if (!cidString) {
            return c.json({
                error: '缺少 CID 參數'
            }, 400);
        }

        const { CID } = await import('multiformats/cid');
        const cid = CID.parse(cidString);

        // 若有 pin，先嘗試移除（忽略未 pin 的情況）
        try {
            await helia.pins.rm(cid);
        } catch (error) {
            if (!String(error?.message || '').includes('not pinned')) {
                console.warn('⚠️  移除 pin 失敗（可能未 pin）:', error.message || error);
            }
        }

        const rawBlockstore = typeof helia.blockstore.unwrap === 'function'
            ? helia.blockstore.unwrap()
            : helia.blockstore;

        let deletedBlocks = 0;
        try {
            for await (const entry of unixfsRecursive(cid, helia.blockstore)) {
                await rawBlockstore.delete(entry.cid);
                deletedBlocks += 1;
            }
        } catch (error) {
            // 若不是 UnixFS DAG，至少嘗試刪除根區塊
            if (String(error?.message || '').includes('not found') || String(error?.message || '').includes('no block')) {
                return c.json({
                    error: '找不到指定的 CID',
                    message: '該 CID 不存在或尚未同步'
                }, 404);
            }

            await rawBlockstore.delete(cid);
            deletedBlocks = 1;
        }

        helia.gc(); // 觸發垃圾回收，清理未 pin 的區塊

        console.log('🗑️  已刪除資料區塊，CID:', cidString, 'blocks:', deletedBlocks);

        return c.json({
            success: true,
            cid: cidString,
            deletedBlocks,
            message: '資料已從本地 IPFS blockstore 移除'
        });
    } catch (error) {
        console.error('❌ 刪除失敗:', error);
        return c.json({
            error: '刪除失敗',
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

// 下載二進位檔案
app.get('/download/:cid', async (c) => {
    try {
        const cid = c.req.param('cid');

        if (!cid) {
            return c.json({
                error: '缺少 CID 參數'
            }, 400);
        }

        const url = new URL(c.req.url);
        const filename = url.searchParams.get('filename') || cid;
        const contentType = url.searchParams.get('contentType') || 'application/octet-stream';

        const bytes = await catBytesWithTimeout(cid, 5000);

        const safeFilename = filename.replace(/["]+/g, '_');
        c.header('Content-Type', contentType);
        c.header('Content-Disposition', `attachment; filename="${safeFilename}"`);

        return c.body(bytes);
    } catch (error) {
        console.error('❌ 下載失敗:', error);

        if (error.message.includes('no block') || error.message.includes('NOT FOUND')) {
            return c.json({
                error: '找不到指定的 CID',
                message: '該 CID 不存在或尚未同步'
            }, 404);
        }

        return c.json({
            error: '下載失敗',
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

async function catBytesWithTimeout(cid, timeoutMs = 5000) {
    return new Promise(async (resolve, reject) => {
        let timer = setTimeout(() => reject(new Error('NOT FOUND')), timeoutMs);

        try {
            const chunks = [];
            let totalLength = 0;

            for await (const chunk of fs.cat(cid)) {
                chunks.push(chunk);
                totalLength += chunk.length;

                clearTimeout(timer);
                timer = setTimeout(() => reject(new Error('NOT FOUND')), timeoutMs);
            }

            clearTimeout(timer);

            const bytes = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
                bytes.set(chunk, offset);
                offset += chunk.length;
            }

            resolve(bytes);
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
    console.log(`   - POST   /upload        - 上傳檔案（multipart/form-data，暫存）`);
    console.log(`   - POST   /pin/:cid     - Pin 資料（持久化）`);
    console.log(`   - DELETE /pin/:cid     - Unpin 資料（清理）`);
    console.log(`   - DELETE /delete/:cid  - 刪除資料（移除區塊）`);
    console.log(`   - GET    /pins         - 列出所有 PIN 的資料`);
    console.log(`   - GET    /data/:cid    - 獲取數據`);
    console.log(`   - GET    /download/:cid - 下載檔案`);
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
