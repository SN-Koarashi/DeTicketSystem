import { Context } from 'hono';
import { DatabaseConnection, DatabaseConnectionWrapper } from '@/lib/DatabaseConnection/types';
import { R2Bucket } from '@cloudflare/workers-types/experimental/index.js';
import Snowflake from './lib/Snowflake';

// Extend Hono's Context type with our custom variables
declare module 'hono' {
  interface ContextVariableMap {
    db: InstanceType<typeof DatabaseConnection>;
    conn: InstanceType<typeof DatabaseConnectionWrapper>;
    dbNoCache: InstanceType<typeof DatabaseConnection>;
    connNoCache: InstanceType<typeof DatabaseConnectionWrapper>;
    R2: R2Bucket;
    R2_PUBLIC_URL: string;
    auth_domain: string;
    is_secure?: boolean;
    user_id?: string;
    user_payload?: any;
    ray_id?: string;
    machine_id: number;
    is_dev: boolean;
    LiFi: typeof import('@lifi/sdk');
    snowflake: Snowflake;
  }
}

// Export the extended context type for convenience
export type AppContext = Context;
