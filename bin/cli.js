#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

const args = process.argv.slice(2);
const command = args[0];

if (command === "init") {
  const initScript = path.join(__dirname, "../dist/cli/init.js");
  const child = spawn("node", [initScript], { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code));
} else if (command === "generate-secret") {
  const crypto = require("crypto");
  const secret = crypto.randomBytes(64).toString("base64");
  console.log("\n🔐 Generated secure VISTA_AUTH_SECRET:");
  console.log(`VISTA_AUTH_SECRET="${secret}"`);
  console.log("\n💡 Copy this to your .env file");
} else {
  console.log(`
🔐 Vista Auth CLI

Commands:
  init               Initialize Vista Auth in your project
  generate-secret    Generate a secure VISTA_AUTH_SECRET

Examples:
  npx vista-auth init
  npx vista-auth generate-secret
  `);
}
