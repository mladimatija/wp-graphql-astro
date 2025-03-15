/* eslint-disable */
/**
 * Service Worker for PWA functionality
 * 
 * This service worker is automatically generated during the build process.
 * Cache names are dynamically set based on the site's identity (from WordPress or environment vars).
 * 
 * DO NOT EDIT THIS FILE DIRECTLY
 * Generated on: 2025-03-15T18:41:57.319Z with prefix: matijaculjak-com
 * Instead, edit the template in src/scripts/service-worker-template.js
 */

// Simple logging utility for service worker
const swLog = {
  // Get debug mode from service worker registration or localStorage
  isDebug: () => {
    // Default to only logging in development
    if (self.registration && self.registration.scope) {
      return self.registration.scope.includes('localhost') || 
             self.registration.scope.includes('127.0.0.1') || 
             localStorage.getItem('SW_DEBUG') === 'true';
    }
    return false;
  },
  
  debug: (message) => {
    if (swLog.isDebug()) {
      console.log('[SW DEBUG]', message);
    }
  },
  
  info: (message) => {
    if (swLog.isDebug()) {
      console.log('[SW INFO]', message);
    }
  },
  
  warn: (message, error) => {
    if (swLog.isDebug()) {
      console.warn('[SW WARN]', message, error || '');
    }
  },
  
  error: (message, error) => {
    // Always log errors
    console.error('[SW ERROR]', message, error || '');
  }
};
const CACHE_NAME = 'matijaculjak-com-v20250315';
const CONTENT_CACHE = 'matijaculjak-com-content-v20250315';
const STATIC_CACHE = 'matijaculjak-com-static-v20250315';
const IMAGE_CACHE = 'matijaculjak-com-images-v20250315';
const API_CACHE = 'matijaculjak-com-api-v20250315';

// Assets to cache on install (critical assets for app shell)
const PRECACHE_ASSETS = [
  '/',
  '/favicon.svg',
  '/logo.svg',
  '/manifest.json',
  '/404.webp',
  '/offline.html'
];

// PWA files that should have special handling
const PWA_ASSETS = [
  '/manifest.json',
  '/favicon.svg',
  '/logo.svg'
];

// Map of URLs that might be requested from the manifest
const MANIFEST_ASSET_MAP = {
  '/api/manifest.json': '/manifest.json',
  '/api/logo.svg': '/logo.svg',
  '/api/favicon.svg': '/favicon.svg'
};

// Additional static assets to cache during use
const STATIC_ASSETS_PATTERNS = [
  /\.css$/,
  /\.js$/,
  /\.woff2$/,
  /\.webp$/,
  /\.svg$/,
  /favicon\.ico$/,
  /\.png$/,
  /\.jpg$/
];

// Helper function to get absolute URL for an asset
function getAssetUrl(url) {
  // If it's already absolute, return it
  if (url.startsWith('http')) {
    return url;
  }
  
  // Otherwise, make it absolute using origin
  return self.location.origin + url;
}

