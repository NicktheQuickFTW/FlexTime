import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
  estimatedItemHeight?: number;
  dynamicHeight?: boolean;
}

export const VirtualList = <T,>({ 
  items, 
  itemHeight, 
  containerHeight, 
  renderItem, 
  overscan = 5,
  className = '',
  onScroll,
  getItemKey,
  estimatedItemHeight,
  dynamicHeight = false
}: VirtualListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const itemHeightsRef = useRef<Map<number, number>>(new Map());
  const itemElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());

  // Performance: Debounced scroll end detection
  const handleScrollEnd = useCallback(() => {
    setIsScrolling(false);
  }, []);

  // Performance: Throttled scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Set new timeout for scroll end
    scrollTimeoutRef.current = setTimeout(handleScrollEnd, 150);
    
    // Call external scroll handler
    onScroll?.(newScrollTop);
  }, [onScroll, handleScrollEnd]);

  // Performance: Memoized calculations for dynamic heights
  const { totalHeight, visibleRange } = useMemo(() => {
    if (!dynamicHeight) {
      // Static height calculations
      const visibleStart = Math.floor(scrollTop / itemHeight);
      const visibleCount = Math.ceil(containerHeight / itemHeight);
      const visibleEnd = Math.min(visibleStart + visibleCount + overscan, items.length);
      const startIndex = Math.max(visibleStart - overscan, 0);
      
      return {
        totalHeight: items.length * itemHeight,
        visibleRange: { startIndex, endIndex: visibleEnd }
      };
    }

    // Dynamic height calculations
    let totalHeight = 0;
    let visibleStart = -1;
    let visibleEnd = -1;
    let currentOffset = 0;

    for (let i = 0; i < items.length; i++) {
      const height = itemHeightsRef.current.get(i) || estimatedItemHeight || itemHeight;
      
      if (visibleStart === -1 && currentOffset + height > scrollTop) {
        visibleStart = Math.max(0, i - overscan);
      }
      
      if (visibleEnd === -1 && currentOffset > scrollTop + containerHeight) {
        visibleEnd = Math.min(items.length, i + overscan);
      }
      
      currentOffset += height;
      totalHeight += height;
    }

    if (visibleEnd === -1) {
      visibleEnd = items.length;
    }

    return {
      totalHeight,
      visibleRange: { 
        startIndex: visibleStart === -1 ? 0 : visibleStart, 
        endIndex: visibleEnd 
      }
    };
  }, [scrollTop, containerHeight, itemHeight, overscan, items.length, dynamicHeight, estimatedItemHeight]);

  // Performance: Calculate offset for visible items
  const offsetY = useMemo(() => {
    if (!dynamicHeight) {
      return visibleRange.startIndex * itemHeight;
    }

    let offset = 0;
    for (let i = 0; i < visibleRange.startIndex; i++) {
      offset += itemHeightsRef.current.get(i) || estimatedItemHeight || itemHeight;
    }
    return offset;
  }, [visibleRange.startIndex, itemHeight, dynamicHeight, estimatedItemHeight]);

  // Performance: Memoized visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  // Performance: Item key generation
  const getKey = useCallback((item: T, index: number) => {
    if (getItemKey) {
      return getItemKey(item, visibleRange.startIndex + index);
    }
    return visibleRange.startIndex + index;
  }, [getItemKey, visibleRange.startIndex]);

  // Performance: Resize observer for dynamic heights
  useEffect(() => {
    if (!dynamicHeight) return;

    const resizeObserver = new ResizeObserver((entries) => {
      let hasChanges = false;
      
      entries.forEach((entry) => {
        const element = entry.target as HTMLDivElement;
        const index = parseInt(element.dataset.index || '0', 10);
        const newHeight = entry.contentRect.height;
        
        if (itemHeightsRef.current.get(index) !== newHeight) {
          itemHeightsRef.current.set(index, newHeight);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        // Force re-render with updated heights
        setScrollTop(prev => prev);
      }
    });

    // Observe all current item elements
    itemElementsRef.current.forEach((element) => {
      resizeObserver.observe(element);
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [dynamicHeight, visibleItems.length]);

  // Performance: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Performance: Item renderer with ref management
  const renderVirtualItem = useCallback((item: T, index: number) => {
    const actualIndex = visibleRange.startIndex + index;
    const key = getKey(item, index);
    
    return (
      <div 
        key={key}
        ref={(el) => {
          if (el && dynamicHeight) {
            itemElementsRef.current.set(actualIndex, el);
            el.dataset.index = actualIndex.toString();
          }
        }}
        className="ft-virtual-list-item"
        style={{ 
          height: dynamicHeight ? 'auto' : itemHeight,
          minHeight: dynamicHeight ? itemHeight : undefined
        }}
      >
        {renderItem(item, actualIndex)}
      </div>
    );
  }, [visibleRange.startIndex, getKey, renderItem, itemHeight, dynamicHeight]);

  return (
    <div 
      ref={containerRef}
      className={`ft-virtual-list ${className} ${isScrolling ? 'ft-virtual-list--scrolling' : ''}`}
      style={{ 
        height: containerHeight, 
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
      data-testid="virtual-list"
    >
      <div 
        className="ft-virtual-list-spacer"
        style={{ 
          height: totalHeight, 
          position: 'relative',
          pointerEvents: 'none'
        }}
      >
        <div 
          className="ft-virtual-list-content"
          style={{ 
            transform: `translateY(${offsetY}px)`,
            pointerEvents: 'auto'
          }}
        >
          {visibleItems.map(renderVirtualItem)}
        </div>
      </div>
      
      {/* Performance indicator during scrolling */}
      {isScrolling && (
        <div className="ft-virtual-list-scroll-indicator">
          <div className="ft-scroll-thumb" />
        </div>
      )}
    </div>
  );
};

// Performance: Memoized wrapper for common use cases
export const MemoizedVirtualList = React.memo(VirtualList) as typeof VirtualList;

// Performance: Hook for virtual list state management
export const useVirtualList = <T,>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

  const handleScroll = useCallback((newScrollTop: number) => {
    setScrollTop(newScrollTop);
    
    const visibleStart = Math.floor(newScrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length
    );
    
    setVisibleRange({ start: visibleStart, end: visibleEnd });
  }, [itemHeight, containerHeight, items.length]);

  return {
    scrollTop,
    visibleRange,
    handleScroll,
    visibleItems: items.slice(visibleRange.start, visibleRange.end)
  };
};

// Performance: Virtual grid component for 2D virtualization
interface VirtualGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  columnsCount: number;
  renderItem: (item: T, index: number, rowIndex: number, colIndex: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export const VirtualGrid = <T,>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  columnsCount,
  renderItem,
  overscan = 2,
  className = ''
}: VirtualGridProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const rowsCount = Math.ceil(items.length / columnsCount);
  const totalHeight = rowsCount * itemHeight;
  const totalWidth = columnsCount * itemWidth;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
  }, []);

  const visibleRowStart = Math.floor(scrollTop / itemHeight);
  const visibleRowEnd = Math.min(
    visibleRowStart + Math.ceil(containerHeight / itemHeight) + overscan,
    rowsCount
  );

  const visibleColStart = Math.floor(scrollLeft / itemWidth);
  const visibleColEnd = Math.min(
    visibleColStart + Math.ceil(containerWidth / itemWidth) + overscan,
    columnsCount
  );

  const visibleItems = [];
  for (let row = Math.max(0, visibleRowStart - overscan); row < visibleRowEnd; row++) {
    for (let col = Math.max(0, visibleColStart - overscan); col < visibleColEnd; col++) {
      const index = row * columnsCount + col;
      if (index < items.length) {
        visibleItems.push({
          item: items[index],
          index,
          row,
          col,
          x: col * itemWidth,
          y: row * itemHeight
        });
      }
    }
  }

  return (
    <div
      className={`ft-virtual-grid ${className}`}
      style={{
        width: containerWidth,
        height: containerHeight,
        overflow: 'auto'
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          width: totalWidth,
          height: totalHeight,
          position: 'relative'
        }}
      >
        {visibleItems.map(({ item, index, row, col, x, y }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: itemWidth,
              height: itemHeight
            }}
          >
            {renderItem(item, index, row, col)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualList;