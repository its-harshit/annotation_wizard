const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017"; // Or your Atlas URI
const dbName = "annotation_wizard";

const conversations = [
  {
    turns: [
      { role: "user", content: "Hello! How are you?" },
      { role: "assistant", content: "I'm good, thank you! How can I help you today?" },
      { role: "user", content: "Can you tell me a joke?" },
      { role: "assistant", content: "Why did the scarecrow win an award? Because he was outstanding in his field!" }
    ],
    meta: { source: "seed", createdAt: new Date() }
  },
  {
    turns: [
      { role: "user", content: "What's the weather like today?" },
      { role: "assistant", content: "It's sunny and warm in most areas." }
    ],
    meta: { source: "seed", createdAt: new Date() }
  }
];

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  await db.collection("conversations").deleteMany({});
  await db.collection("conversations").insertMany(conversations);
  console.log("Seeded conversations!");
  await client.close();
}

main();