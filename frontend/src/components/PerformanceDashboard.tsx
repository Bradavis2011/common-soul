import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  Zap, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  memoryUsage?: number;
  jsHeapSize?: number;
}

interface ErrorStats {
  errorCount: number;
  lastError?: string;
  errorRate: number;
}

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [errors, setErrors] = useState<ErrorStats>({ errorCount: 0, errorRate: 0 });
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development or for admin users
  useEffect(() => {
    const shouldShow = 
      import.meta.env.DEV || 
      localStorage.getItem('showPerformanceDashboard') === 'true' ||
      window.location.search.includes('debug=true');
    
    setIsVisible(shouldShow);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    collectPerformanceMetrics();
    
    // Set up periodic collection
    const interval = setInterval(collectPerformanceMetrics, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [isVisible]);

  const collectPerformanceMetrics = () => {
    if (!window.performance) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const memoryInfo = (performance as any).memory;

    if (navigation) {
      const newMetrics: PerformanceMetrics = {
        pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
        firstContentfulPaint: getMetricByName('first-contentful-paint') || 0,
        largestContentfulPaint: getMetricByName('largest-contentful-paint') || 0,
        firstInputDelay: getMetricByName('first-input-delay') || 0,
        cumulativeLayoutShift: getMetricByName('cumulative-layout-shift') || 0,
        timeToInteractive: navigation.domInteractive - navigation.navigationStart,
        memoryUsage: memoryInfo?.usedJSHeapSize ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : undefined,
        jsHeapSize: memoryInfo?.totalJSHeapSize ? Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024) : undefined
      };

      setMetrics(newMetrics);
    }

    // Collect error stats from console errors
    collectErrorStats();
  };

  const getMetricByName = (name: string): number => {
    const entries = performance.getEntriesByName(name);
    return entries.length > 0 ? entries[0].startTime : 0;
  };

  const collectErrorStats = () => {
    // In a real implementation, you'd track errors from your error tracking system
    const errorCount = parseInt(localStorage.getItem('errorCount') || '0');
    const lastError = localStorage.getItem('lastError') || undefined;
    
    setErrors({
      errorCount,
      lastError,
      errorRate: errorCount / (Date.now() / 1000 / 60 / 60) // Errors per hour
    });
  };

  const getMetricStatus = (value: number, thresholds: { good: number; fair: number }): 'good' | 'fair' | 'poor' => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.fair) return 'fair';
    return 'poor';
  };

  const getStatusColor = (status: 'good' | 'fair' | 'poor'): string => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: 'good' | 'fair' | 'poor') => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'fair': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'poor': return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  };

  if (!isVisible || !metrics) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 z-50">
      <Card className="bg-background/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Performance Monitor
            <Button
              variant="ghost"
              size="sm"
              onClick={collectPerformanceMetrics}
              className="ml-auto p-1 h-6 w-6"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {/* Core Web Vitals */}
          <div>
            <h4 className="font-medium text-xs mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Core Web Vitals
            </h4>
            <div className="space-y-2">
              <MetricRow 
                label="LCP" 
                value={`${Math.round(metrics.largestContentfulPaint)}ms`}
                status={getMetricStatus(metrics.largestContentfulPaint, { good: 2500, fair: 4000 })}
              />
              <MetricRow 
                label="FID" 
                value={`${Math.round(metrics.firstInputDelay)}ms`}
                status={getMetricStatus(metrics.firstInputDelay, { good: 100, fair: 300 })}
              />
              <MetricRow 
                label="CLS" 
                value={metrics.cumulativeLayoutShift.toFixed(3)}
                status={getMetricStatus(metrics.cumulativeLayoutShift, { good: 0.1, fair: 0.25 })}
              />
            </div>
          </div>

          <Separator />

          {/* Page Performance */}
          <div>
            <h4 className="font-medium text-xs mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Page Performance
            </h4>
            <div className="space-y-2">
              <MetricRow 
                label="Page Load" 
                value={`${Math.round(metrics.pageLoadTime)}ms`}
                status={getMetricStatus(metrics.pageLoadTime, { good: 1000, fair: 3000 })}
              />
              <MetricRow 
                label="FCP" 
                value={`${Math.round(metrics.firstContentfulPaint)}ms`}
                status={getMetricStatus(metrics.firstContentfulPaint, { good: 1800, fair: 3000 })}
              />
              <MetricRow 
                label="TTI" 
                value={`${Math.round(metrics.timeToInteractive)}ms`}
                status={getMetricStatus(metrics.timeToInteractive, { good: 3800, fair: 7300 })}
              />
            </div>
          </div>

          {/* Memory Usage */}
          {metrics.memoryUsage && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-xs mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Memory Usage
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>JS Heap</span>
                    <span className="font-mono">{metrics.memoryUsage}MB</span>
                  </div>
                  {metrics.jsHeapSize && (
                    <Progress 
                      value={(metrics.memoryUsage / metrics.jsHeapSize) * 100} 
                      className="h-1"
                    />
                  )}
                </div>
              </div>
            </>
          )}

          {/* Error Stats */}
          <Separator />
          <div>
            <h4 className="font-medium text-xs mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Error Tracking
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Error Count</span>
                <Badge variant={errors.errorCount > 0 ? "destructive" : "secondary"}>
                  {errors.errorCount}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Error Rate</span>
                <span className="font-mono">{errors.errorRate.toFixed(2)}/hr</span>
              </div>
              {errors.lastError && (
                <div className="text-xs text-muted-foreground truncate">
                  Last: {errors.lastError}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <Separator />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="flex-1 text-xs h-6"
            >
              Hide
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.setItem('showPerformanceDashboard', 'false');
                setIsVisible(false);
              }}
              className="flex-1 text-xs h-6"
            >
              Disable
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface MetricRowProps {
  label: string;
  value: string;
  status: 'good' | 'fair' | 'poor';
}

const MetricRow: React.FC<MetricRowProps> = ({ label, value, status }) => {
  const getStatusColor = (status: 'good' | 'fair' | 'poor'): string => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: 'good' | 'fair' | 'poor') => {
    switch (status) {
      case 'good': return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'fair': return <Clock className="w-3 h-3 text-yellow-600" />;
      case 'poor': return <AlertTriangle className="w-3 h-3 text-red-600" />;
    }
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-1">
        {getStatusIcon(status)}
        <span>{label}</span>
      </div>
      <span className={`font-mono ${getStatusColor(status)}`}>{value}</span>
    </div>
  );
};

export default PerformanceDashboard;