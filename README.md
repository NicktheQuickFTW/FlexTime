# FlexTime: Next-Gen Sports Scheduling Platform 🏆

> **AI-Powered Scheduling Built on Operational HELiiX Infrastructure**

FlexTime is an advanced scheduling platform in development for collegiate athletic conferences, with specialized optimization for the Big 12 Conference. Built on the proven, operational HELiiX Intelligence Engine and Multi-Agent System, FlexTime integrates advanced machine learning, constraint-based optimization, and real-time analytics to deliver optimal sports scheduling solutions that balance competitive fairness, travel efficiency, and institutional requirements.

**🔧 Status: In Development - Built on Operational HELiiX Systems**  
**📅 Last Updated: June 3, 2025**  
**✨ Target Completion: Q3-Q4 2025**

## 🌟 Key Features

### 🚀 Core Infrastructure (Operational HELiiX Systems)

- ✅ **HELiiX Intelligence Engine**: Operational AI/ML backend with 8 production API endpoints
- ✅ **Multi-Agent System**: 15+ operational specialized agents for constraint management and optimization
- ✅ **Advanced Constraint Engine**: Type-safe UCDL system with proven 90% faster evaluation (200-500ms)
- ✅ **COMPASS Analytics**: Real-time team performance and strength-of-schedule calculations
- ✅ **Travel Optimization**: ML-driven algorithms for cost and carbon impact analysis
- ✅ **Championship Date Management**: Intelligent handling of championship events and qualifiers

### 🔧 FlexTime Platform Features (In Development)

- 🚧 **Scheduling Interface**: Advanced UI for drag-and-drop schedule creation and management
- 🚧 **Real-time Collaboration**: Multi-user editing with conflict-free replicated data types (CRDTs)
- 🚧 **Integrated Dashboard**: Unified interface combining HELiiX analytics with scheduling tools
- 🚧 **Cloud-Native Deployment**: Kubernetes-ready microservices architecture
- 🚧 **Enhanced Security**: OAuth 2.0 and RBAC integration for enterprise deployment

### 📊 UI/UX Components (In Development)

- 🚧 **Venues Management**: Location mapping, capacity tracking, facility management with interactive filters
- 🚧 **Analytics Dashboard**: Real-time metrics, interactive charts, performance monitoring
- 🚧 **Settings & Profile**: User preferences, accessibility options, notifications, dashboard customization
- 🚧 **Admin Dashboard**: System monitoring, user management, configuration, activity logs, system health
- 🚧 **Reports & Export**: Multiple formats (PDF, CSV, Excel, JSON), scheduled reports, export history

### 📈 HELiiX Analytics & Insights (Operational)

- ✅ **COMPASS Analytics Engine**: Team performance metrics and predictive modeling
- ✅ **Travel Optimization Engine**: Geographic analysis of travel patterns and costs
- ✅ **Competitive Balance Analysis**: Statistical algorithms for fair scheduling
- ✅ **Constraint Evaluation**: Real-time validation and conflict detection
- ✅ **Performance Monitoring**: System performance and optimization metrics

### 🔧 FlexTime Analytics Integration (In Development)

- 🚧 **Unified Dashboard**: Integration of HELiiX analytics with FlexTime UI
- 🚧 **Interactive Visualizations**: User-friendly charts and data presentation
- 🚧 **Budget Impact Forecasting**: Financial projections based on generated schedules
- 🚧 **Real-time Updates**: Live data streaming to FlexTime interface

## 🛠️ Tech Stack

### HELiiX Backend Infrastructure (Operational)

- ✅ **Python Intelligence Engine**: 8 production API endpoints for AI/ML operations
- ✅ **Multi-Agent System**: Director and specialized agents with persistent memory
- ✅ **Neon PostgreSQL**: HELiiX database with 50-connection pooling
- ✅ **Type-Safe Constraints**: UCDL constraint evaluation system
- ✅ **COMPASS Analytics**: Team performance and predictive modeling

### FlexTime Frontend (In Development)

