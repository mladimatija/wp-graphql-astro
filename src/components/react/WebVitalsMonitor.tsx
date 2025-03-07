import {useState, useEffect, type JSX, type CSSProperties} from 'react';

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
    return true;
  } catch (error) {
    console.error('Failed to import Web Vitals:', error);
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
      return { full: 'Cumulative Layout Shift', desc: 'Visual stability' };
    case 'FID':
      return { full: 'First Input Delay', desc: 'Interactivity' };
    case 'LCP':
      return { full: 'Largest Contentful Paint', desc: 'Loading performance' };
    case 'FCP':
      return { full: 'First Contentful Paint', desc: 'Initial rendering' };
    case 'TTFB':
      return { full: 'Time to First Byte', desc: 'Server response time' };
    case 'INP':
      return { full: 'Interaction to Next Paint', desc: 'Input responsiveness' };
    default:
      return { full: name, desc: 'Performance metric' };
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
export default function WebVitalsMonitor({ showByDefault = false }: WebVitalsMonitorProps): JSX.Element {
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
            console.error('Error fetching metrics:', error);
            if (isMounted) {
              setIsLoading(false);
            }
          }
        }, 3000);
      } catch (error) {
        console.error('Failed to load Web Vitals metrics:', error);
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

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="web-vitals-toggle"
        aria-label="Show Web Vitals metrics"
      >
        📊 Web Vitals
      </button>
    );
  }

  return (
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
              Object.entries(metrics).map(([name, { value, rating }]) => (
                <div key={name} className="web-vitals-metric">
                  <div className="metric-header">
                    <span className="metric-name">{name}</span>
                    <span 
                      className="metric-value"
                      style={{ color: getRatingColor(rating) } as CSSProperties}
                    >
                      {formatMetricValue(name, value)}
                    </span>
                  </div>
                  <div className="metric-info">
                    <span className="metric-full-name">{formatMetricName(name).full}</span>
                    <span className="metric-description">{formatMetricName(name).desc}</span>
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

      <style>{`
        .web-vitals-toggle {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          background: #ffffff;
          border: 1px solid #dddddd;
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .web-vitals-monitor {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 320px;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          overflow: hidden;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .web-vitals-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f5f5f5;
          border-bottom: 1px solid #eeeeee;
        }
        
        .web-vitals-header h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .web-vitals-header button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 0;
          color: #666666;
        }
        
        .web-vitals-content {
          padding: 16px;
        }
        
        .web-vitals-loading {
          text-align: center;
          padding: 20px 0;
          color: #666666;
        }
        
        .web-vitals-metrics {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .web-vitals-metric {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .metric-name {
          font-weight: 600;
          font-size: 14px;
        }
        
        .metric-value {
          font-weight: 600;
          font-size: 14px;
        }
        
        .metric-info {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666666;
        }
        
        .metric-bar {
          height: 4px;
          border-radius: 2px;
          margin-top: 4px;
          transition: width 0.3s ease;
        }
        
        @media (prefers-color-scheme: dark) {
          .web-vitals-toggle,
          .web-vitals-monitor {
            background: #222222;
            color: #ffffff;
            border-color: #333333;
          }
          
          .web-vitals-header {
            background: #333333;
            border-color: #444444;
          }
          
          .web-vitals-header button,
          .web-vitals-loading,
          .metric-info {
            color: #aaaaaa;
          }
        }
      `}</style>
    </div>
  );
}