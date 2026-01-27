import mysql from 'mysql2/promise';

/**
 * DatabaseConnection
 * JavaScript implementation of PHP DatabaseConnection class
 * @author Converted from PHP
 */
class DatabaseConnection {
    constructor(dbHost = null, dbName = null, dbUser = null, dbPassword = null, dbPort = 3306) {
        if (!dbHost || !dbName || !dbUser || !dbPassword) {
            throw new Error("WARNING: construct doesn't have database object.");
        }

        this.config = {
            host: dbHost,
            database: dbName,
            port: dbPort,
            user: dbUser,
            password: dbPassword,
            charset: 'utf8mb4',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            bigNumberStrings: true,
            supportBigNumbers: true,
            // Disable eval to work with Cloudflare Workers
            // See: https://github.com/sidorares/node-mysql2/pull/2289
            disableEval: true,
            dateStrings: true
        };

        this.pool = mysql.createPool(this.config);
    }

    /**
     * Get database connection wrapper
     */
    getConnection(isJson = false) {
        return new DatabaseConnectionWrapper(this.pool, isJson);
    }

    /**
     * Close the connection pool
     */
    async close() {
        await this.pool.end();
    }
}

/**
 * Database connection wrapper class
 */
class DatabaseConnectionWrapper {
    constructor(pool, isJson) {
        this.pool = pool;
        this.isJson = isJson;

        // 保留原始 query 以便覆寫 execute 時使用
        const originalQuery = this.pool.query.bind(this.pool);

        // 攔截 execute()
        this.pool.execute = async (sql, params = []) => {
            // 使用 mysql.format 安全地插入參數
            const formattedSql = mysql.format(sql, params);
            // 呼叫原本的 query() 執行
            return await originalQuery(formattedSql);
        };
    }

    /**
     * Get result in appropriate format
     */
    getResult(result = {}) {
        if (this.isJson) {
            return JSON.stringify(result);
        }
        return result;
    }

    /**
     * Begin transaction
     * @return {Promise<TransactionConnection>} A transaction connection wrapper
     */
    async beginTransaction() {
        const connection = await this.pool.getConnection();
        await connection.beginTransaction();
        return new TransactionConnection(connection, this.isJson);
    }

    /**
     * Create a record
     */
    async create(table = '', keyArray = [], dataArray = []) {
        const keys = keyArray.join(', ');
        const placeholders = keyArray.map(() => '?').join(', ');

        // Use string concatenation instead of template literals to avoid Cloudflare Workers restrictions
        const sql = 'INSERT INTO ' + table + ' (' + keys + ') VALUES (' + placeholders + ')';

        try {
            const [result] = await this.pool.execute(sql, dataArray);
            return this.getResult({
                success: true,
                lastInsertId: result.insertId
            });
        } catch (error) {
            console.error('Create error:', error.message);
            console.error('SQL:', sql);
            return this.getResult({
                success: false,
                lastInsertId: null,
                error: error.message
            });
        }
    }

    /**
     * Read records with AND conditions
     */
    async read(table = '', id = null, keyArray = [], dataArray = [], orderList = {}) {
        let selectFields = id !== null ? ' WHERE id = ?' : '';
        let orderFields = '';

        keyArray.forEach((key, index) => {
            if (index === 0 && id === null) {
                selectFields += ' WHERE ' + key + ' = ?';
            } else {
                selectFields += ' AND ' + key + ' = ?';
            }
        });

        const orderEntries = Object.entries(orderList);
        orderEntries.forEach(([key, order], index) => {
            if (index === 0) {
                orderFields += ' ORDER BY ' + key + ' ' + order;
            } else {
                orderFields += ', ' + key + ' ' + order;
            }
        });

        // Use string concatenation instead of template literals to avoid Cloudflare Workers restrictions
        const sql = 'SELECT * FROM ' + table + selectFields + orderFields;
        const params = id !== null ? [id, ...dataArray] : dataArray;

        try {
            const [rows] = await this.pool.execute(sql, params);
            if (!rows || rows.length === 0) {
                return this.getResult({ success: false, data: [] });
            }
            return this.getResult({ success: true, data: rows });
        } catch (error) {
            console.error('Read error:', error.message);
            return this.getResult({
                success: false,
                data: [],
                error: error.message
            });
        }
    }