// Install event - precache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Cache critical assets in main cache
      caches.open(CACHE_NAME)
        .then(cache => {
          // Add each asset individually to handle missing assets gracefully
          const cachePromises = PRECACHE_ASSETS.map(url => {
            const assetUrl = getAssetUrl(url);
            swLog.debug(`Trying to cache: ${assetUrl}`);
            
            return fetch(assetUrl, { mode: 'no-cors' })
              .then(response => {
                if (response.ok || response.type === 'opaque') {
                  return cache.put(url, response);
                }
                swLog.warn(`Failed to cache asset: ${url}`);
                return Promise.resolve(); // Continue regardless of failure
              })
              .catch(error => {
                swLog.warn(`Failed to fetch asset for caching: ${url}`, error);
                return Promise.resolve(); // Continue regardless of failure
              });
          });
          return Promise.all(cachePromises);
        }),
      
      // Pre-create other caches
      caches.open(CONTENT_CACHE),
      caches.open(STATIC_CACHE),
      caches.open(IMAGE_CACHE),
      caches.open(API_CACHE)
    ])
    .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('wp-graphql-astro-') && 
                 ![CACHE_NAME, CONTENT_CACHE, STATIC_CACHE, IMAGE_CACHE, API_CACHE].includes(cacheName);
        }).map(cacheName => {
          swLog.info('Deleting old cache: ' + cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper function to determine which cache to use
function getCacheForRequest(request) {
  const url = new URL(request.url);
  
  // API requests go to API cache
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/graphql')) {
    return API_CACHE;
  }
  
  // Images go to image cache
  if (
    url.pathname.match(/\.(jpe?g|png|gif|svg|webp)$/) ||
    request.destination === 'image'
  ) {
    return IMAGE_CACHE;
  }
  
  // Static assets
  if (STATIC_ASSETS_PATTERNS.some(pattern => url.pathname.match(pattern))) {
    return STATIC_CACHE;
  }
  
  // HTML pages go to content cache
  if (request.mode === 'navigate' || request.destination === 'document') {
    return CONTENT_CACHE;
  }
  
  // Default to main cache
  return CACHE_NAME;
}

// Fetch event handler with improved caching strategy
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  const requestURL = new URL(event.request.url);
  
  // Special handling for PWA assets
  if (PWA_ASSETS.includes(requestURL.pathname)) {
    swLog.debug('PWA asset request: ' + requestURL.pathname);
    
    event.respondWith(
      caches.match(requestURL.pathname)
        .then(cachedResponse => {
          if (cachedResponse) {
            swLog.debug('Serving PWA asset from cache: ' + requestURL.pathname);
            return cachedResponse;
          }
          
          // Not in cache, try to fetch
          swLog.debug('PWA asset not in cache, fetching: ' + requestURL.pathname);
          return fetch(getAssetUrl(requestURL.pathname), { mode: 'no-cors' })
            .then(response => {
              if (!response || (!response.ok && response.type !== 'opaque')) {
                throw new Error('Network response was not ok');
              }
              
              // Clone and cache the successful response
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(requestURL.pathname, responseToCache);
              });
              
              return response;
            });
        })
        .catch(error => {
          swLog.warn('Fetching PWA asset failed: ' + requestURL.pathname, error);
          
          // For logo or icon requests, try alternate formats
          if (requestURL.pathname.includes('.png')) {
            const svgPath = requestURL.pathname.replace('.png', '.svg');
            swLog.debug('Trying alternate format: ' + svgPath);
            return caches.match(svgPath).then(response => response || new Response('Not found', {status: 404}));
          }
          
          // Return 404 for failed requests
          return new Response('Not found', {status: 404});
        })
    );
    return;
  }

  // Check for redirected manifest asset URLs
  if (MANIFEST_ASSET_MAP[requestURL.pathname]) {
    const correctPath = MANIFEST_ASSET_MAP[requestURL.pathname];
    swLog.info(`Redirecting manifest asset request from ${requestURL.pathname} to ${correctPath}`);
    
    event.respondWith(
      caches.match(correctPath)
        .then(cachedResponse => {
          if (cachedResponse) {
            swLog.debug(`Serving redirected manifest asset from cache: ${correctPath}`);
            return cachedResponse;
          }
          
          swLog.debug(`Fetching redirected manifest asset: ${correctPath}`);
          return fetch(correctPath);
        })
        .catch(error => {
          swLog.error(`Failed to serve redirected manifest asset: ${correctPath}`, error);
          return new Response('Not found', {status: 404});
        })
    );
    return;
  }

  // Special handling for API requests - network first with fallback to cache
  if (requestURL.pathname.startsWith('/api/') || requestURL.pathname.includes('/graphql')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response || !response.ok) {
            throw new Error('Network response was not ok');
          }
          
          // Clone and cache the successful response
          const responseToCache = response.clone();
          caches.open(API_CACHE).then(cache => {
            // Only cache successful responses
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          swLog.info('API request failed, falling back to cache: ' + requestURL.pathname);
          // Fallback to cache if available
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For HTML navigation requests - network first, then cache, then offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response || !response.ok) {
            throw new Error('Network response was not ok');
          }
          
          // Cache the successful response for future offline use
          const responseToCache = response.clone();
          caches.open(CONTENT_CACHE).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(async () => {
          swLog.info('Navigation fetch failed, falling back to cache for: ' + event.request.url);
          
          try {
            // Try to get from cache first
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
              swLog.debug('Returning cached version of: ' + event.request.url);
              return cachedResponse;
            }
          } catch (error) {
            swLog.warn('Error trying to match cache:', error);
          }
          
          // If not in cache, return the offline page
          swLog.info('No cached version found, returning offline page');
          try {
            const offlinePage = await caches.match('/offline.html');
            if (offlinePage) {
              return offlinePage;
            }
          } catch (error) {
            swLog.warn('Error retrieving offline page:', error);
          }
          
          // Last resort fallback
          return new Response('You are offline and the offline page is not available.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
    return;
  }
  
  // For static assets - cache first, then network
  if (STATIC_ASSETS_PATTERNS.some(pattern => requestURL.pathname.match(pattern))) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return from cache but update cache in background (stale-while-revalidate)
            const fetchPromise = fetch(event.request)
              .then(networkResponse => {
                const cacheName = getCacheForRequest(event.request);
                caches.open(cacheName).then(cache => {
                  cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
              })
              .catch(() => {
                // Network failed, but we already have the cached response
                swLog.debug('Background fetch failed, using cached version');
              });
              
            // Return cached response immediately
            return cachedResponse;
          }
          
          // No cached response, try network
          return fetch(event.request)
            .then(response => {
              if (!response || !response.ok) {
                throw new Error('Network response was not ok');
              }
              
              // Cache the response for future
              const responseToCache = response.clone();
              const cacheName = getCacheForRequest(event.request);
              caches.open(cacheName).then(cache => {
                cache.put(event.request, responseToCache);
              });
              
              return response;
            })
            .catch(error => {
              swLog.error('Fetching failed:', error);
              // For images, we could return a fallback image
              if (event.request.destination === 'image') {
                return caches.match('/logo.svg');
              }
              
              throw error;
            });
        })
    );
    return;
  }
  
  // Default strategy for other requests - network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || !response.ok) {
          throw new Error('Network response was not ok');
        }
        
        // Clone and cache the successful response
        const responseToCache = response.clone();
        const cacheName = getCacheForRequest(event.request);
        caches.open(cacheName).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // No cached version either
            return new Response('Resource unavailable offline', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Background sync for deferred actions
self.addEventListener('sync', event => {
  if (event.tag === 'contact-form-sync') {
    event.waitUntil(syncContactForm());
  } else if (event.tag === 'newsletter-sync') {
    event.waitUntil(syncNewsletterForm());
  }
});

// Function to sync contact form submissions stored in IndexedDB
async function syncContactForm() {
  try {
    // Open IndexedDB database
    const db = await openDB('form-data', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('contact-forms')) {
          db.createObjectStore('contact-forms', { keyPath: 'id', autoIncrement: true });
        }
      }
    });
    
    // Get all stored form submissions
    const tx = db.transaction('contact-forms', 'readwrite');
    const store = tx.objectStore('contact-forms');
    const submissions = await store.getAll();
    
    // Process each submission
    for (const submission of submissions) {
      try {
        // Attempt to send to server
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submission.data)
        });
        
        // If successful, remove from IndexedDB
        if (response.ok) {
          await store.delete(submission.id);
          swLog.info(`Successfully synced contact form submission ${submission.id}`);
        } else {
          swLog.error(`Failed to sync contact form submission ${submission.id}:`, await response.text());
        }
      } catch (err) {
        swLog.error(`Error syncing contact form submission ${submission.id}:`, err);
        // Leave in IndexedDB for next sync attempt
      }
    }
    
    await tx.complete;
  } catch (error) {
    swLog.error('Error in contact form sync:', error);
  }
}

