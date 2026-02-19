import { Context } from 'hono';
import { DatabaseConnection, DatabaseConnectionWrapper } from '@/lib/DatabaseConnection/types';
import { D1Database } from '@cloudflare/workers-types/experimental';

// Extend Hono's Context type with our custom variables
declare module 'hono' {
  interface ContextVariableMap {
    db: InstanceType<typeof D1Database>;
  }
}

// Export the extended context type for convenience
export type AppContext = Context;