    /**
     * Read records with OR conditions
     */
    async readWithOr(table = '', id = null, keyArray = [], dataArray = [], orderList = {}) {
        let selectFields = id !== null ? ' WHERE id = ?' : '';
        let orderFields = '';

        keyArray.forEach((key, index) => {
            if (index === 0 && id === null) {
                selectFields += ' WHERE ' + key + ' = ?';
            } else {
                selectFields += ' OR ' + key + ' = ?';
            }
        });

        const orderEntries = Object.entries(orderList);
        orderEntries.forEach(([key, order], index) => {
            if (index === 0) {
                orderFields += ' ORDER BY ' + key + ' ' + order;
            } else {
                orderFields += ', ' + key + ' ' + order;
            }
        });

        // Use string concatenation instead of template literals to avoid Cloudflare Workers restrictions
        const sql = 'SELECT * FROM ' + table + selectFields + orderFields;
        const params = id !== null ? [id, ...dataArray] : dataArray;

        try {
            const [rows] = await this.pool.execute(sql, params);
            if (!rows || rows.length === 0) {
                return this.getResult({ success: false, data: [] });
            }
            return this.getResult({ success: true, data: rows });
        } catch (error) {
            console.error('Read error:', error.message);
            return this.getResult({
                success: false,
                data: [],
                error: error.message
            });
        }
    }

    /**
     * Execute raw SQL query
     */
    async raw(sql, prepareArray = []) {
        try {
            const [rows] = await this.pool.execute(sql, prepareArray);
            if (!rows || rows.length === 0) {
                return this.getResult({ success: false, data: [] });
            }
            return this.getResult({ success: true, data: rows });
        } catch (error) {
            console.error('SQL error:', error.message);
            return this.getResult({
                success: false,
                data: [],
                error: error.message
            });
        }
    }

    /**
     * Update a record
     * @param {string} table - Table name
     * @param {number|object} id - Record ID or object with composite keys
     * @param {array} keyArray - Keys to update
     * @param {array} dataArray - Values to update
     */
    async update(table = '', id = null, keyArray = [], dataArray = []) {
        let updateFields = keyArray.map(key => key + ' = ?').join(', ');

        let whereClause = '';
        let whereValues = [];

        if (typeof id === 'object' && id !== null) {
            // Composite keys
            const entries = Object.entries(id);
            whereClause = entries.map(([key]) => key + ' = ?').join(' AND ');
            whereValues = entries.map(([, value]) => value);
        } else {
            // Single key
            whereClause = 'id = ?';
            whereValues = [id];
        }

        // Use string concatenation instead of template literals to avoid Cloudflare Workers restrictions
        const sql = 'UPDATE ' + table + ' SET ' + updateFields + ' WHERE ' + whereClause;
        const params = [...dataArray, ...whereValues];

        try {
            const [result] = await this.pool.execute(sql, params);
            return this.getResult({
                success: true,
                rowCount: result.affectedRows
            });
        } catch (error) {
            console.error('Update error:', error.message);
            return this.getResult({
                success: false,
                rowCount: -1,
                error: error.message
            });
        }
    }

    /**
     * Delete a record
     * @param {string} table - Table name
     * @param {number|object} id - Record ID or object with composite keys
     */
    async delete(table, id) {
        let whereClause = '';
        let whereValues = [];

        if (typeof id === 'object' && id !== null) {
            // Composite keys
            const entries = Object.entries(id);
            whereClause = entries.map(([key]) => key + ' = ?').join(' AND ');
            whereValues = entries.map(([, value]) => value);
        } else {
            // Single key
            whereClause = 'id = ?';
            whereValues = [id];
        }

        // Use string concatenation instead of template literals to avoid Cloudflare Workers restrictions
        const sql = 'DELETE FROM ' + table + ' WHERE ' + whereClause;

        try {
            const [result] = await this.pool.execute(sql, whereValues);
            return this.getResult({
                success: true,
                rowCount: result.affectedRows
            });
        } catch (error) {
            console.error('Delete error:', error.message);
            return this.getResult({
                success: false,
                rowCount: -1,
                error: error.message
            });
        }
    }
}

