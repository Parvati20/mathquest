import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

const globalForMongo = globalThis as unknown as {
  mongoClientPromise?: Promise<MongoClient | null>;
};

async function createMongoClientPromise() {
  if (!uri) {
    return null;
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 4000,
    connectTimeoutMS: 4000,
    socketTimeoutMS: 8000,
  });

  try {
    return await client.connect();
  } catch (error) {
    console.warn("MongoDB connection unavailable, using local fallback:", error);
    return null;
  }
}

export function getMongoClient() {
  const cachedPromise = globalForMongo.mongoClientPromise;

  if (cachedPromise) {
    return cachedPromise;
  }

  const promise = createMongoClientPromise();

  if (process.env.NODE_ENV !== "production") {
    globalForMongo.mongoClientPromise = promise;
  }

  return promise;
}
