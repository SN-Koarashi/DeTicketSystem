export class DatabaseConnection {
  constructor(dbHost: string, dbName: string, dbUser: string, dbPassword: string, dbPort?: number);
  getConnection(isJson?: boolean): DatabaseConnectionWrapper;
  close(): Promise<void>;
}

export class DatabaseConnectionWrapper {
  create(table: string, keyArray: string[], dataArray: any[]): Promise<{ success: Boolean, lastInsertId: ?number, error?: string }>;
  read(table: string, id?: string | null, keyArray?: string[], dataArray?: any[], orderList?: Record<string, string>): Promise<{ success: Boolean, data: Array, error?: string }>;
  readWithOr(table: string, id?: string | null, keyArray?: string[], dataArray?: any[], orderList?: Record<string, string>): Promise<{ success: Boolean, data: Array, error?: string }>;
  raw(sql: string, prepareArray?: any[]): Promise<{ success: Boolean, data: Array, error?: string }>;
  update(table: string, id: string | object, keyArray: string[], dataArray: any[]): Promise<{ success: Boolean, rowCount: number, error?: string }>;
  delete(table: string, id: string | object): Promise<{ success: Boolean, rowCount: number, error?: string }>;
  beginTransaction(): Promise<TransactionConnection>;
}

export class TransactionConnection {
  create(table: string, keyArray: string[], dataArray: any[]): Promise<{ success: Boolean, lastInsertId: ?number, error?: string }>;
  read(table: string, id?: string | null, keyArray?: string[], dataArray?: any[], orderList?: Record<string, string>): Promise<{ success: Boolean, data: Array, error?: string }>;
  readWithOr(table: string, id?: string | null, keyArray?: string[], dataArray?: any[], orderList?: Record<string, string>): Promise<{ success: Boolean, data: Array, error?: string }>;
  raw(sql: string, prepareArray?: any[]): Promise<{ success: Boolean, data: Array, error?: string }>;
  update(table: string, id: string | object, keyArray: string[], dataArray: any[]): Promise<{ success: Boolean, rowCount: number, error?: string }>;
  delete(table: string, id: string | object): Promise<{ success: Boolean, rowCount: number, error?: string }>;
  commit(connection: any): Promise<void>;
  rollBack(connection: any): Promise<void>;
}