/**
 * Transaction connection wrapper class
 * Wraps a single connection with transaction support and CRUD operations
 */
class TransactionConnection {
    constructor(connection, isJson) {
        this.connection = connection;
        this.isJson = isJson;
        this.isActive = true;

        // Override execute to use prepared statements
        const originalQuery = this.connection.query.bind(this.connection);
        this.connection.execute = async (sql, params = []) => {
            const formattedSql = mysql.format(sql, params);
            return await originalQuery(formattedSql);
        };
    }

    /**
     * Get result in appropriate format
     */
    getResult(result = {}) {
        if (this.isJson) {
            return JSON.stringify(result);
        }
        return result;
    }

    /**
     * Commit transaction and release connection
     */
    async commit() {
        if (!this.isActive) {
            throw new Error('Transaction is not active');
        }
        await this.connection.commit();
        this.connection.release();
        this.isActive = false;
    }

    /**
     * Rollback transaction and release connection
     */
    async rollBack() {
        if (!this.isActive) {
            throw new Error('Transaction is not active');
        }
        await this.connection.rollback();
        this.connection.release();
        this.isActive = false;
    }

    /**
     * Create a record within the transaction
     */
    async create(table = '', keyArray = [], dataArray = []) {
        if (!this.isActive) {
            throw new Error('Transaction is not active');
        }

        const keys = keyArray.join(', ');
        const placeholders = keyArray.map(() => '?').join(', ');
        const sql = 'INSERT INTO ' + table + ' (' + keys + ') VALUES (' + placeholders + ')';

        try {
            const [result] = await this.connection.execute(sql, dataArray);
            return this.getResult({
                success: true,
                lastInsertId: result.insertId
            });
        } catch (error) {
            console.error('Create error:', error.message);
            console.error('SQL:', sql);
            return this.getResult({
                success: false,
                lastInsertId: null,
                error: error.message
            });
        }
    }

    /**
     * Read records with AND conditions within the transaction
     */
    async read(table = '', id = null, keyArray = [], dataArray = [], orderList = {}) {
        if (!this.isActive) {
            throw new Error('Transaction is not active');
        }

        let selectFields = id !== null ? ' WHERE id = ?' : '';
        let orderFields = '';

        keyArray.forEach((key, index) => {
            if (index === 0 && id === null) {
                selectFields += ' WHERE ' + key + ' = ?';
            } else {
                selectFields += ' AND ' + key + ' = ?';
            }
        });

        const orderEntries = Object.entries(orderList);
        orderEntries.forEach(([key, order], index) => {
            if (index === 0) {
                orderFields += ' ORDER BY ' + key + ' ' + order;
            } else {
                orderFields += ', ' + key + ' ' + order;
            }
        });

        const sql = 'SELECT * FROM ' + table + selectFields + orderFields;
        const params = id !== null ? [id, ...dataArray] : dataArray;

        try {
            const [rows] = await this.connection.execute(sql, params);
            if (!rows || rows.length === 0) {
                return this.getResult({ success: false, data: [] });
            }
            return this.getResult({ success: true, data: rows });
        } catch (error) {
            console.error('Read error:', error.message);
            return this.getResult({
                success: false,
                data: [],
                error: error.message
            });
        }
    }

