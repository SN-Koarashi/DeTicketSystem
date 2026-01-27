import { Hono } from 'hono';

const eventRoutes = new Hono();

/**
 * @param {import('@/types.js').AppContext} c
 */
eventRoutes.get('/', async (c) => {
    const conn = c.get('conn');
    const result = await conn.raw("SELECT * FROM events");

    return c.json({ message: 'OK', data: result.data });
});

/**
 * @param {import('@/types.js').AppContext} c
 */
eventRoutes.post('/create', async (c) => {
    try {
        const jsonData = await c.req.json();

        if (!jsonData || typeof jsonData !== 'object') {
            return c.json({
                error: '無效的輸入格式，需要 JSON 物件'
            }, 400);
        }

        const { cid, summary } = jsonData;

        if (!cid || !summary) {
            return c.json({
                error: '缺少必要的參數 cid 或 summary'
            }, 400);
        }

        const conn = c.get('conn');
        await conn.create('events', ['cid', 'summary'], [cid, JSON.stringify(summary)]);

        return c.json({
            success: true,
            message: '活動已成功創建並存儲在資料庫中'
        });
    } catch (error) {
        console.error('上傳失敗:', error);
        return c.json({
            error: '上傳失敗',
            message: error.message
        }, 500);
    }
});

export default eventRoutes;
