#!/usr/bin/env node

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Run a command and return a promise
function runCommand(command, cwd = __dirname) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command} in ${cwd}`);
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        console.error(stderr);
        reject(error);
        return;
      }
      console.log(stdout);
      resolve(stdout);
    });
  });
}

async function ensureDirectoryExists(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
    return true;
  } catch (error) {
    console.error(`Error creating directory ${dir}:`, error);
    return false;
  }
}

async function createTsconfigForServer() {
  // Create a separate tsconfig for server compilation
  const serverTsConfig = {
    compilerOptions: {
      target: "ES2020",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      esModuleInterop: true,
      outDir: "./dist",
      rootDir: "./",
      strict: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true
    },
    include: ["server/**/*.ts", "shared/**/*.ts"],
    exclude: ["node_modules", "dist"]
  };

  await fs.writeFile(
    path.join(__dirname, 'tsconfig.server.json'),
    JSON.stringify(serverTsConfig, null, 2)
  );
}

async function buildClient() {
  console.log('Building client with Vite...');
  try {
    // Build the client-side code with Vite
    await runCommand('npx vite build');
    return true;
  } catch (error) {
    console.error('Client build failed:', error);
    return false;
  }
}

async function buildServer() {
  console.log('Building server...');
  try {
    // Create a specific tsconfig for server
    await createTsconfigForServer();
    
    // Compile server TypeScript files
    await runCommand('npx tsc -p tsconfig.server.json');
    
    return true;
  } catch (error) {
    console.error('Server build failed:', error);
    return false;
  }
}

async function build() {
  try {
    // Make sure dist directory exists
    const distDir = path.join(__dirname, 'dist');
    await ensureDirectoryExists(distDir);
    
    // Build client and server in sequence
    const clientSuccess = await buildClient();
    if (!clientSuccess) {
      throw new Error('Client build failed');
    }
    
    const serverSuccess = await buildServer();
    if (!serverSuccess) {
      throw new Error('Server build failed');
    }
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build process failed:', error);
    process.exit(1);
  }
}

build();
