import {useState, useEffect, type JSX, type CSSProperties} from 'react';
import { log } from '../../lib/constants';

// Define types for web vitals metrics
type MetricRating = 'good' | 'needs-improvement' | 'poor' | string;

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
        const webVitalsModule = await import('../../lib/webVitals');
        getWebVitalsMetrics = webVitalsModule.getWebVitalsMetrics;

        // Also initialize Web Vitals monitoring
        try {
            if (webVitalsModule && typeof webVitalsModule.initWebVitals === 'function') {
                webVitalsModule.initWebVitals();
            }
        } catch (error) {
            log.error('Failed to initialize Web Vitals:', error);
        }

        return true;
    } catch (error) {
        log.error('Failed to import Web Vitals:', error);
        return false;
    }
};

/**
 * Get rating color based on Web Vitals rating
 */
function getRatingColor(rating: MetricRating): string {
    switch (rating) {
        case 'good':
            return 'var(--color-success, #0cce6b)';
        case 'needs-improvement':
            return 'var(--color-warning, #ffa400)';
        case 'poor':
            return 'var(--color-error, #ff4e42)';
        default:
            return 'var(--color-neutral, #999999)';
    }
}

/**
 * Format metric name for display
 */
function formatMetricName(name: string): FormatMetricNameResult {
    switch (name) {
        case 'CLS':
            return {full: 'Cumulative Layout Shift', desc: 'Visual stability'};
        case 'FID':
            return {full: 'First Input Delay', desc: 'Interactivity'};
        case 'LCP':
            return {full: 'Largest Contentful Paint', desc: 'Loading performance'};
        case 'FCP':
            return {full: 'First Contentful Paint', desc: 'Initial rendering'};
        case 'TTFB':
            return {full: 'Time to First Byte', desc: 'Server response time'};
        case 'INP':
            return {full: 'Interaction to Next Paint', desc: 'Input responsiveness'};
        default:
            return {full: name, desc: 'Performance metric'};
    }
}

/**
 * Format metric value for display
 */
function formatMetricValue(name: string, value: number): string {
    if (name === 'CLS') {
        return value.toFixed(3); // CLS has no units
    } else {
        return `${value.toFixed(0)}ms`; // All other metrics are in milliseconds
    }
}

/**
 * WebVitalsMonitor component
 * Displays Core Web Vitals metrics in a UI panel
 */
