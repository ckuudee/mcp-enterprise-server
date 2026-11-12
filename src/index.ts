import "dotenv/config";
import { loadConfig } from "./config.js";

const config = loadConfig();
console.log(`Config loaded (port ${config.PORT}). Server not implemented yet.`);
