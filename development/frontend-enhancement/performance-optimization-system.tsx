/**
 * Performance Optimization System for FlexTime
 * 
 * Features:
 * - Virtualized rendering for large datasets
 * - Progressive loading and caching
 * - Lazy loading components
 * - Memory-efficient data management
 * - Performance monitoring and metrics
 */

import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef,
  Suspense,
  lazy,
  memo,
  ReactNode
} from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Skeleton,
  Chip,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Speed as PerformanceIcon,
  Memory as MemoryIcon,
  Timeline as MetricsIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { FixedSizeList as List } from 'react-window';
import { FixedSizeGrid as Grid as VirtualGrid } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { debounce, throttle } from 'lodash';
import { useTheme } from '@mui/material/styles';

// Performance metrics interface
interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  fps: number;
  bundleSize: number;
  cacheHitRate: number;
  loadTime: number;
  interactionDelay: number;
}

// Data item interface for virtualization
interface VirtualizedItem {
  id: string;
  type: 'game' | 'team' | 'venue' | 'constraint';
  data: any;
  height?: number;
  isLoaded?: boolean;
}

// Cache implementation
class PerformanceCache {
  private cache = new Map<string, any>();
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds
  private accessTimes = new Map<string, number>();

  constructor(maxSize: number = 1000, ttl: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key: string, value: any): void {
    // Remove expired entries
    this.cleanup();
    
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.getOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.accessTimes.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
    this.accessTimes.set(key, Date.now());
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      return null;
    }

    // Update access time
    this.accessTimes.set(key, Date.now());
    return item.value;
  }

  has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
    this.accessTimes.clear();
  }

  getStats(): { size: number; hitRate: number; memoryUsage: number } {
    const totalRequests = this.accessTimes.size;
    const cacheHits = this.cache.size;
    
    return {
      size: this.cache.size,
      hitRate: totalRequests > 0 ? cacheHits / totalRequests : 0,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
      }
    }
  }

  private getOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    let totalSize = 0;
    for (const [key, value] of this.cache.entries()) {
      totalSize += key.length * 2; // UTF-16 characters
      totalSize += JSON.stringify(value).length * 2;
    }
    return totalSize;
  }
}

// Global cache instance
const globalCache = new PerformanceCache(5000, 10 * 60 * 1000);