export default function WebVitalsMonitor({showByDefault = false}: WebVitalsMonitorProps): JSX.Element {
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
                        log.error('Error fetching metrics:', error);
                        if (isMounted) {
                            setIsLoading(false);
                        }
                    }
                }, 3000);
            } catch (error) {
                log.error('Failed to load Web Vitals metrics:', error);
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

    // Use a unique wrapper class for style encapsulation
    const WebVitalsWrapper = ({children}: { children: React.ReactNode }) => (
        <div className="web-vitals-wrapper">{children}</div>
    );

    if (!isVisible) {
        return (
            <WebVitalsWrapper>
                <button
                    onClick={() => setIsVisible(true)}
                    className="web-vitals-toggle"
                    aria-label="Show Web Vitals metrics"
                >
                    📊 Web Vitals
                </button>
            </WebVitalsWrapper>
        );
    }

    return (
        <>
            <WebVitalsWrapper>
                <div className="web-vitals-monitor">
                    <div className="web-vitals-header">
                        <h2>Core Web Vitals</h2>
                        <button
                            onClick={() => setIsVisible(false)}
                            aria-label="Close Web Vitals panel"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="web-vitals-content">
                        {isLoading ? (
                            <div className="web-vitals-loading">Loading metrics...</div>
                        ) : (
                            <div className="web-vitals-metrics">
                                {Object.entries(metrics).length === 0 ? (
                                    <p>No metrics available yet. Try navigating the site first.</p>
                                ) : (
                                    Object.entries(metrics).map(([name, {value, rating}]) => (
                                        <div key={name} className="web-vitals-metric">
                                            <div className="metric-header">
                                                <span className="metric-name">{name}</span>
                                                <span
                                                    className="metric-value"
                                                    style={{color: getRatingColor(rating)} as CSSProperties}
                                                >
                                                    {formatMetricValue(name, value)}
                                                </span>
                                            </div>
                                            <div className="metric-info">
                                                <span className="metric-full-name">{formatMetricName(name).full}</span>
                                                <span
                                                    className="metric-description">{formatMetricName(name).desc}</span>
                                            </div>
                                            <div
                                                className="metric-bar"
                                                style={{
                                                    backgroundColor: getRatingColor(rating),
                                                    width: `${Math.min(100, name === 'CLS' ? value * 100 : value / 10)}%`
                                                } as CSSProperties}
                                            />
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </WebVitalsWrapper>

            <style>{`
        /* Component-scoped CSS variables and styles */
        .web-vitals-wrapper {
          --wv-space-xs: 4px;
          --wv-space-sm: 8px;
          --wv-space-md: 12px;
          --wv-space-lg: 16px;
          --wv-space-xl: 20px;
          
          --wv-font-sm: 12px;
          --wv-font-md: 14px;
          --wv-font-lg: 16px;
          --wv-font-weight: 600;
          
          --wv-bg: #fff;
          --wv-bg-header: #f5f5f5;
          --wv-text: #333;
          --wv-text-muted: #666;
          --wv-border: #ddd;
          --wv-border-inner: #eee;
          
          --wv-radius-sm: 2px;
          --wv-radius-md: 4px;
          --wv-radius-lg: 8px;
          --wv-shadow-sm: 0 2px 5px rgba(0, 0, 0, 0.1);
          --wv-shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.15);
          --wv-z-index: 9999;
          --wv-transition: width 0.3s ease;
          
          /* Reset box model to prevent leaks */
          box-sizing: border-box;
          line-height: normal;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          text-align: left;
        }
        
        /* Dark theme adjustments */
        @media (prefers-color-scheme: dark) {
          .web-vitals-wrapper {
            --wv-bg: #222;
            --wv-bg-header: #333;
            --wv-text: #fff;
            --wv-text-muted: #aaa;
            --wv-border: #333;
            --wv-border-inner: #444;
          }
        }
        
        /* Reset all elements inside wrapper to prevent style leakage */
        .web-vitals-wrapper *,
        .web-vitals-wrapper *::before,
        .web-vitals-wrapper *::after {
          box-sizing: inherit;
          margin: 0;
          padding: 0;
        }
        
        /* Common positioning for both toggle and monitor */
        .web-vitals-wrapper .web-vitals-toggle,
        .web-vitals-wrapper .web-vitals-monitor {
          position: fixed;
          bottom: var(--wv-space-xl);
          right: var(--wv-space-xl);
          z-index: var(--wv-z-index);
          background: var(--wv-bg);
          color: var(--wv-text);
        }
        
        /* Toggle button */
        .web-vitals-wrapper .web-vitals-toggle {
          border: 1px solid var(--wv-border);
          border-radius: var(--wv-radius-md);
          padding: var(--wv-space-sm) var(--wv-space-md);
          font-size: var(--wv-font-md);
          cursor: pointer;
          box-shadow: var(--wv-shadow-sm);
          font-family: inherit;
        }
        
        /* Monitor panel */
        .web-vitals-wrapper .web-vitals-monitor {
          width: 320px;
          border-radius: var(--wv-radius-lg);
          box-shadow: var(--wv-shadow-lg);
          overflow: hidden;
        }
        
        /* Header section */
        .web-vitals-wrapper .web-vitals-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--wv-space-md) var(--wv-space-lg);
          background: var(--wv-bg-header);
          border-bottom: 1px solid var(--wv-border-inner);
        }
        
        .web-vitals-wrapper .web-vitals-header h2 {
          margin: 0;
          font-size: var(--wv-font-lg);
          font-weight: var(--wv-font-weight);
          color: var(--wv-text-muted);
        }
        
        .web-vitals-wrapper .web-vitals-header button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: var(--wv-font-lg);
          padding: 0;
          color: var(--wv-text-muted);
          font-family: inherit;
        }
        
        /* Content area */
        .web-vitals-wrapper .web-vitals-content {
          padding: var(--wv-space-lg);
        }
        
        .web-vitals-wrapper .web-vitals-loading {
          text-align: center;
          padding: var(--wv-space-xl) 0;
          color: var(--wv-text-muted);
        }
        
        /* Common flex column layout */
        .web-vitals-wrapper .web-vitals-metrics,
        .web-vitals-wrapper .web-vitals-metric {
          display: flex;
          flex-direction: column;
        }
        
        .web-vitals-wrapper .web-vitals-metrics {
          gap: var(--wv-space-lg);
        }
        
        .web-vitals-wrapper .web-vitals-metric {
          gap: var(--wv-space-xs);
        }
        
        /* Metric components */
        .web-vitals-wrapper .metric-header,
        .web-vitals-wrapper .metric-info {
          display: flex;
          justify-content: space-between;
        }
        
        .web-vitals-wrapper .metric-header {
          align-items: center;
        }
        
        .web-vitals-wrapper .metric-name,
        .web-vitals-wrapper .metric-value {
          font-weight: var(--wv-font-weight);
          font-size: var(--wv-font-md);
        }
        
        .web-vitals-wrapper .metric-info {
          font-size: var(--wv-font-sm);
          color: var(--wv-text-muted);
        }
        
        .web-vitals-wrapper .metric-bar {
          height: 4px;
          border-radius: var(--wv-radius-sm);
          margin-top: var(--wv-space-xs);
          transition: var(--wv-transition);
        }
        
        /* Reset paragraph styles to prevent conflicts */
        .web-vitals-wrapper p {
          margin: 0;
          padding: 0;
          line-height: 1.5;
          color: var(--wv-text);
        }
      `}</style>
        </>)
};