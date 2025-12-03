import { MongoClient } from "mongodb";

let client = null;
let db = null;

export async function connectToMongo(uri, dbName = "Ciw") {
  if (!uri) throw new Error("MONGO_URI not provided");
  client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  db = client.db(dbName);
  console.log(`MongoClient connected and using database: ${db.databaseName}`);
  return db;
}

export function getDb() {
  if (!db) throw new Error("MongoClient not connected");
  return db;
}

export async function closeMongo() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
