import { getDatabase } from '@netlify/database';
import { drizzle } from 'drizzle-orm/netlify-db';

export function createPublicationDatabase(connection = getDatabase()) {
  if (connection.driver === 'serverless') {
    // Drizzle's Netlify adapter in rc.4 still calls the HTTP client with a SQL
    // string. Neon 1.x requires .query(sql, parameters, options) for that form.
    // Keep the SDK's refreshing client, parameter binding and transaction API.
    const httpClient = new Proxy(connection.httpClient, {
      apply(target, thisArg, args) {
        if (typeof args[0] === 'string') {
          return target.query(args[0], args[1], args[2]);
        }
        return Reflect.apply(target, thisArg, args);
      },
    });
    return drizzle({ client: { ...connection, httpClient } });
  }
  return drizzle({ client: connection });
}
