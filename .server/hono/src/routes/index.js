import { Hono } from 'hono';
import eventRoutes from './event.js';

const routes = new Hono();

// Register route groups
routes.route('/v1/event', eventRoutes);
export default routes;
