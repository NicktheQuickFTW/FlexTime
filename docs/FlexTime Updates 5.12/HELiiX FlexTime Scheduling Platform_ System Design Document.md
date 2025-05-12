## HELiiX FlexTime Scheduling Platform: System Design Document

This document details the design of the HELiiX FlexTime Scheduling Platform, building upon the previously defined requirements and system architecture. It aims to provide a comprehensive blueprint for the development of the platform, adhering to Big 12 Conference guidelines.

### 1. Introduction

The HELiiX FlexTime Scheduling Platform is envisioned as an advanced, intelligent, multi-sport scheduling system. This design document outlines the key components, modules, data structures, user interface concepts, and interaction flows necessary to realize this vision.

### 2. Overall Design Philosophy

-   **User-Centricity**: The platform will be designed with the end-users (conference administrators, athletic directors) in mind, prioritizing ease of use, clarity, and efficiency.
-   **Modularity and Reusability**: Components will be designed to be modular, promoting reusability and simplifying maintenance and future enhancements.
-   **Data-Driven Intelligence**: Machine learning and data analytics are central to the platform's intelligence, enabling predictive scheduling, continuous improvement, and insightful decision-making.
-   **Compliance and Flexibility**: The system must strictly adhere to NCAA and Big 12 rules while offering flexibility to accommodate specific preferences and evolving needs.
-   **Big 12 Branding**: All visual elements will conform to the Big 12's black and white color scheme.

### 3. Component Design

Based on the microservices-oriented architecture, the following key components will be designed:

#### 3.1. Frontend (React SPA)

-   **Dashboard**: The main landing page after login. Will provide an overview of ongoing scheduling tasks, alerts, and key metrics. Adheres to black and white theme.
-   **Schedule Management Module**:
    -   **Interactive Grid View**: A highly interactive, drag-and-drop interface for creating and modifying schedules. Cells will represent game slots. Color-coding (using shades of grey for the black and white theme, or subtle indicators) will be used to denote game status, conflicts, or specific attributes (e.g., TV games, rivalry games).
    -   **Calendar View**: A traditional calendar interface displaying scheduled games, allowing for easy visualization of schedules over time.
    -   **List View**: A tabular view of games, sortable and filterable by various criteria (date, teams, venue, sport).
-   **Constraint Configuration Module**:
    -   Interface for defining and managing various constraints (NCAA rules, conference rules, team preferences, travel limits, rest days).
    -   Ability to set priorities and penalties for soft constraints.
    -   Visual feedback on constraint violations within the scheduling views.
-   **Team and Venue Management Module**: CRUD operations for managing team information, venue details, availability, and sport-specific parameters.
-   **User Management Module**: For administrators to manage user accounts, roles, and permissions.
-   **Reporting and Analytics Module**: Displays key metrics, generates reports (e.g., travel distance reports, conflict reports), and visualizes data from the COMPASS Index and other ML models.
-   **Natural Language Query (NLQ) Interface**: A search bar or dedicated section for users to type natural language questions about schedules and data, powered by the RAG agent.

#### 3.2. Backend Services (Node.js & Python)

-   **Scheduling Service (Node.js with calls to Python for optimization)**:
    -   **Core Logic**: Implements the primary scheduling workflow, orchestrating calls to the Optimization Service and Constraint Management Agent.
    -   **Sport-Specific Adapters**: Modules for each supported sport, containing rules and logic specific to that sport.
    -   **Championship Integration**: Logic to fetch and integrate NCAA championship dates and structures.
-   **Optimization Service (Python)**:
    -   **Algorithm Library**: Contains implementations of various optimization algorithms (e.g., Integer Linear Programming solvers like PuLP or Google OR-Tools, genetic algorithms, simulated annealing).
    -   **Constraint Evaluation Engine**: Calculates constraint violations and penalties.
    -   **Solution Generation**: Produces feasible, playable, and optimal schedule options.
-   **Machine Learning Service (Python)**:
    -   **COMPASS Index Model**: Manages the training and prediction for team ratings, game outcomes, SoS, and injury impact.
    -   **Pattern Extraction Module**: Analyzes historical data to identify beneficial scheduling patterns.
    -   **RAG Agent**: Powers the NLQ interface, using a vector database of relevant documents and data to answer user queries.
    -   **Feedback Loop Mechanism**: Collects user feedback and schedule performance data to retrain models.
-   **Data Management Service (Node.js)**:
    -   Provides CRUD APIs for all data entities (schedules, teams, venues, users, constraints, ML model data).
    -   Ensures data integrity and consistency.
-   **Agent Management Service (Node.js)**:
    -   Manages the lifecycle of Director and Specialized agents.
    -   Facilitates communication and task delegation between agents.