- 🚧 **React 18 with TypeScript**: Modern component architecture with type safety
- 🚧 **Material-UI v6**: Enterprise-grade UI components with theming
- 🚧 **Next.js 14**: Production-optimized React framework
- 🚧 **Framer Motion 10**: Buttery smooth animations and gestures
- 🚧 **Recharts**: Interactive data visualization
- 🚧 **FlexTime Design System**: Custom glassmorphic UI components
- ✅ **Complete Page Suite**: Venues, Analytics, Settings, Admin, Reports pages

### FlexTime Integration Layer (In Development)

- 🚧 **Node.js 20 LTS**: Integration service for HELiiX ↔ FlexTime communication
- 🚧 **Express 5**: API gateway and routing layer
- 🚧 **Microservices Architecture**: Clean separation of scheduling and analytics services
- 🚧 **Modular Design**: Organized codebase structure
  - `src/config/`: Environment and service configuration
  - `src/middleware/`: Express middleware stack
  - `src/routes/`: API endpoint definitions
  - `src/services/`: Business logic and domain services
  - `src/adapters/`: HELiiX system integration adapters

### Data Layer (Operational)

- ✅ **HELiiX Neon Database**: Operational PostgreSQL instance with Big 12 data
- ✅ **50-Connection Pooling**: High-performance database access
- ✅ **Redis Streams**: Event streaming for real-time communication (2,000-5,000 events/second)
- 🚧 **FlexTime Data Integration**: User interface data layer
- 🚧 **Caching Strategy**: Redis-based caching for FlexTime UI

### Infrastructure (Target Architecture)

- 🚧 **Kubernetes Deployment**: Production-grade orchestration for FlexTime
- 🚧 **Docker Containerization**: FlexTime service containerization
- 🚧 **Helm Charts**: Kubernetes package management for deployment
- ✅ **HELiiX Infrastructure**: Operational backend systems and monitoring
- 🚧 **Monitoring Integration**: FlexTime performance and usage monitoring
- ✅ **Argo CD**: GitOps continuous delivery

### AI/ML

#### Core Engine

- ✅ **HELiiX Intelligence Engine**: Comprehensive AI system with knowledge graph
- ✅ **TensorFlow.js**: Browser-based ML inference
- ✅ **Python ML Services**: Specialized scheduling algorithms
- ✅ **RedisAI**: Tensor computation and model serving
- ✅ **MLflow**: Experiment tracking and model registry

#### Advanced Features

- ✅ **Custom Constraint Optimization**: Specialized algorithms for athletic scheduling
- ✅ **Predictive Modeling**: Advanced forecasting for game outcomes
- ✅ **Event-Driven Pipeline**: Real-time learning and adaptation
- ✅ **Sport-Specific Optimizers**: Tailored algorithms for each sport
- ✅ **Knowledge Graph**: Advanced relationship mapping for scheduling intelligence

## 🚀 Getting Started

### Prerequisites

- Node.js 20 LTS or later
- PostgreSQL 15+ or Neon DB
- Redis 7+
- Python 3.11+ (for ML components)
- Docker & Docker Compose (optional)

### Quick Start with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-org/flextime.git
cd flextime

# Start all services
docker compose up -d

# Access the application at http://localhost:3000
```

### Manual Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/flextime.git
   cd flextime
   ```

2. **Set up the backend**

   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   npm install
   npx prisma migrate dev
   npm run dev
   ```

3. **Set up the frontend**

   ```bash
   cd ../frontend
   cp .env.example .env
   # Edit .env with your API URL
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - API Docs: [http://localhost:3001/api-docs](http://localhost:3001/api-docs)
   - Adminer (DB): [http://localhost:8080](http://localhost:8080)
   - Redis Commander: [http://localhost:8081](http://localhost:8081)

### Development Scripts

```bash
# Run tests
npm test

# Run linter
npm run lint

# Run type checking
npm run typecheck

# Build for production
npm run build
```

1. **Start Development Servers**

   ```bash
   # Start backend
   cd backend
   npm run dev
   ```

   In a new terminal:
   
   ```bash
   # Start frontend
   cd frontend
   npm run dev
   ```

2. **Access the Application**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:3001](http://localhost:3001)
   - API Documentation: [http://localhost:3001/api-docs](http://localhost:3001/api-docs)
   - GraphQL Playground: [http://localhost:3001/graphql](http://localhost:3001/graphql)

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
