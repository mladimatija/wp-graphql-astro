// Test script to check WordPress API connectivity
import https from 'https';
import http from 'http';
import * as dotenv from 'dotenv';
dotenv.config();

// WordPress API URL from environment
const wpApiUrl = process.env.WORDPRESS_API_URL;

// Basic authentication - get from .env file
const username = process.env.WP_APP_USERNAME;
const password = process.env.WP_APP_PASSWORD;

// Create the auth header
const auth = Buffer.from(`${username}:${password}`).toString('base64');

// Simple GraphQL query
const query = `{
  generalSettings {
    title
    description
    url
    language
  }
}`;

// Request options
const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Basic ${auth}`
  }
};

// Parse URL to get hostname, path, etc.
const urlObj = new URL(wpApiUrl);
options.hostname = urlObj.hostname;
options.path = urlObj.pathname + urlObj.search;
options.port = urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80);

// Create the request body
const requestBody = JSON.stringify({
  query
});

console.log('Testing WordPress GraphQL API connectivity...');
console.log(`URL: ${wpApiUrl}`);
console.log(`Username: ${username ? username : '(not set)'}`);
console.log(`Password: ${password ? '(set)' : '(not set)'}`);

// Choose http or https based on the URL
const requestModule = urlObj.protocol === 'https:' ? https : http;

const req = requestModule.request(options, (res) => {
  console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
  console.log('Headers:', res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response data:');
    try {
      const parsedData = JSON.parse(data);
      console.log(JSON.stringify(parsedData, null, 2));
    } catch (error) {
      console.log('Could not parse response as JSON:');
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error making request:', error.message);
});

// Send request
req.write(requestBody);
req.end();