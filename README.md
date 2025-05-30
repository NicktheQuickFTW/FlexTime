# FlexTime: Intelligent Sports Scheduling Platform 🏆

> **AI-Powered Scheduling for Collegiate Athletics**

FlexTime is a comprehensive scheduling platform designed specifically for collegiate athletic conferences, with a focus on the Big 12 Conference. It combines machine learning, constraint-based optimization, and advanced analytics to generate optimal sports schedules while considering travel, competitive balance, and championship dates.

**Status: ✅ Backend Refactored - Ready for Production Deployment** (May 30, 2025)

## 🌟 Key Features

### 🚀 Core Functionality

- ✅ **AI-Powered Scheduling**: Machine learning models optimize schedules based on historical data and constraints
- ✅ **Championship Date Management**: Intelligent handling of championship events and qualifiers
- ✅ **Travel Optimization**: Minimize travel time and costs for all teams
- ✅ **Constraint Management**: Type-safe UCDL constraint system with 90% faster evaluation
- ✅ **Real-time Collaboration**: Multiple users can collaborate with event-driven updates using WebSocket technology
- ✅ **Microservices Architecture**: Distributed, scalable system with specialized services

### 📊 Analytics & Insights

- ✅ **COMPASS Analytics Dashboard**: Comprehensive metrics and insights with interactive visualizations
- ✅ **Travel optimization heat maps**: Geographic visualization of travel patterns and costs
- ✅ **Competitive balance analysis**: Statistical tools to ensure fair scheduling
- ✅ **Budget impact forecasting**: Financial projections based on generated schedules
- ✅ **Performance metrics and statistics**: Comprehensive measurement of system performance

## 🛠️ Tech Stack

### Frontend

- ✅ **React 18 with TypeScript**: Modern component architecture with type safety
- ✅ **Glassmorphic UI**: Ultra-modern design with crystalline UI elements
- ✅ **Redux + Context API**: Sophisticated state management
- ✅ **AG-Grid Enterprise**: Advanced data visualization with drag & drop capability
- ✅ **Framer Motion**: Smooth animations and micro-interactions

### Backend (Refactored May 30, 2025)

- ✅ **Node.js with Express**: High-performance modular server with 20 workers per task scaling
- ✅ **Modular Architecture**: Refactored from 580-line monolith to clean, testable modules
- ✅ **PostgreSQL with Neon DB**: Cloud-native database with worker-scaled connections
- ✅ **Enhanced Caching**: LRU cache with worker allocation tracking and cleanup
- ✅ **Production Security**: Helmet middleware, rate limiting, compression
- ✅ **Python for ML components**: Specialized machine learning services
- ✅ **Redis Streams**: Event-driven architecture with reliable message delivery
- ✅ **Kubernetes**: Container orchestration with auto-scaling capabilities
- ✅ **Microservices Architecture**: Specialized domain services with high cohesion

### AI/ML

- ✅ **HELiiX Intelligence Engine**: Comprehensive AI system with knowledge graph implementation
- ✅ **TensorFlow.js**: In-browser predictions for immediate feedback
- ✅ **Custom constraint optimization**: Specialized algorithms for athletic scheduling
- ✅ **Predictive modeling**: Advanced forecasting for game outcomes
- ✅ **Event-driven ML pipeline**: Real-time learning capabilities
- ✅ **Sport-specific scheduling generators**: Specialized algorithms for each sport

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- PostgreSQL 13+
- Redis 6+
- Python 3.9+ (for ML components)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/flextime.git
   cd flextime
   ```

2. **Install dependencies**

   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**

   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit with your database credentials
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

4. **Start the development servers**

   ```bash
   # Start backend
   cd backend
   npm run dev
   
   # In a new terminal, start frontend
   cd frontend
   npm start
   ```

5. **Access the application**

   - Frontend: [http://localhost:3000](http://localhost:3000)
   - API: [http://localhost:5000](http://localhost:5000)

## 📚 Documentation

- [FlexTime Playbook](/FlexTime_Playbook.md) - Comprehensive implementation guide
- [Development Roadmap](/development/development_roadmap.md) - Project timeline and priorities
- [Microservices Migration](/backend/docs/MIGRATION_INTEGRATION_PLAN.md) - Migration strategy
- [API Documentation](/docs/API.md) - API endpoints and usage
- [Database Schema](/docs/DATABASE.md) - Data structure
- [Architecture Overview](/development/infrastructure-enhancement/docs/architecture_overview.md) - System design
- [Deployment Guide](/docs/DEPLOYMENT.md) - Deployment instructions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to contribute to FlexTime.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Big 12 Conference for their support and collaboration
- Open source community for the amazing tools and libraries used in this project