// Performance monitoring hook
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    fps: 0,
    bundleSize: 0,
    cacheHitRate: 0,
    loadTime: 0,
    interactionDelay: 0
  });

  const measureRenderTime = useCallback((componentName: string, renderFn: () => void) => {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    setMetrics(prev => ({ ...prev, renderTime }));
    
    if (renderTime > 16) { // Slower than 60fps
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  }, []);

  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / (1024 * 1024) // Convert to MB
      }));
    }
  }, []);

  const measureFPS = useCallback(() => {
    let frames = 0;
    let startTime = performance.now();
    
    const countFrame = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= startTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - startTime));
        setMetrics(prev => ({ ...prev, fps }));
        frames = 0;
        startTime = currentTime;
      }
      
      requestAnimationFrame(countFrame);
    };
    
    requestAnimationFrame(countFrame);
  }, []);

  useEffect(() => {
    measureMemoryUsage();
    measureFPS();
    
    const interval = setInterval(() => {
      measureMemoryUsage();
      const cacheStats = globalCache.getStats();
      setMetrics(prev => ({
        ...prev,
        cacheHitRate: cacheStats.hitRate
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [measureMemoryUsage, measureFPS]);

  return {
    metrics,
    measureRenderTime,
    measureMemoryUsage
  };
};

// Virtualized List Component
interface VirtualizedListProps {
  items: VirtualizedItem[];
  itemHeight: number;
  height: number;
  width?: number;
  renderItem: (item: VirtualizedItem, index: number, style: React.CSSProperties) => ReactNode;
  onLoadMore?: (startIndex: number, stopIndex: number) => Promise<void>;
  hasNextPage?: boolean;
  loadingComponent?: ReactNode;
}

export const VirtualizedList: React.FC<VirtualizedListProps> = memo(({
  items,
  itemHeight,
  height,
  width = '100%',
  renderItem,
  onLoadMore,
  hasNextPage = false,
  loadingComponent
}) => {
  const { measureRenderTime } = usePerformanceMetrics();

  const itemCount = hasNextPage ? items.length + 1 : items.length;
  const isItemLoaded = useCallback((index: number) => !!items[index], [items]);

  const loadMoreItems = useCallback(async (startIndex: number, stopIndex: number) => {
    if (onLoadMore) {
      await onLoadMore(startIndex, stopIndex);
    }
  }, [onLoadMore]);

  const Item = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    
    if (!item) {
      return (
        <div style={style}>
          {loadingComponent || (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </div>
      );
    }

    return (
      <div style={style}>
        {renderItem(item, index, style)}
      </div>
    );
  }, [items, renderItem, loadingComponent]);

  const MeasuredItem = useCallback((props: any) => {
    const renderItemWithMetrics = () => <Item {...props} />;
    measureRenderTime('VirtualizedListItem', renderItemWithMetrics);
    return <Item {...props} />;
  }, [Item, measureRenderTime]);

  if (onLoadMore) {
    return (
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadMoreItems}
      >
        {({ onItemsRendered, ref }) => (
          <List
            ref={ref}
            height={height}
            width={width}
            itemCount={itemCount}
            itemSize={itemHeight}
            onItemsRendered={onItemsRendered}
            itemData={items}
          >
            {MeasuredItem}
          </List>
        )}
      </InfiniteLoader>
    );
  }

  return (
    <List
      height={height}
      width={width}
      itemCount={itemCount}
      itemSize={itemHeight}
      itemData={items}
    >
      {MeasuredItem}
    </List>
  );
});

// Virtualized Grid Component
interface VirtualizedGridProps {
  items: VirtualizedItem[][];
  columnCount: number;
  rowCount: number;
  columnWidth: number;
  rowHeight: number;
  height: number;
  width: number;
  renderCell: (rowIndex: number, columnIndex: number, style: React.CSSProperties) => ReactNode;
}

export const VirtualizedGrid: React.FC<VirtualizedGridProps> = memo(({
  items,
  columnCount,
  rowCount,
  columnWidth,
  rowHeight,
  height,
  width,
  renderCell
}) => {
  const { measureRenderTime } = usePerformanceMetrics();

  const Cell = useCallback(({ 
    columnIndex, 
    rowIndex, 
    style 
  }: { 
    columnIndex: number; 
    rowIndex: number; 
    style: React.CSSProperties;
  }) => {
    const renderCellWithMetrics = () => renderCell(rowIndex, columnIndex, style);
    measureRenderTime('VirtualizedGridCell', renderCellWithMetrics);
    return <div style={style}>{renderCell(rowIndex, columnIndex, style)}</div>;
  }, [renderCell, measureRenderTime]);

  return (
    <VirtualGrid
      columnCount={columnCount}
      columnWidth={columnWidth}
      height={height}
      rowCount={rowCount}
      rowHeight={rowHeight}
      width={width}
    >
      {Cell}
    </VirtualGrid>
  );
});

// Progressive Loading Component
interface ProgressiveLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
  minLoadTime?: number;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
}

export const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  children,
  fallback,
  minLoadTime = 0,
  onLoadStart,
  onLoadComplete
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const startTime = useRef<number>(0);

  useEffect(() => {
    startTime.current = Date.now();
    if (onLoadStart) onLoadStart();

    const simulateProgress = () => {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + Math.random() * 10;
        });
      }, 100);

      return () => clearInterval(timer);
    };

    const cleanup = simulateProgress();

    const loadTimer = setTimeout(() => {
      const elapsed = Date.now() - startTime.current;
      const remainingTime = Math.max(0, minLoadTime - elapsed);
      
      setTimeout(() => {
        setIsLoading(false);
        if (onLoadComplete) onLoadComplete();
      }, remainingTime);
    }, 100);

    return () => {
      cleanup();
      clearTimeout(loadTimer);
    };
  }, [minLoadTime, onLoadStart, onLoadComplete]);

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        {fallback || (
          <>
            <Typography variant="h6" gutterBottom>
              Loading...
            </Typography>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {Math.round(progress)}% complete
            </Typography>
          </>
        )}
      </Box>
    );
  }

  return <>{children}</>;
};

