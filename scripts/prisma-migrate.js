#!/usr/bin/env node
// scripts/prisma-migrate.js
// Load .env.local before running prisma migrate

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

// Load .env (as fallback)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Run prisma migrate
const { spawn } = require('child_process');

const prisma = spawn('npx', ['prisma', 'migrate', 'dev', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
});

prisma.on('exit', (code) => process.exit(code));
