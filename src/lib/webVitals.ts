/**
 * Web Vitals monitoring utilities
 *
 * This file contains functions for measuring and reporting Core Web Vitals metrics
 * using the official web-vitals library.
 *
 * @see https://web.dev/vitals/ for more information on Core Web Vitals
 */

// Import individual functions from web-vitals v6
import { onCLS, onLCP, onFCP, onTTFB, onINP } from "web-vitals";
import { log } from "./constants";

import type { MetricType, ReportOpts } from "web-vitals";
import type { WebVitalsMetrics } from "../components/react/WebVitalsMonitor";

/**
 * Analytics endpoint for reporting Web Vitals.
 * Change this to your own analytics endpoint.
 */
const analyticsEndpoint = import.meta.env.PUBLIC_ANALYTICS_ENDPOINT || "";

/**
 * How many distinct metrics `getWebVitalsMetrics()` waits for: CLS, LCP, FCP,
 * TTFB and INP.
 */
const EXPECTED_METRIC_COUNT = 5;

/**
 * How long `getWebVitalsMetrics()` waits before resolving with a partial
 * result. Not every metric is guaranteed to arrive — INP needs an interaction
 * and CLS is finalised when the page is hidden — so without a deadline the
 * promise could never settle.
 */
const METRICS_TIMEOUT_MS = 5000;

/**
 * Shared reporting options.
 *
 * `reportSoftNavs` is opt-in as of web-vitals v6. The site uses Astro's
 * `<ClientRouter />`, so most navigations after the initial load are soft
 * navigations — without this, only the first page of a session is measured.
 *
 * Note that enabling it means a callback may fire more than once per page load,
 * once per navigation.
 */
const reportOpts: ReportOpts = { reportSoftNavs: true };

/**
 * Resolves the path a metric belongs to.
 *
 * With soft navigations a metric can be reported after the user has already
 * navigated away, so `window.location` is not reliable — `navigationURL` (an
 * absolute URL) records where the metric actually happened.
 */
function getMetricPath(metric: MetricType): string {
	if (metric.navigationURL) {
		try {
			return new URL(metric.navigationURL).pathname;
		} catch {
			// Fall through to the current location below.
		}
	}
	return window.location.pathname;
}

/**
 * Reports Web Vitals metrics to your analytics endpoint
 *
 * @param {Object} metric - Web Vitals metric object
 */
function sendToAnalytics(metric: MetricType) {
	// Early return if no analytics endpoint is configured
	if (!analyticsEndpoint) {
		// Log metrics in development mode or if debugging is enabled
		log.debug(`Web Vitals: ${metric.name} = ${metric.value}`);
		return;
	}

	// Prepare the data to send
	const body = {
		name: metric.name,
		value: metric.value,
		rating: metric.rating, // "good", "needs-improvement", or "poor"
		delta: metric.delta,
		id: metric.id,
		page: getMetricPath(metric),
		// Add any additional data you want to collect
		screenWidth: window.innerWidth,
		dpr: window.devicePixelRatio,
		timestamp: new Date().toISOString(),
		navigationType: metric.navigationType,
	};

	// Use `navigator.sendBeacon()` if available
	if (navigator.sendBeacon && typeof Blob !== "undefined") {
		const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
		navigator.sendBeacon(analyticsEndpoint, blob);
	} else {
		// Fall back to fetch() for older browsers
		fetch(analyticsEndpoint, {
			body: JSON.stringify(body),
			method: "POST",
			keepalive: true,
			headers: {
				"Content-Type": "application/json",
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
	if (typeof window === "undefined") return;

	try {
		// Measure and report each Core Web Vital
		onCLS(sendToAnalytics, reportOpts); // Cumulative Layout Shift
		onLCP(sendToAnalytics, reportOpts); // Largest Contentful Paint
		onFCP(sendToAnalytics, reportOpts); // First Contentful Paint
		onTTFB(sendToAnalytics, reportOpts); // Time to First Byte
		onINP(sendToAnalytics, reportOpts); // Interaction to Next Paint (replaced FID in v5)
	} catch (error) {
		log.error(`Failed to initialize Web Vitals: ${error}`);
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
		if (typeof window === "undefined") {
			resolve({});
			return;
		}

		try {
			const metrics: WebVitalsMetrics = {};

			// Resolve on a deadline as well as on completion, and count distinct
			// metric names rather than callbacks: a callback can fire repeatedly
			// for the same metric (CLS updates until the page is hidden, and every
			// metric reports again per soft navigation), so counting calls would
			// resolve early with a partial result.
			const timeoutId = setTimeout(() => resolve(metrics), METRICS_TIMEOUT_MS);

			function saveMetric(metric: MetricType) {
				metrics[metric.name] = {
					value: metric.value,
					rating: metric.rating,
				};

				if (Object.keys(metrics).length >= EXPECTED_METRIC_COUNT) {
					clearTimeout(timeoutId);
					resolve(metrics);
				}
			}

			onCLS(saveMetric, reportOpts);
			onLCP(saveMetric, reportOpts);
			onFCP(saveMetric, reportOpts);
			onTTFB(saveMetric, reportOpts);
			onINP(saveMetric, reportOpts);
		} catch (error) {
			log.error(`Failed to get Web Vitals metrics: ${error}`);
			resolve({});
		}
	});
}

// Export the individual metrics functions for custom use
export { onCLS, onLCP, onFCP, onTTFB, onINP };
