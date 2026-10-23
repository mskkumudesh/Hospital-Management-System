import mysql, { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { config } from './config.js';

const pool = mysql.createPool({ ...config.db, dateStrings: true, connectionLimit: 10 });

export type Row = Record<string, any>;
export type Params = unknown[];

/** SELECT many rows. */
export const rows = async <T = Row>(sql: string, params: Params = []) =>
  (await pool.query<RowDataPacket[]>(sql, params))[0] as unknown as T[];

/** SELECT one row (or undefined). */
export const one = async <T = Row>(sql: string, params: Params = []) =>
  (await rows<T>(sql, params))[0];

/** INSERT / UPDATE / DELETE. */
export const run = async (sql: string, params: Params = []) =>
  (await pool.query<ResultSetHeader>(sql, params))[0];