    /**
     * Read records with OR conditions within the transaction
     */
    async readWithOr(table = '', id = null, keyArray = [], dataArray = [], orderList = {}) {
        if (!this.isActive) {
            throw new Error('Transaction is not active');
        }

        let selectFields = id !== null ? ' WHERE id = ?' : '';
        let orderFields = '';

        keyArray.forEach((key, index) => {
            if (index === 0 && id === null) {
                selectFields += ' WHERE ' + key + ' = ?';
            } else {
                selectFields += ' OR ' + key + ' = ?';
            }
        });

        const orderEntries = Object.entries(orderList);
        orderEntries.forEach(([key, order], index) => {
            if (index === 0) {
                orderFields += ' ORDER BY ' + key + ' ' + order;
            } else {
                orderFields += ', ' + key + ' ' + order;
            }
        });

        const sql = 'SELECT * FROM ' + table + selectFields + orderFields;
        const params = id !== null ? [id, ...dataArray] : dataArray;

        try {
            const [rows] = await this.connection.execute(sql, params);
            if (!rows || rows.length === 0) {
                return this.getResult({ success: false, data: [] });
            }
            return this.getResult({ success: true, data: rows });
        } catch (error) {
            console.error('Read error:', error.message);
            return this.getResult({
                success: false,
                data: [],
                error: error.message
            });
        }
    }

    /**
     * Execute raw SQL query within the transaction
     */
    async raw(sql, prepareArray = []) {
        if (!this.isActive) {
            throw new Error('Transaction is not active');
        }

        try {
            const [rows] = await this.connection.execute(sql, prepareArray);
            if (!rows || rows.length === 0) {
                return this.getResult({ success: false, data: [] });
            }
            return this.getResult({ success: true, data: rows });
        } catch (error) {
            console.error('SQL error:', error.message);
            return this.getResult({
                success: false,
                data: [],
                error: error.message
            });
        }
    }

    /**
     * Update a record within the transaction
     * @param {string} table - Table name
     * @param {number|object} id - Record ID or object with composite keys
     * @param {array} keyArray - Keys to update
     * @param {array} dataArray - Values to update
     */
    async update(table = '', id = null, keyArray = [], dataArray = []) {
        if (!this.isActive) {
            throw new Error('Transaction is not active');
        }

        let updateFields = keyArray.map(key => key + ' = ?').join(', ');

        let whereClause = '';
        let whereValues = [];

        if (typeof id === 'object' && id !== null) {
            const entries = Object.entries(id);
            whereClause = entries.map(([key]) => key + ' = ?').join(' AND ');
            whereValues = entries.map(([, value]) => value);
        } else {
            whereClause = 'id = ?';
            whereValues = [id];
        }

        const sql = 'UPDATE ' + table + ' SET ' + updateFields + ' WHERE ' + whereClause;
        const params = [...dataArray, ...whereValues];

        try {
            const [result] = await this.connection.execute(sql, params);
            return this.getResult({
                success: true,
                rowCount: result.affectedRows
            });
        } catch (error) {
            console.error('Update error:', error.message);
            return this.getResult({
                success: false,
                rowCount: -1,
                error: error.message
            });
        }
    }

    /**
     * Delete a record within the transaction
     * @param {string} table - Table name
     * @param {number|object} id - Record ID or object with composite keys
     */
    async delete(table, id) {
        if (!this.isActive) {
            throw new Error('Transaction is not active');
        }

        let whereClause = '';
        let whereValues = [];

        if (typeof id === 'object' && id !== null) {
            const entries = Object.entries(id);
            whereClause = entries.map(([key]) => key + ' = ?').join(' AND ');
            whereValues = entries.map(([, value]) => value);
        } else {
            whereClause = 'id = ?';
            whereValues = [id];
        }

        const sql = 'DELETE FROM ' + table + ' WHERE ' + whereClause;

        try {
            const [result] = await this.connection.execute(sql, whereValues);
            return this.getResult({
                success: true,
                rowCount: result.affectedRows
            });
        } catch (error) {
            console.error('Delete error:', error.message);
            return this.getResult({
                success: false,
                rowCount: -1,
                error: error.message
            });
        }
    }
}

export default DatabaseConnection;
export { DatabaseConnection };
