import { Hono } from 'hono';
import userRoutes from './user.js';

const routes = new Hono();

// Register route groups
routes.route('/v1/user', userRoutes);
export default routes;
