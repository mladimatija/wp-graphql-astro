// Service Worker for WP-GraphQL-Astro
const CACHE_NAME = 'wp-graphql-astro-v1';
const CONTENT_CACHE = 'wp-graphql-astro-content-v1';
const STATIC_CACHE = 'wp-graphql-astro-static-v1';
const IMAGE_CACHE = 'wp-graphql-astro-images-v1';
const API_CACHE = 'wp-graphql-astro-api-v1';

// Assets to cache on install (critical assets for app shell)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/logo.png',
  '/manifest.json',
  '/404.webp',
  '/offline.html',
  '/css/styles.css'
];

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

// Install event - precache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Cache critical assets in main cache
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(PRECACHE_ASSETS)),
      
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
          console.log('Deleting old cache:', cacheName);
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
          // Try to get from cache first
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If not in cache, return the offline page
          return caches.match('/offline.html');
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
                console.log('Background fetch failed, using cached version');
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
              console.error('Fetching failed:', error);
              // For images, we could return a fallback image
              if (event.request.destination === 'image') {
                return caches.match('/logo.png');
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
          console.log(`Successfully synced contact form submission ${submission.id}`);
        } else {
          console.error(`Failed to sync contact form submission ${submission.id}:`, await response.text());
        }
      } catch (err) {
        console.error(`Error syncing contact form submission ${submission.id}:`, err);
        // Leave in IndexedDB for next sync attempt
      }
    }
    
    await tx.complete;
  } catch (error) {
    console.error('Error in contact form sync:', error);
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
          console.log(`Successfully synced newsletter subscription ${submission.id}`);
        } else {
          console.error(`Failed to sync newsletter subscription ${submission.id}:`, await response.text());
        }
      } catch (err) {
        console.error(`Error syncing newsletter subscription ${submission.id}:`, err);
        // Leave in IndexedDB for next sync attempt
      }
    }
    
    await tx.complete;
  } catch (error) {
    console.error('Error in newsletter sync:', error);
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
      icon: data.icon || '/logo.png',
      badge: data.badge || '/favicon.svg',
      data: data.data || {},
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'WP GraphQL Astro Update', options)
    );
  } catch (error) {
    // Fallback for non-JSON push messages
    event.waitUntil(
      self.registration.showNotification('New Update', {
        body: event.data.text(),
        icon: '/logo.png'
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