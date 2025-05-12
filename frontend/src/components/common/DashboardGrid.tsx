import React, { ReactNode } from 'react';
import { Box, BoxProps, styled } from '@mui/material';

interface DashboardGridProps extends BoxProps {
  children: ReactNode;
  minItemWidth?: number | string;
  gap?: number | string;
  autoFlow?: 'dense' | 'row' | 'column';
}

/**
 * A responsive dashboard grid layout component using CSS Grid
 * Automatically adjusts the number of columns based on available space
 * 
 * @param minItemWidth - Minimum width of each grid item (default: 280px)
 * @param gap - Gap between grid items (default: 16px)
 * @param autoFlow - Grid auto-flow property (default: 'dense' for compact layout)
 * @param children - Grid items (should use DashboardGridItem as direct children)
 * @param props - Additional Box props
 */
const DashboardGrid: React.FC<DashboardGridProps> = ({
  children,
  minItemWidth = 280,
  gap = 16,
  autoFlow = 'dense',
  ...props
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${typeof minItemWidth === 'number' ? `${minItemWidth}px` : minItemWidth}, 1fr))`,
        gap: typeof gap === 'number' ? `${gap}px` : gap,
        gridAutoFlow: autoFlow,
        width: '100%',
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

interface DashboardGridItemProps extends BoxProps {
  children: ReactNode;
  colSpan?: number;
  rowSpan?: number;
}

/**
 * A grid item component for use within DashboardGrid
 * 
 * @param colSpan - Number of columns this item should span (default: 1)
 * @param rowSpan - Number of rows this item should span (default: 1)
 * @param children - Content of the grid item
 * @param props - Additional Box props
 */
export const DashboardGridItem: React.FC<DashboardGridItemProps> = ({
  children,
  colSpan = 1,
  rowSpan = 1,
  ...props
}) => {
  return (
    <Box
      sx={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
        minHeight: '100px',
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default DashboardGrid;