-   **API Gateway (e.g., Express Gateway, Apollo Server)**:
    -   Manages request routing, authentication (e.g., JWT), authorization, and rate limiting.

#### 3.3. Multi-Agent System (MAS)

-   **Scheduling Director Agent**: Oversees the entire schedule generation process. Receives requests, delegates tasks to specialized agents, and monitors progress.
-   **Operations Director Agent**: Manages operational aspects like venue conflicts or resource shortages identified during scheduling.
-   **Analysis Director Agent**: Coordinates the analysis of generated schedules, leveraging ML insights and providing feedback to the Scheduling Director.
-   **Algorithm Selection Agent**: Dynamically selects the most appropriate optimization algorithm based on the current scheduling problem and historical performance.
-   **Constraint Management Agent**: Enforces constraints, identifies violations, and suggests resolutions. Interacts closely with the Constraint Configuration Module in the frontend.
-   **Travel Optimization Agent**: Focuses specifically on minimizing travel burdens, considering factors like distance, cost, and travel clusters.
-   **Resource Allocation Agent**: Manages the allocation of venues and other resources, ensuring no conflicts and equitable distribution.

### 4. Data Design

-   **Database**: Neon DB (PostgreSQL)
-   **Key Data Entities (Illustrative Schema)**:
    -   `Sports` (sport_id, name, rules_config_json)
    -   `Teams` (team_id, name, sport_id, home_venue_id, preferences_json)
    -   `Venues` (venue_id, name, capacity, availability_json)
    -   `Schedules` (schedule_id, season_id, sport_id, status, created_by, version)
    -   `Games` (game_id, schedule_id, date, time, home_team_id, away_team_id, venue_id, status, score_home, score_away, tv_broadcast_info)
    -   `Constraints` (constraint_id, name, type (hard/soft), description, parameters_json, penalty_points)
    -   `ScheduleConstraints` (schedule_id, constraint_id, is_active)
    -   `Users` (user_id, username, password_hash, role, email)
    -   `AgentMemory` (agent_id, memory_key, memory_value_json, timestamp)
    -   `MLModels` (model_id, name, version, type, training_data_ref, performance_metrics_json)
    -   `Feedback` (feedback_id, user_id, schedule_id, rating, comments, timestamp)
-   **Data Integrity**: Use of foreign keys, transactions, and validation rules to ensure data consistency.

### 5. UI/UX Design Concepts (Adhering to Black & White Theme)

-   **Overall Aesthetic**: Clean, modern, minimalist design using a black, white, and greyscale palette. High contrast for readability.
-   **Typography**: Clear, sans-serif fonts.
-   **Iconography**: Simple, intuitive icons, likely in a single color (white on black or black on white).
-   **Interactive Elements**: Buttons, dropdowns, and input fields will have clear visual states (default, hover, active, disabled) using variations in shade, borders, or subtle animations.
-   **Data Visualization**: Charts and graphs for metrics will use shades of grey, patterns, and clear labeling to differentiate data series. Avoid reliance on color for critical information.
-   **Mockups (Conceptual - to be developed visually later)**:
    -   **Login Screen**: Simple, with Big 12 logo (B&W), username/password fields, and login button.
    -   **Dashboard**: Grid of widgets showing key information (e.g., upcoming tasks, recent alerts, overall schedule status). Uses shades of grey to differentiate sections.
    -   **Schedule Grid**: Predominantly white or light grey background. Grid lines in a darker grey. Game information displayed in black text. Selected cells or conflicting cells could be highlighted with a border or a slightly darker grey background.

### 6. Integration Points

-   **NCAA Systems**: For fetching championship dates and potentially other regulatory information (requires defining API or data exchange format).
-   **External Data Sources**: For team statistics, historical weather (if relevant for travel), etc.
-   **Broadcast Partners**: Future integration for TV window optimization.

### 7. Deployment and Operations

-   **Containerization**: Docker for all services.
-   **Orchestration**: Kubernetes for managing deployments, scaling, and resilience.
-   **CI/CD Pipeline**: Automated build, test, and deployment processes.
-   **Monitoring**: Tools like Prometheus and Grafana for system health and performance monitoring.
-   **Logging**: Centralized logging (e.g., ELK stack).

### 8. Timeline Considerations (Target: August 2025)

-   The design allows for phased development. Core scheduling and data management functionalities will be prioritized.
-   ML components and advanced agent behaviors can be developed and integrated iteratively.
-   Regular reviews and documentation updates will be crucial to stay on track.

This design document provides a foundational plan. Detailed specifications for each module, API, and database schema will be developed in subsequent stages.
