// Test script to check manifest.json API route
import fetch from 'cross-fetch';
import { spawn } from 'child_process';
import * as dotenv from 'dotenv';
dotenv.config();

// Pass environment variables to the Astro dev server
const env = {
  ...process.env,
  WORDPRESS_API_URL: process.env.WORDPRESS_API_URL,
  WP_APP_USERNAME: process.env.WP_APP_USERNAME,
  WP_APP_PASSWORD: process.env.WP_APP_PASSWORD,
  NODE_ENV: 'development',
  ASTRO_VERBOSE: 'true',
  ASTRO_LOG_LEVEL: 'debug'
};

// Start Astro dev server
console.log('Starting Astro dev server...');
const astroServer = spawn('npm', ['run', 'dev'], { 
  env,
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverOutput = '';
let serverStarted = false;

// Collect server output
astroServer.stdout.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  process.stdout.write(output);
  
  // Check if server is ready
  if (output.includes('Local') && output.includes('http://localhost:')) {
    serverStarted = true;
    testManifestRoute();
  }
});

astroServer.stderr.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  process.stderr.write(output);
});

// Function to test the manifest.json API route
async function testManifestRoute() {
  try {
    console.log('\n\nTesting manifest.json API route...');
    const response = await fetch('http://localhost:4321/api/manifest.json');
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('Headers:', headers);
    
    const data = await response.json();
    console.log('Response data:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing manifest.json route:', error);
  } finally {
    // Clean up - kill the server
    console.log(`Shutting down Astro server (PID: ${astroServer.pid})...`);
    astroServer.kill('SIGTERM');
    process.exit(0);
  }
}

// Set a timeout in case the server doesn't start
setTimeout(() => {
  if (!serverStarted) {
    console.error('Timeout waiting for Astro server to start');
    astroServer.kill('SIGTERM');
    process.exit(1);
  }
}, 30000); // 30 second timeout