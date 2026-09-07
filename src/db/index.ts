import { getDatabase } from '@netlify/database';
import { createPublicationDatabase } from './client';
import { env } from '../lib/env';

export function databaseConnection() {
  let connection = getDatabase(
    import.meta.env?.DEV && env('LOCAL_DATABASE_URL')
      ? { connectionString: env('LOCAL_DATABASE_URL') }
      : undefined,
  );
  if (import.meta.env?.DEV && connection.driver === 'server') {
    const url = new URL(connection.connectionString);
    // The local Postgres emulator omits a username; a cleared shell has no pg default.
    if (!url.username) {
      url.username = 'postgres';
      connection = getDatabase({ connectionString: url.toString() });
    }
  }
  return connection;
}
const connect = () => createPublicationDatabase(databaseConnection());
let instance: ReturnType<typeof connect> | undefined;
let localConnection = '';
export function db() {
  const currentLocal = import.meta.env?.DEV
    ? env('LOCAL_DATABASE_URL') || env('NETLIFY_DB_URL')
    : '';
  if (!instance || currentLocal !== localConnection) {
    instance = connect();
    localConnection = currentLocal;
  }
  return instance;
}
