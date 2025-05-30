# FlexTime Constraint Wizard Wireframe

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
|  Constraint Wizard > Basketball (Men) 2025-26                        |
|  ================================================                    |
|                                                                      |
|  +-------------------+  +---------------------------------------+    |
|  | Constraint Types  |  | Define Constraint                     |    |
|  |                   |  |                                       |    |
|  | [Travel]          |  | Name: Maximum Consecutive Away Games  |    |
|  | [Competitive]     |  | Type: [Hard Constraint] ▼             |    |
|  | [Venue]           |  |                                       |    |
|  | [NCAA Rules]      |  | Description:                          |    |
|  | [Rivalries]       |  | Limits the number of consecutive away |    |
|  | [Custom]          |  | games for any team in the schedule.   |    |
|  |                   |  |                                       |    |
|  | Current: 24 Active|  | Parameters:                           |    |
|  |                   |  | Team: [All Teams] ▼                   |    |
|  | [View All]        |  | Maximum Consecutive: [3] ▼            |    |
|  |                   |  |                                       |    |
|  |                   |  | [Advanced Options]                    |    |
|  |                   |  |                                       |    |
|  |                   |  | [Cancel] [Test] [Save Constraint]     |    |
|  +-------------------+  +---------------------------------------+    |
|                                                                      |
|  +---------------------------------------------------------------+  |
|  | Active Constraints                                            |  |
|  |                                                               |  |
|  | Travel (8)                                                    |  |
|  | • Maximum Consecutive Away Games (Hard)                       |  |
|  | • Maximum Travel Distance per Week (Soft, Weight: 8)          |  |
|  | • Regional Game Clustering (Soft, Weight: 5)                  |  |
|  | [Show More...]                                                |  |
|  |                                                               |  |
|  | Competitive (6)                                               |  |
|  | • Home/Away Balance (Hard)                                    |  |
|  | • Strength of Schedule Distribution (Soft, Weight: 9)         |  |
|  | [Show More...]                                                |  |
|  |                                                               |  |
|  | [Show All Categories]                                         |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  +---------------------------------------------------------------+  |
|  | Constraint Validation                                         |  |
|  |                                                               |  |
|  | ✓ No conflicts between hard constraints                      |  |
|  | ⚠ Potential conflict: Travel Distance vs. Regional Clustering |  |
|  | ✓ All constraints are mathematically feasible                |  |
|  |                                                               |  |
|  | [Run Full Validation]                                         |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  [Back to Schedule]                          [Continue to Generation]|
|                                                                      |
+----------------------------------------------------------------------+
```

## Constraint Wizard Elements

### Header & Navigation
- **Logo**: Big 12 FlexTime logo in black and white
- **User Menu**: Dropdown with profile, preferences, and logout options
- **Notifications**: Dropdown showing recent system notifications
- **Primary Navigation**: Home, Schedules, Teams, Venues, Reports, Settings
- **Breadcrumb**: Shows current location in workflow

### Constraint Types Panel
- **Category Buttons**: Travel, Competitive, Venue, NCAA Rules, Rivalries, Custom
- **Active Count**: Number of currently active constraints
- **View All**: Link to see all constraints in a list view

### Define Constraint Panel
- **Name Field**: Text input for constraint name
- **Type Selector**: Dropdown for Hard/Soft constraint selection
- **Description**: Text area for detailed constraint description
- **Parameters Section**: Dynamic form fields based on constraint type
- **Advanced Options**: Expandable section for additional settings
- **Action Buttons**: Cancel, Test, Save Constraint

### Active Constraints Panel
- **Category Sections**: Grouped by constraint type
- **Constraint Listings**: Name, type, and weight (for soft constraints)
- **Expandable Sections**: Show More/Less toggles
- **Show All Categories**: Expands all constraint categories

### Constraint Validation Panel
- **Validation Results**: List of validation checks
- **Status Indicators**: Checkmarks for passed, warnings for potential issues
- **Detailed Information**: Description of potential conflicts
- **Run Full Validation**: Button to perform comprehensive validation

### Action Buttons
- **Back to Schedule**: Return to schedule overview
- **Continue to Generation**: Proceed to schedule generation step

## Custom Constraint Definition Screen

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
|  Constraint Wizard > Basketball (Men) 2025-26 > Custom Constraint    |
|  ==============================================================      |
|                                                                      |
|  +-------------------+  +---------------------------------------+    |
|  | Definition Method |  | Custom Constraint Builder             |    |
|  |                   |  |                                       |    |
|  | [Visual Builder]  |  | Name: Rivalry Week Games              |    |
|  | [YAML/JSON]       |  | Type: [Soft Constraint] ▼             |    |
|  |                   |  | Weight: [10] ▼                        |    |
|  |                   |  |                                       |    |
|  |                   |  | Logic Builder:                        |    |
|  |                   |  | IF [Team] [plays against] [Rival]     |    |
|  |                   |  | THEN [Schedule] [during] [Week 8]     |    |
|  |                   |  | WITH [Priority] [High]                |    |
|  |                   |  |                                       |    |
|  |                   |  | [+ Add Condition] [+ Add Action]      |    |
|  |                   |  |                                       |    |
|  |                   |  | [Preview YAML]                        |    |
|  |                   |  |                                       |    |
|  |                   |  | [Cancel] [Test] [Save Constraint]     |    |
|  +-------------------+  +---------------------------------------+    |
|                                                                      |
|  +---------------------------------------------------------------+  |
|  | YAML Preview                                                  |  |
|  |                                                               |  |
|  | ```yaml                                                       |  |
|  | constraint:                                                   |  |
|  |   name: "Rivalry Week Games"                                  |  |
|  |   type: "soft"                                                |  |
|  |   weight: 10                                                  |  |
|  |   conditions:                                                 |  |
|  |     - type: "rivalry_matchup"                                 |  |
|  |       teams: "all"                                            |  |
|  |   actions:                                                    |  |
|  |     - type: "schedule_in_period"                              |  |
|  |       period: "week_8"                                        |  |
|  |       priority: "high"                                        |  |
|  | ```                                                           |  |
|  |                                                               |  |
|  | [Edit YAML Directly]                                          |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  [Back to Constraints]                                [Save & Close] |
|                                                                      |
+----------------------------------------------------------------------+
```

## Responsive Behavior
- **Desktop**: Two-column layout as shown
- **Tablet**: Collapsible panels with preserved functionality
- **Mobile**: Single column with accordion sections, simplified constraint builder

## Accessibility Features
- High contrast black and white design
- Keyboard navigable form elements
- Clear labeling of all interactive elements
- Screen reader compatible constraint builder
- Error messages with suggestions for resolution
