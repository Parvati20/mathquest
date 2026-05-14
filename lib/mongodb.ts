




import { MongoClient } from "mongodb";

const srvUri = process.env.MONGODB_URI;
const directUri = process.env.MONGODB_URI_DIRECT;

const globalForMongo = globalThis as unknown as {
  mongoClientPromise?: Promise<MongoClient | null>;
};

async function createMongoClientPromise() {
  const candidates: string[] = [];

  if (directUri) {
    candidates.push(directUri);
  }

  if (srvUri) {
    candidates.push(srvUri);
  }

  if (candidates.length === 0) {
    return null;
  }

  let lastError: unknown = null;

  for (const uri of candidates) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 20000,
    });

    try {
      return await client.connect();
    } catch (error) {
      lastError = error;
      await client.close().catch(() => undefined);
    }
  }

  console.warn("MongoDB connection unavailable:", lastError);
  return null;
}

export function getMongoClient() {
  const cachedPromise = globalForMongo.mongoClientPromise;

  if (cachedPromise) {
    return cachedPromise.then((client) => {
      if (!client && process.env.NODE_ENV !== "production") {
        globalForMongo.mongoClientPromise = undefined;
      }

      return client;
    });
  }

  const promise = createMongoClientPromise();

  const retryablePromise = promise.then((client) => {
    if (!client && process.env.NODE_ENV !== "production") {
      globalForMongo.mongoClientPromise = undefined;
    }

    return client;
  });

  if (process.env.NODE_ENV !== "production") {
    globalForMongo.mongoClientPromise = retryablePromise;
  }

  return retryablePromise;
}