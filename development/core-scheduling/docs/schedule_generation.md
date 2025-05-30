# FlexTime Schedule Generation Wireframe

```
+----------------------------------------------------------------------+
|                                                                      |
|  [LOGO] FlexTime                                 [User] ▼ [Notif] ▼  |
|                                                                      |
+----------------------------------------------------------------------+
|                                                                      |
|  [Home] [Schedules] [Teams] [Venues] [Reports] [Settings]            |
|                                                                      |
+----------------------------------------------------------------------+
|                                                                      |
|  Generate Schedule > Basketball (Men) 2025-26                        |
|  ================================================                    |
|                                                                      |
|  +---------------------------------------------------------------+  |
|  | Configuration                                                 |  |
|  |                                                               |  |
|  | Sport: Basketball (Men)          Season: 2025-26              |  |
|  | Teams: 12 Active                 Venues: 15 Available         |  |
|  | Constraints: 24 Active           Algorithm: Standard          |  |
|  |                                                               |  |
|  | [Edit Configuration]                      [View Constraints]  |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  +---------------------------------------------------------------+  |
|  | Optimization Goals                                            |  |
|  |                                                               |  |
|  | Travel Distance:     [################----] High Priority     |  |
|  | Competitive Balance: [##########----------] Medium Priority   |  |
|  | Venue Utilization:   [######--------------] Low Priority      |  |
|  | Postseason Impact:   [####################] Highest Priority  |  |
|  |                                                               |  |
|  | [Adjust Priorities]                                           |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  +---------------------------------------------------------------+  |
|  | Generation Options                                            |  |
|  |                                                               |  |
|  | Number of Scenarios: [3] ▼                                    |  |
|  | Processing Time Limit: [5 minutes] ▼                          |  |
|  | Advanced Options: [Show]                                      |  |
|  |                                                               |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  +---------------------------------------------------------------+  |
|  | Validation                                                    |  |
|  |                                                               |  |
|  | ✓ All teams have required venues                             |  |
|  | ✓ All constraints are valid                                  |  |
|  | ✓ Season dates are properly configured                       |  |
|  | ✓ NCAA compliance rules checked                              |  |
|  | ✓ Schedule is mathematically feasible                        |  |
|  |                                                               |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  [Cancel]                                      [Generate Schedule]   |
|                                                                      |
+----------------------------------------------------------------------+
```

## Schedule Generation Elements

### Header & Navigation
- **Logo**: Big 12 FlexTime logo in black and white
- **User Menu**: Dropdown with profile, preferences, and logout options
- **Notifications**: Dropdown showing recent system notifications
- **Primary Navigation**: Home, Schedules, Teams, Venues, Reports, Settings
- **Breadcrumb**: Shows current location in workflow

### Configuration Panel
- **Sport and Season**: Selected sport and academic year
- **Teams and Venues**: Count of active teams and available venues
- **Constraints**: Number of active constraints
- **Algorithm**: Selected algorithm profile
- **Action Buttons**: Edit Configuration, View Constraints

### Optimization Goals Panel
- **Priority Sliders**: Visual representation of priority for each goal
- **Goal Categories**: 
  - Travel Distance
  - Competitive Balance
  - Venue Utilization
  - Postseason Impact
- **Priority Labels**: Text indication of priority level
- **Adjust Priorities**: Button to modify goal priorities

### Generation Options Panel
- **Number of Scenarios**: Dropdown to select how many schedule options to generate
- **Processing Time Limit**: Maximum time allowed for generation
- **Advanced Options**: Expandable section for additional settings

### Validation Panel
- **Validation Checks**: List of pre-generation validation checks
- **Status Indicators**: Visual indicators of pass/fail status
- **Detailed Information**: Available on hover/click for each check

### Action Buttons
- **Cancel**: Return to previous screen without generating
- **Generate Schedule**: Begin the schedule generation process

## Generation Process Screen (After clicking Generate)

```
+----------------------------------------------------------------------+
|                                                                      |
|  [LOGO] FlexTime                                 [User] ▼ [Notif] ▼  |
|                                                                      |
+----------------------------------------------------------------------+
|                                                                      |
|  [Home] [Schedules] [Teams] [Venues] [Reports] [Settings]            |
|                                                                      |
+----------------------------------------------------------------------+
|                                                                      |
|  Generate Schedule > Basketball (Men) 2025-26 > Processing           |
|  =========================================================           |
|                                                                      |
|  +---------------------------------------------------------------+  |
|  | Schedule Generation in Progress                               |  |
|  |                                                               |  |
|  | [####################--------------------] 50% Complete       |  |
|  |                                                               |  |
|  | Current Phase: Optimizing Travel Patterns                     |  |
|  | Time Elapsed: 2:15                   Estimated Time: 2:30     |  |
|  |                                                               |  |
|  | [Cancel Generation]                                           |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  +---------------------------------------------------------------+  |
|  | Generation Log                                                |  |
|  |                                                               |  |
|  | 01:45:23 - Initialization complete                            |  |
|  | 01:45:25 - Constraint validation passed                       |  |
|  | 01:45:30 - Building mathematical model                        |  |
|  | 01:46:15 - Initial solution found                             |  |
|  | 01:46:45 - Optimizing competitive balance                     |  |
|  | 01:47:30 - Optimizing travel patterns                         |  |
|  |                                                               |  |
|  | [Show Detailed Log]                                           |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  +---------------------------------------------------------------+  |
|  | Scenarios Found: 2 of 3                                       |  |
|  |                                                               |  |
|  | Scenario A: Travel-optimized                                  |  |
|  | • 15% reduction in travel distance                            |  |
|  | • Medium competitive balance                                  |  |
|  |                                                               |  |
|  | Scenario B: Balance-optimized                                 |  |
|  | • 8% reduction in travel distance                             |  |
|  | • High competitive balance                                    |  |
|  |                                                               |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
+----------------------------------------------------------------------+
```

## Responsive Behavior
- **Desktop**: Full layout as shown
- **Tablet**: Stacked panels with preserved functionality
- **Mobile**: Single column with collapsible panels, simplified progress indicators

## Accessibility Features
- High contrast black and white design
- Progress indicators with both visual and text representation
- Keyboard navigable interface
- Screen reader announcements for progress updates
