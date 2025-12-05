// Test script to check WordPress API connectivity
import https from "https";
import http from "http";
import * as dotenv from "dotenv";
dotenv.config();

// Simple logging utility for node scripts
const log = {
  info: (message) => {
    console.log("[INFO]", message);
  },
  error: (message) => {
    console.error("[ERROR]", message);
  },
};

// WordPress API URL from environment
const wpApiUrl = process.env.WORDPRESS_API_URL;

// Basic authentication - get from .env file
const username = process.env.WP_APP_USERNAME;
const password = process.env.WP_APP_PASSWORD;

// Create the auth header
const auth = Buffer.from(`${username}:${password}`).toString("base64");

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
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Basic ${auth}`,
  },
};

// Parse URL to get hostname, path, etc.
const urlObj = new URL(wpApiUrl);
options.hostname = urlObj.hostname;
options.path = urlObj.pathname + urlObj.search;
options.port = urlObj.port || (urlObj.protocol === "https:" ? 443 : 80);

// Create the request body
const requestBody = JSON.stringify({
  query,
});

log.info("Testing WordPress GraphQL API connectivity...");
log.info(`URL: ${wpApiUrl}`);
log.info(`Username: ${username ? username : "(not set)"}`);
log.info(`Password: ${password ? "(set)" : "(not set)"}`);

// Choose http or https based on the URL
const requestModule = urlObj.protocol === "https:" ? https : http;

const req = requestModule.request(options, (res) => {
  log.info(`Status: ${res.statusCode} ${res.statusMessage}`);
  log.info("Headers: " + JSON.stringify(res.headers));

  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    log.info("Response data:");
    try {
      const parsedData = JSON.parse(data);
      log.info(JSON.stringify(parsedData, null, 2));
    } catch (error) {
      log.info("Could not parse response as JSON:");
      log.info(data);
    }
  });
});

req.on("error", (error) => {
  log.error("Error making request: " + error.message);
});

// Send request
req.write(requestBody);
req.end();
