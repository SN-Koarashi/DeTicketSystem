import { Hono } from 'hono';

const eventRoutes = new Hono();

/**
 * @param {import('@/types.js').AppContext} c
 */
eventRoutes.post('/', async (c) => {
    const conn = c.get('conn');

    return c.json({ message: 'User route root' });
});

export default eventRoutes;
