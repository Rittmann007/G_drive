// CommonJS
const sdk = require('node-appwrite');           // main SDK
const { InputFile } = require('node-appwrite/file'); // InputFile helper (from buffer/path)
require('dotenv').config();

const client = new sdk.Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const storage = new sdk.Storage(client);

module.exports = { sdk, client, storage, InputFile };
