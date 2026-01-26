import { Hono } from 'hono';

const userRoutes = new Hono();

// Account routes - require authentication

userRoutes.post('/', async (c) => {
    return c.json({ message: 'User route root' });
});

export default userRoutes;
