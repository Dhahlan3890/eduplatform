import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb+srv://patalxar:YkJJxYn6Kf2GmuG8@eduzone.2dtmba1.mongodb.net/?retryWrites=true&w=majority&appName=eduzone"
let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (!global._mongoClientPromise) {
  client = new MongoClient(uri)
  global._mongoClientPromise = client.connect()
}
clientPromise = global._mongoClientPromise!

export default clientPromise
