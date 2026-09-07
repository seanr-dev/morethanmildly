import { getStore, getDeployStore } from '@netlify/blobs';
import { env } from './env';
export function mediaStore() {
  return env('CONTEXT') === 'production'
    ? getStore({ name: 'article-media', consistency: 'strong' })
    : getDeployStore('article-media');
}
