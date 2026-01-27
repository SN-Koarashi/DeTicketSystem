import { Context } from 'hono';
import { DatabaseConnection, DatabaseConnectionWrapper } from '@/lib/DatabaseConnection/types';

// Extend Hono's Context type with our custom variables
declare module 'hono' {
  interface ContextVariableMap {
    db: InstanceType<typeof DatabaseConnection>;
    conn: InstanceType<typeof DatabaseConnectionWrapper>;
  }
}

// Export the extended context type for convenience
export type AppContext = Context;
