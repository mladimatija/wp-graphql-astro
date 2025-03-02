/**
 * Web Vitals monitoring utilities
 * 
 * This file contains functions for measuring and reporting Core Web Vitals metrics
 * using the official web-vitals library.
 * 
 * @see https://web.dev/vitals/ for more information on Core Web Vitals
 */

// Import individual functions from web-vitals
import { getCLS, getFID, getLCP, getFCP, getTTFB } from 'web-vitals';

import type {WebVitalsMetrics} from '../components/react/WebVitalsMonitor';

/**
 * Analytics endpoint for reporting Web Vitals
 * Change this to your own analytics endpoint
 */
const analyticsEndpoint = import.meta.env.PUBLIC_ANALYTICS_ENDPOINT || '';

/**
 * Reports Web Vitals metrics to your analytics endpoint
 * 
 * @param {Object} metric - Web Vitals metric object
 */
function sendToAnalytics(metric) {
  // Early return if no analytics endpoint is configured
  if (!analyticsEndpoint) {
    // Log metrics in development mode
    if (import.meta.env.DEV) {
      console.log(`Web Vitals: ${metric.name} = ${metric.value}`);
    }
    return;
  }

  // Prepare the data to send
  const body = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating, // "good", "needs-improvement", or "poor"
    delta: metric.delta,
    id: metric.id,
    page: window.location.pathname,
    // Add any additional data you want to collect
    screenWidth: window.innerWidth,
    dpr: window.devicePixelRatio,
    timestamp: new Date().toISOString(),
  };

  // Use `navigator.sendBeacon()` if available
  if (navigator.sendBeacon && typeof Blob !== 'undefined') {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
    navigator.sendBeacon(analyticsEndpoint, blob);
  } else {
    // Fall back to fetch() for older browsers
    fetch(analyticsEndpoint, {
      body: JSON.stringify(body),
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

/**
 * Initializes Web Vitals monitoring
 * Call this function when your app loads to start monitoring
 */
export function initWebVitals() {
  // Only run in the browser
  if (typeof window === 'undefined') return;

  try {
    // Measure and report each Core Web Vital
    getCLS(sendToAnalytics);  // Cumulative Layout Shift
    getFID(sendToAnalytics);  // First Input Delay
    getLCP(sendToAnalytics);  // Largest Contentful Paint
    getFCP(sendToAnalytics);  // First Contentful Paint
    getTTFB(sendToAnalytics); // Time to First Byte
  } catch (error) {
    console.error('Failed to initialize Web Vitals:', error);
  }
}

/**
 * Retrieve Web Vitals metrics for client-side reporting
 * This can be used to display metrics in a UI component
 * 
 * @returns {Promise<Object>} Object containing all core metrics
 */
export async function getWebVitalsMetrics() {
  return new Promise<WebVitalsMetrics>((resolve) => {
    if (typeof window === 'undefined') {
      resolve({});
      return;
    }

    try {
      const metrics = {};
      let remaining = 5; // Number of metrics we're waiting for
      
      function saveMetric(metric) {
        metrics[metric.name] = {
          value: metric.value,
          rating: metric.rating,
        };
        remaining--;
        
        if (remaining <= 0) {
          resolve(metrics);
        }
      }
      
      getCLS(saveMetric);
      getFID(saveMetric);
      getLCP(saveMetric);
      getFCP(saveMetric);
      getTTFB(saveMetric);
    } catch (error) {
      console.error('Failed to get Web Vitals metrics:', error);
      resolve({});
    }
  });
}

// Export the individual metrics functions for custom use
export { getCLS, getFID, getLCP, getFCP, getTTFB };