# FlexTime Frontend ✨

> **Beautiful, AI-Powered Scheduling Interface for Big 12 Conference**

A sleek, monochrome web application that brings the power of FlexTime's intelligent scheduling system to life with a stunning, modern interface inspired by cutting-edge design principles.

## 🎨 Design Philosophy

This modern FlexTime interface is built with a **monochrome aesthetic** featuring:

- **Clean, geometric design** with crystalline visual elements
- **Glassmorphic cards** with subtle transparency and blur effects  
- **Golden accent colors** that highlight important interactions
- **Spacious, breathable layouts** that prioritize content clarity
- **Professional typography** using Inter font family
- **Responsive design** that works beautifully on all devices

## ✨ Features

### 🏠 **Dashboard Overview**
- Hero section with compelling value proposition
- Feature cards showcasing AI capabilities
- Real-time statistics and metrics
- Interactive schedule matrix preview

### 📅 **Schedule Builder**
- Drag-and-drop interface for schedule creation
- Real-time conflict detection and resolution
- Sport-specific constraint management
- AI-powered optimization suggestions

### 📊 **Advanced Analytics**
- Travel optimization heat maps
- Competitive balance analysis
- Championship alignment metrics
- Cost savings calculations

### 👥 **Team Management**
- Big 12 conference team overview
- Individual team schedule views
- Performance metrics and statistics

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- PostgreSQL database (for local development)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-organization/flextime.git
   cd flextime/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the frontend directory with the following:
   ```
   REACT_APP_API_URL=http://localhost:3001
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   This will start both the frontend development server and the API server.

5. **Access the application**
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## 📱 Supported Browsers

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🛠 Development

### Available Scripts

- `npm start` - Start the development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

For questions or support, please contact [your-email@example.com](mailto:your-email@example.com)
   ```bash
   cd /Users/nickw/Documents/XII-Ops/FlexTime/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3006`

## 🎯 User Experience

### **Navigation**
- Clean, persistent navigation bar with active state indicators
- Smooth transitions between different views
- Logo and branding prominently displayed

### **Interactions**
- Hover effects with subtle animations
- Loading states with elegant spinners
- Responsive feedback for all user actions
- Accessibility-first design principles

### **Visual Hierarchy**
- Clear information architecture
- Consistent spacing and typography
- Strategic use of color to guide attention
- Progressive disclosure of complex features

## 🔧 Technical Implementation

### **Frontend Architecture**
- **React 18** with modern hooks and functional components
- **Vanilla CSS** with CSS custom properties for theming
- **Responsive grid layouts** using CSS Grid and Flexbox
- **Modern JavaScript** (ES6+) with clean, readable code

### **Design System**
```css
/* Color Palette */
--color-black: #000000
--color-white: #ffffff  
--color-gold-primary: #ffa500
--color-glass-bg: rgba(255, 255, 255, 0.05)

/* Typography */
--font-family: 'Inter', sans-serif
--font-weight-light: 300
--font-weight-bold: 700

/* Spacing System */
--spacing-sm: 0.5rem
--spacing-md: 1rem
--spacing-lg: 1.5rem
--spacing-xl: 2rem
```

### **Component Structure**
```
FlexTimeApp/
├── Navigation
├── GeometricBackground
├── DashboardView/
│   ├── HeroSection
│   ├── FeatureCards
│   ├── ScheduleMatrix
│   └── StatsDashboard
├── ScheduleBuilderView
├── AnalyticsView
└── TeamsView
```

## 🌟 Key Design Elements

### **Glassmorphism Effects**
- Subtle background blur (`backdrop-filter: blur(20px)`)
- Semi-transparent backgrounds
- Elegant border treatments
- Layered visual depth

### **Interactive States**
- Smooth hover transitions
- Golden accent highlighting
- Elevation changes with shadows
- Responsive feedback animations

### **Typography Scale**
- Hero titles: 3.5rem bold
- Section headers: 1.75rem semibold  
- Body text: 1rem regular
- Captions: 0.875rem light

### **Geometric Background**
- Floating geometric shapes
- Subtle animation loops
- Low opacity overlays
- Strategic positioning

## 📱 Responsive Design

The interface adapts beautifully across all screen sizes:

- **Desktop (1200px+)**: Full multi-column layouts
- **Tablet (768px-1199px)**: Adjusted grid systems
- **Mobile (<768px)**: Single-column stacked layouts

## 🔌 API Integration Points

Ready for integration with the existing FlexTime backend:

```javascript
// Sample API endpoints
GET /api/status        // System health
GET /api/teams         // Team data
GET /api/schedules     // Schedule information
POST /api/optimize     // AI optimization
```

## 🎨 Brand Alignment

### **Big 12 Conference**
- Professional, authoritative aesthetic
- Clean, modern presentation
- Scalable for multi-sport usage
- Championship-focused messaging

### **Color Strategy**
- **Monochrome base**: Ensures broad accessibility
- **Golden accents**: Highlight premium AI features
- **Glass effects**: Modern, high-tech appearance
- **High contrast**: Optimal readability

## 🚀 Performance Features

- **Lightweight footprint**: Minimal dependencies
- **Fast loading**: Optimized CSS and JavaScript
- **Smooth animations**: Hardware-accelerated transitions
- **Scalable architecture**: Ready for production deployment

## 🔮 Future Enhancements

- **Real-time collaboration**: WebSocket integration
- **Advanced visualizations**: D3.js charts and graphs  
- **Mobile app**: React Native implementation
- **Offline capabilities**: Progressive Web App features
- **Voice interface**: Natural language scheduling

## 📄 License

MIT License - Built for Big 12 Conference

---

**✨ Experience the future of athletic scheduling with FlexTime's beautiful, intelligent interface.**