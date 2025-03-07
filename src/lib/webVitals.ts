/**
 * Web Vitals monitoring utilities
 * 
 * This file contains functions for measuring and reporting Core Web Vitals metrics
 * using the official web-vitals library.
 * 
 * @see https://web.dev/vitals/ for more information on Core Web Vitals
 */

// Import individual functions from web-vitals v4
import { onCLS, onFID, onLCP, onFCP, onTTFB, onINP } from 'web-vitals';

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
    navigationType: metric.navigationType,
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
    onCLS(sendToAnalytics);  // Cumulative Layout Shift
    onFID(sendToAnalytics);  // First Input Delay
    onLCP(sendToAnalytics);  // Largest Contentful Paint
    onFCP(sendToAnalytics);  // First Contentful Paint
    onTTFB(sendToAnalytics); // Time to First Byte
    onINP(sendToAnalytics);  // Interaction to Next Paint (new in v4)
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
      let remaining = 6; // Number of metrics we're waiting for (added INP)
      
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
      
      onCLS(saveMetric);
      onFID(saveMetric);
      onLCP(saveMetric);
      onFCP(saveMetric);
      onTTFB(saveMetric);
      onINP(saveMetric); // New in v4
    } catch (error) {
      console.error('Failed to get Web Vitals metrics:', error);
      resolve({});
    }
  });
}

// Export the individual metrics functions for custom use
export { onCLS, onFID, onLCP, onFCP, onTTFB, onINP };