// Lazy Component Wrapper
export const LazyComponent = <T extends Record<string, any>>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  fallback: ReactNode = <Skeleton variant="rectangular" height={200} />
) => {
  const Component = lazy(importFn);
  
  return (props: T) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};

// Memory-efficient data hook
export const useEfficientData = <T>(
  dataFetcher: () => Promise<T[]>,
  dependencies: any[] = [],
  cacheKey?: string
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const key = cacheKey || `data-${JSON.stringify(dependencies)}`;
    
    // Check cache first
    const cachedData = globalCache.get(key);
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await dataFetcher();
      
      // Cache the result
      globalCache.set(key, result);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    if (cacheKey) {
      globalCache.clear();
    }
    fetchData();
  }, [fetchData, cacheKey]);

  return { data, loading, error, refetch };
};

// Performance Metrics Dashboard Component
export const PerformanceMetricsDashboard: React.FC = () => {
  const { metrics } = usePerformanceMetrics();
  const theme = useTheme();

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return theme.palette.success.main;
    if (value <= thresholds.warning) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const metricCards = [
    {
      title: 'Render Time',
      value: `${metrics.renderTime.toFixed(2)}ms`,
      icon: <PerformanceIcon />,
      color: getStatusColor(metrics.renderTime, { good: 8, warning: 16 }),
      description: 'Time to render components'
    },
    {
      title: 'Memory Usage',
      value: `${metrics.memoryUsage.toFixed(1)}MB`,
      icon: <MemoryIcon />,
      color: getStatusColor(metrics.memoryUsage, { good: 50, warning: 100 }),
      description: 'JavaScript heap memory'
    },
    {
      title: 'FPS',
      value: `${metrics.fps}`,
      icon: <MetricsIcon />,
      color: getStatusColor(60 - metrics.fps, { good: 0, warning: 10 }),
      description: 'Frames per second'
    },
    {
      title: 'Cache Hit Rate',
      value: `${(metrics.cacheHitRate * 100).toFixed(1)}%`,
      icon: <RefreshIcon />,
      color: getStatusColor(100 - (metrics.cacheHitRate * 100), { good: 20, warning: 50 }),
      description: 'Data cache efficiency'
    }
  ];

  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Performance Metrics
      </Typography>
      
      <Grid container spacing={2}>
        {metricCards.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ color: metric.color }}>
                    {metric.icon}
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    {metric.title}
                  </Typography>
                </Box>
                
                <Typography variant="h4" fontWeight={700} color={metric.color}>
                  {metric.value}
                </Typography>
                
                <Typography variant="caption" color="text.secondary">
                  {metric.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {(metrics.renderTime > 16 || metrics.memoryUsage > 100 || metrics.fps < 50) && (
        <Alert 
          severity="warning" 
          sx={{ mt: 2 }}
          icon={<WarningIcon />}
        >
          Performance issues detected. Consider reducing data complexity or enabling virtualization.
        </Alert>
      )}
    </Paper>
  );
};

// Optimized debounced search hook
export const useDebouncedSearch = (
  searchFn: (query: string) => Promise<any[]>,
  delay: number = 300
) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const searchResults = await searchFn(searchQuery);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, delay),
    [searchFn, delay]
  );

  useEffect(() => {
    debouncedSearch(query);
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);

  return {
    query,
    setQuery,
    results,
    loading
  };
};

// Throttled scroll handler
export const useThrottledScroll = (
  callback: (scrollTop: number) => void,
  delay: number = 16
) => {
  const throttledCallback = useMemo(
    () => throttle(callback, delay),
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      throttledCallback.cancel();
    };
  }, [throttledCallback]);

  return throttledCallback;
};

// Export performance utilities
export {
  globalCache,
  PerformanceCache
};

export default {
  VirtualizedList,
  VirtualizedGrid,
  ProgressiveLoader,
  LazyComponent,
  PerformanceMetricsDashboard,
  usePerformanceMetrics,
  useEfficientData,
  useDebouncedSearch,
  useThrottledScroll
};