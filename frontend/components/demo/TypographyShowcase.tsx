import React from 'react';
import { Typography, Box, Card, CardContent, Grid, Divider } from '@mui/material';
import { FTLogo } from '../ui/FTLogo';

/**
 * Typography Showcase Component
 * 
 * Demonstrates the FlexTime brand typography system including:
 * - Orbitron: Futuristic brand headers
 * - Rajdhani: Modern UI text
 * - Exo 2: Clean body text
 * - FlexTime logos
 */
export const TypographyShowcase: React.FC = () => {
  return (
    <Box className="ft-container" sx={{ py: 4 }}>
      <Typography variant="h1" className="ft-font-brand" sx={{ mb: 4, textAlign: 'center' }}>
        FlexTime Typography System
      </Typography>
      
      <Grid container spacing={4}>
        {/* Logo Showcase */}
        <Grid item xs={12}>
          <Card className="ft-glass">
            <CardContent>
              <Typography variant="h3" className="ft-font-ui" sx={{ mb: 3 }}>
                FlexTime Logos
              </Typography>
              <Box sx={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <FTLogo variant="light" size="lg" />
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    Light Theme
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <FTLogo variant="dark" size="lg" />
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    Dark Theme
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <FTLogo variant="white" size="lg" />
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    White
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <FTLogo variant="black" size="lg" />
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    Black
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Orbitron - Brand Headers */}
        <Grid item xs={12} md={4}>
          <Card className="ft-glass">
            <CardContent>
              <Typography variant="h4" className="ft-font-brand ft-gradient-text" sx={{ mb: 2 }}>
                Orbitron
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
                Futuristic brand headers & titles
              </Typography>
              
              <Box sx={{ space: 2 }}>
                <Typography variant="h1" className="ft-font-brand" sx={{ fontSize: '2rem', mb: 1 }}>
                  H1 Hero Title
                </Typography>
                <Typography variant="h2" className="ft-font-brand" sx={{ fontSize: '1.5rem', mb: 1 }}>
                  H2 Page Title
                </Typography>
                <Typography className="ft-font-brand" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  Brand Text
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Rajdhani - UI Text */}
        <Grid item xs={12} md={4}>
          <Card className="ft-glass">
            <CardContent>
              <Typography variant="h4" className="ft-font-ui ft-gradient-text" sx={{ mb: 2 }}>
                Rajdhani
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
                Modern UI elements & navigation
              </Typography>
              
              <Box sx={{ space: 2 }}>
                <Typography variant="h3" className="ft-font-ui" sx={{ mb: 1 }}>
                  Section Header
                </Typography>
                <Typography variant="h5" className="ft-font-ui" sx={{ mb: 1 }}>
                  Subsection Title
                </Typography>
                <Typography variant="button" className="ft-font-ui" sx={{ 
                  display: 'block',
                  p: 1,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: 1,
                  textAlign: 'center'
                }}>
                  Button Text
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Exo 2 - Body Text */}
        <Grid item xs={12} md={4}>
          <Card className="ft-glass">
            <CardContent>
              <Typography variant="h4" className="ft-font-body ft-gradient-text" sx={{ mb: 2 }}>
                Exo 2
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
                Clean, readable body text
              </Typography>
              
              <Box sx={{ space: 2 }}>
                <Typography variant="body1" className="ft-font-body" sx={{ mb: 2 }}>
                  This is body text using Exo 2. It's designed for excellent readability 
                  while maintaining the futuristic aesthetic of the FlexTime brand.
                </Typography>
                <Typography variant="body2" className="ft-font-body" sx={{ mb: 1 }}>
                  Secondary body text
                </Typography>
                <Typography variant="caption" className="ft-font-body">
                  Caption text for details
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Typography Scale */}
        <Grid item xs={12}>
          <Card className="ft-glass">
            <CardContent>
              <Typography variant="h3" className="ft-font-ui" sx={{ mb: 3 }}>
                Typography Scale
              </Typography>
              
              <Box sx={{ space: 3 }}>
                <Typography variant="h1" className="ft-font-brand">
                  H1 - Hero Title (Orbitron 800)
                </Typography>
                <Typography variant="h2" className="ft-font-brand">
                  H2 - Page Title (Orbitron 700)
                </Typography>
                <Typography variant="h3" className="ft-font-ui">
                  H3 - Section Header (Rajdhani 700)
                </Typography>
                <Typography variant="h4" className="ft-font-ui">
                  H4 - Subsection Title (Rajdhani 600)
                </Typography>
                <Typography variant="h5" className="ft-font-ui">
                  H5 - Component Title (Rajdhani 600)
                </Typography>
                <Typography variant="h6" className="ft-font-ui">
                  H6 - Small Title (Rajdhani 600)
                </Typography>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="body1" className="ft-font-body">
                  Body 1 - Primary body text (Exo 2 400)
                </Typography>
                <Typography variant="body2" className="ft-font-body">
                  Body 2 - Secondary body text (Exo 2 400)
                </Typography>
                <Typography variant="subtitle1" className="ft-font-ui">
                  Subtitle 1 - UI text (Rajdhani 500)
                </Typography>
                <Typography variant="subtitle2" className="ft-font-ui">
                  Subtitle 2 - UI text (Rajdhani 500)
                </Typography>
                <Typography variant="caption" className="ft-font-body">
                  Caption - Details and metadata (Exo 2 400)
                </Typography>
                <Typography variant="overline" className="ft-font-ui">
                  Overline - Labels and categories (Rajdhani 500)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Utility Classes */}
        <Grid item xs={12}>
          <Card className="ft-glass">
            <CardContent>
              <Typography variant="h3" className="ft-font-ui" sx={{ mb: 3 }}>
                Utility Classes
              </Typography>
              
              <Box sx={{ space: 2 }}>
                <Typography className="ft-font-brand text-2xl font-ft-bold">
                  .ft-font-brand - Brand text with utilities
                </Typography>
                <Typography className="ft-font-ui text-lg font-ft-medium tracking-ft-wide">
                  .ft-font-ui - UI text with utilities
                </Typography>
                <Typography className="ft-font-body text-base font-ft-regular tracking-ft-normal">
                  .ft-font-body - Body text with utilities
                </Typography>
                <Typography className="ft-font-mono text-sm font-ft-regular tracking-ft-wider">
                  .ft-font-mono - Monospace for code/data
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TypographyShowcase;