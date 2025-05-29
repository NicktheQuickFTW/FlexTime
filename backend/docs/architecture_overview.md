```
+-------------------------------------------------------------------------------------------------------------+
|                                     FlexTime Scheduling Platform                                             |
+-------------------------------------------------------------------------------------------------------------+
                                                    |
                +-----------------------------------+-----------------------------------+
                |                                   |                                   |
    +-----------v-----------+         +------------v-----------+         +-------------v------------+
    |    Client Layer       |         |    Application Layer   |         |    Infrastructure Layer  |
    +-----------------------+         +------------------------+         +--------------------------+
    | - Web Application     |         | - API Gateway          |         | - Kubernetes + KEDA      |
    | - Mobile App (Future) |         | - Microservices        |         | - RabbitMQ               |
    | - API Consumers       |         | - Agent System         |         | - PostgreSQL             |
    +-----------------------+         +------------------------+         | - Redis                  |
                                                    |                    | - S3 Storage             |
                                                    |                    | - Observability Stack    |
                                      +-------------v-------------+      +--------------------------+
                                      |    Service Topology       |
                                      +---------------------------+
                                      | - api-svc                 |
                                      | - scheduler-svc           |
                                      | - notification-svc        |
                                      | - import-svc              |
                                      | - reporting-svc           |
                                      | - comment-svc             |
                                      +---------------------------+
                                                    |
                +-----------------------------------+-----------------------------------+
                |                                   |                                   |
    +-----------v-----------+         +------------v-----------+         +-------------v------------+
    |    Agent System       |         |    Data Management     |         |    Integration Layer     |
    +-----------------------+         +------------------------+         +--------------------------+
    | - Master Director     |         | - PostgreSQL           |         | - SSO Integration        |
    | - Scheduling Director |         | - Analytics Replica    |         | - Calendar Systems       |
    | - Algorithm Selection |         | - Redis Cache          |         | - Venue Management       |
    | - Constraint Mgmt     |         | - S3 Object Storage    |         | - Athletic Dept Systems  |
    | - Schedule Optimizer  |         | - Event Streams        |         | - WebSocket Gateway      |
    | - Travel Optimizer    |         +------------------------+         +--------------------------+
    | - Venue Management    |
    | - Notification        |
    +-----------------------+
```
