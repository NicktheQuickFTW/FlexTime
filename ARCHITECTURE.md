# FlexTime - Clean Monolithic Architecture

## 🎯 Design Philosophy
FlexTime is a **comprehensive sports scheduling platform** with an integrated scheduler component, optimized for Big 12 Conference operations with minimal dependencies and maximum performance.

## 📁 Clean Directory Structure

```
FlexTime/
├── 🚀 Core Application
│   ├── server.js                    # Express server (port 3004)
│   ├── package.json                 # Root dependencies
│   └── .env.example                 # Environment template
├── 🎨 Frontend (Complete Next.js App - port 3003)
│   ├── app/                         # Next.js app router
│   ├── components/                  # UI component library
│   ├── styles/                      # Design system & themes
│   ├── data/                        # Big 12 team data
│   ├── public/                      # Assets & logos
│   └── package.json                 # Frontend dependencies
├── ⚙️ Backend Engine
│   ├── core/                        # FlexTime scheduling engine
│   ├── api/                         # Express API endpoints
│   ├── schedulers/                  # Sport-specific logic
│   ├── parameters/                  # Constraint system
│   └── ai-ml/                       # TensorZero integration & ML tools
├── 🔧 Operational Tools
│   ├── scripts/                     # Database, AI/ML, development
│   ├── security/                    # Auth, encryption, compliance
│   └── lib/integrations/            # Health checking & logging
└── 🧪 Essential Testing
    ├── e2e-tests/                   # End-to-end testing
    ├── integration-tests/           # Integration testing
    └── functional-equivalence/      # Core functionality tests
```

## 🗑️ What Was Removed

### Heavy Infrastructure
- ❌ **Chaos Engineering** (overkill for monolith)
- ❌ **Load Testing Infrastructure** (JMeter, K6 suites)
- ❌ **Microservices Orchestration** (Docker compose, webhooks)
- ❌ **FlexTime-Specific Integrations** (HELiiX, Notion, RAG agents)

### Development Bloat
- ❌ **Build Artifacts** (.lock files, node_modules, dist/)
- ❌ **Version Control** (.git directories)
- ❌ **Backup Files** (*.backup, *.log)
- ❌ **Heavy Monitoring** (Advanced metrics, alerting systems)

## ✅ What Remains - Core Essentials

### Application Stack
- ✅ **Complete Frontend** (React/Next.js with glassmorphic UI)
- ✅ **Backend Engine** (Express server with scheduling logic)
- ✅ **Sport Schedulers** (All Big 12 sports supported)
- ✅ **Security Framework** (Auth, encryption, RBAC)

### Operational Tools
- ✅ **Database Scripts** (Setup, migration, seeding)
- ✅ **TensorZero Integration** (~40MB AI/ML framework)
- ✅ **Core AI/ML** (COMPASS ratings, metrics)
- ✅ **Essential Testing** (E2E, integration, functional)
- ✅ **Health Monitoring** (Component health, logging)

### Assets & Data
- ✅ **Big 12 Complete Data** (Teams, branding, configurations)
- ✅ **Design System** (Glassmorphic components, themes)
- ✅ **Team Logos** (All Big 12 universities)

## 🚀 Deployment Profile

**Size**: ~50MB (down from ~200MB+)
**Dependencies**: Minimal, production-ready
**Architecture**: Single process, multiple ports
**Database**: Neon PostgreSQL
**Ports**: 3003 (frontend), 3004 (backend)

## 🎯 Perfect For

- ✅ **Independent Operation** (no external dependencies)
- ✅ **Quick Setup** (npm run install-all && npm run dev)
- ✅ **Single Team Deployment** (Athletic departments, conferences)
- ✅ **Development & Prototyping** (Full-featured, fast iteration)
- ✅ **Production Ready** (Security, testing, monitoring included)

---

**FlexTime: Complete Sports Scheduling Platform** 🏆