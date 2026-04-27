import type { Meilisearch } from 'meilisearch';

let clientPromise: Promise<Meilisearch> | null = null;

export async function getMeiliClient(): Promise<Meilisearch> {
  if (!clientPromise) {
    clientPromise = import('meilisearch').then((mod) => {
      const MeilisearchClass = mod.Meilisearch;
      return new MeilisearchClass({
        host: process.env.MEILI_URL || 'http://localhost:7700',
        apiKey: process.env.MEILI_MASTER_KEY || 'dev-key',
      });
    });
  }
  return clientPromise;
}
