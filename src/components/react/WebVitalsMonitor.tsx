import React, {
	useState,
	useEffect,
	type JSX,
	type CSSProperties,
} from "react";
import { log } from "../../lib/constants";

// Define types for web vitals metrics
type MetricRating = "good" | "needs-improvement" | "poor" | string;

interface WebVitalMetric {
	value: number;
	rating: MetricRating;
}

export interface WebVitalsMetrics {
	[key: string]: WebVitalMetric;
}

interface FormatMetricNameResult {
	full: string;
	desc: string;
}

export interface WebVitalsMonitorProps {
	showByDefault?: boolean;
}

// Dynamically import web vitals to avoid SSR issues
let getWebVitalsMetrics: () => Promise<WebVitalsMetrics>;

// We'll import this lazily to avoid issues during SSR
const importWebVitals = async (): Promise<boolean> => {
	try {
		const webVitalsModule = await import("../../lib/webVitals");
		getWebVitalsMetrics = webVitalsModule.getWebVitalsMetrics;

		// Also initialize Web Vitals monitoring
		try {
			if (
				webVitalsModule &&
				typeof webVitalsModule.initWebVitals === "function"
			) {
				webVitalsModule.initWebVitals();
			}
		} catch (error) {
			log.error("Failed to initialize Web Vitals: " + error);
		}

		return true;
	} catch (error) {
		log.error("Failed to import Web Vitals: " + error);
		return false;
	}
};

/**
 * Get rating color based on Web Vitals rating
 */
function getRatingColor(rating: MetricRating): string {
	switch (rating) {
		case "good":
			return "var(--color-success)";
		case "needs-improvement":
			return "var(--color-warning)";
		case "poor":
			return "var(--color-error)";
		default:
			return "var(--color-neutral)";
	}
}

/**
 * Format metric name for display
 */
function formatMetricName(name: string): FormatMetricNameResult {
	switch (name) {
		case "CLS":
			return { full: "Cumulative Layout Shift", desc: "Visual stability" };
		case "FID":
			return { full: "First Input Delay", desc: "Interactivity" };
		case "LCP":
			return { full: "Largest Contentful Paint", desc: "Loading performance" };
		case "FCP":
			return { full: "First Contentful Paint", desc: "Initial rendering" };
		case "TTFB":
			return { full: "Time to First Byte", desc: "Server response time" };
		case "INP":
			return {
				full: "Interaction to Next Paint",
				desc: "Input responsiveness",
			};
		default:
			return { full: name, desc: "Performance metric" };
	}
}

/**
 * Format metric value for display
 */
function formatMetricValue(name: string, value: number): string {
	if (name === "CLS") {
		return value.toFixed(3); // CLS has no units
	} else {
		return `${value.toFixed(0)}ms`; // All other metrics are in milliseconds
	}
}

/**
 * WebVitalsMonitor component
 * Displays Core Web Vitals metrics in a UI panel
 */
