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

export default eventRoutes;