// Function to sync newsletter subscriptions
async function syncNewsletterForm() {
  try {
    // Open IndexedDB database
    const db = await openDB('form-data', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('newsletter-forms')) {
          db.createObjectStore('newsletter-forms', { keyPath: 'id', autoIncrement: true });
        }
      }
    });
    
    // Get all stored newsletter submissions
    const tx = db.transaction('newsletter-forms', 'readwrite');
    const store = tx.objectStore('newsletter-forms');
    const submissions = await store.getAll();
    
    // Process each subscription
    for (const submission of submissions) {
      try {
        // Attempt to send to server
        const response = await fetch('/api/newsletter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submission.data)
        });
        
        // If successful, remove from IndexedDB
        if (response.ok) {
          await store.delete(submission.id);
          swLog.info(`Successfully synced newsletter subscription ${submission.id}`);
        } else {
          swLog.error(`Failed to sync newsletter subscription ${submission.id}:`, await response.text());
        }
      } catch (err) {
        swLog.error(`Error syncing newsletter subscription ${submission.id}:`, err);
        // Leave in IndexedDB for next sync attempt
      }
    }
    
    await tx.complete;
  } catch (error) {
    swLog.error('Error in newsletter sync:', error);
  }
}

// IndexedDB helper function
function openDB(name, version, upgradeCallback) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    if (upgradeCallback) {
      request.onupgradeneeded = event => upgradeCallback(request.result, event);
    }
  });
}

// Push notification support
self.addEventListener('push', event => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'New content is available',
      icon: data.icon || '/logo.svg',
      badge: data.badge || '/favicon.svg',
      data: data.data || {},
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'App Update', options)
    );
  } catch (error) {
    // Fallback for non-JSON push messages
    event.waitUntil(
      self.registration.showNotification('New Update', {
        body: event.data.text(),
        icon: '/logo.svg'
      })
    );
  }
});

// Click event for push notifications
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  // Handle notification click - navigate to appropriate URL
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(windowClients => {
        // Check if there is already a window/tab open with the target URL
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window/tab is open or URL doesn't match, open new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});