export default function WebVitalsMonitor({
	showByDefault = false,
}: WebVitalsMonitorProps): JSX.Element {
	const [metrics, setMetrics] = useState<WebVitalsMetrics>({});
	const [isVisible, setIsVisible] = useState<boolean>(showByDefault);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	useEffect(() => {
		let isMounted = true;

		const loadMetrics = async (): Promise<void> => {
			try {
				// First, ensure the web vitals module is loaded
				const isImported = await importWebVitals();
				if (!isImported || !isMounted) {
					setIsLoading(false);
					return;
				}

				// Wait for metrics to be collected
				// We need to wait a bit because some metrics take time to gather
				setTimeout(async () => {
					if (!isMounted) return;

					try {
						const webVitals = await getWebVitalsMetrics();
						if (isMounted) {
							setMetrics(webVitals);
							setIsLoading(false);
						}
					} catch (error) {
						log.error("Error fetching metrics: " + error);
						if (isMounted) {
							setIsLoading(false);
						}
					}
				}, 3000);
			} catch (error) {
				log.error("Failed to load Web Vitals metrics: " + error);
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		if (isVisible) {
			loadMetrics();
		}

		return () => {
			isMounted = false;
		};
	}, [isVisible]);

	const wvBase =
		"fixed bottom-5 right-5 z-[9999] bg-[var(--color-white)] dark:bg-[var(--color-surface-dark)] text-[var(--color-text)] dark:text-[var(--color-white)] font-sans text-left box-border";
	const wvToggle =
		"border border-[var(--color-border)] dark:border-[var(--color-surface-dark-muted)] rounded px-3 py-2 text-sm cursor-pointer shadow-[0_2px_5px_var(--color-shadow-soft)]";
	const wvPanel =
		"w-80 rounded-lg shadow-[0_4px_12px_var(--color-shadow-strong)] overflow-hidden";
	const wvHeader =
		"flex justify-between items-center px-4 py-3 bg-[var(--color-surface-muted)] dark:bg-[var(--color-surface-dark-muted)] border-b border-[var(--color-gray-200)] dark:border-[var(--color-surface-dark-border)]";
	const wvContent = "p-4";
	const wvLoading =
		"text-center py-5 text-[var(--color-text-muted)] dark:text-[var(--color-gray-500)]";
	const wvMetrics = "flex flex-col gap-4";
	const wvMetric = "flex flex-col gap-1";
	const wvMetricHeader = "flex justify-between items-center";
	const wvMetricInfo =
		"flex justify-between text-xs text-[var(--color-text-muted)] dark:text-[var(--color-gray-500)]";
	const wvMetricName = "font-semibold text-sm";
	const wvMetricValue = "font-semibold text-sm";
	const wvMetricBar =
		"h-1 rounded-sm mt-1 transition-[width] duration-300 ease-out";

	if (!isVisible) {
		return (
			<div className={wvBase}>
				<button
					onClick={() => setIsVisible(true)}
					className={wvToggle}
					aria-label="Show Web Vitals metrics"
				>
					📊 Web Vitals
				</button>
			</div>
		);
	}

	return (
		<div className={wvBase}>
			<div className={wvPanel}>
				<div className={wvHeader}>
					<h2 className="m-0 text-base font-semibold text-[var(--color-text-muted)] dark:text-[var(--color-gray-500)]">
						Core Web Vitals
					</h2>
					<button
						onClick={() => setIsVisible(false)}
						className="bg-transparent border-none cursor-pointer text-base p-0 text-[var(--color-text-muted)] dark:text-[var(--color-gray-500)] font-sans"
						aria-label="Close Web Vitals panel"
					>
						✕
					</button>
				</div>

				<div className={wvContent}>
					{isLoading ? (
						<div className={wvLoading}>Loading metrics...</div>
					) : (
						<div className={wvMetrics}>
							{Object.entries(metrics).length === 0 ? (
								<p className="m-0 p-0 leading-normal text-[var(--color-text)] dark:text-[var(--color-white)]">
									No metrics available yet. Try navigating the site first.
								</p>
							) : (
								Object.entries(metrics).map(([name, { value, rating }]) => (
									<div key={name} className={wvMetric}>
										<div className={wvMetricHeader}>
											<span className={wvMetricName}>{name}</span>
											<span
												className={wvMetricValue}
												style={
													{ color: getRatingColor(rating) } as CSSProperties
												}
											>
												{formatMetricValue(name, value)}
											</span>
										</div>
										<div className={wvMetricInfo}>
											<span>{formatMetricName(name).full}</span>
											<span>{formatMetricName(name).desc}</span>
										</div>
										<div
											className={wvMetricBar}
											style={
												{
													backgroundColor: getRatingColor(rating),
													width: `${Math.min(100, name === "CLS" ? value * 100 : value / 10)}%`,
												} as CSSProperties
											}
										/>
									</div>
								))
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
