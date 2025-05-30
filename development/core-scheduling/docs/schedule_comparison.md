# FlexTime Schedule Comparison & Travel Impact Wireframe

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
|  Schedule Comparison > Basketball (Men) 2025-26                      |
|  ==================================================                  |
|                                                                      |
|  +------------------------+  +------------------------+              |
|  | Scenario Selection     |  | Comparison Metrics     |              |
|  |                        |  |                        |              |
|  | ☑ Scenario A (Travel)  |  | [Travel] [Competitive] |              |
|  | ☑ Scenario B (Balance) |  | [Venue] [Postseason]   |              |
|  | ☐ Scenario C (Venue)   |  |                        |              |
|  |                        |  | [Custom Metric...]     |              |
|  | [Compare Selected]     |  |                        |              |
|  +------------------------+  +------------------------+              |
|                                                                      |
|  +---------------------------------------------------------------+  |
|  | Side-by-Side Comparison                                       |  |
|  |                                                               |  |
|  | +-------------------+  +-------------------+                  |  |
|  | | Scenario A        |  | Scenario B        |                  |  |
|  | | (Travel-Optimized)|  | (Balance-Optimized)|                 |  |
|  | |                   |  |                    |                 |  |
|  | | Total Travel:     |  | Total Travel:      |                 |  |
|  | | 42,500 miles      |  | 46,800 miles       |                 |  |
|  | | (-15% vs. prev)   |  | (-8% vs. prev)     |                 |  |
|  | |                   |  |                    |                 |  |
|  | | Longest Trip:     |  | Longest Trip:      |                 |  |
|  | | 1,250 miles       |  | 1,250 miles        |                 |  |
|  | |                   |  |                    |                 |  |
|  | | Avg. Away Streak: |  | Avg. Away Streak:  |                 |  |
|  | | 2.1 games         |  | 1.8 games          |                 |  |
|  | |                   |  |                    |                 |  |
|  | | [View Calendar]   |  | [View Calendar]    |                 |  |
|  | +-------------------+  +-------------------+                  |  |
|  |                                                               |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  +---------------------------------------------------------------+  |
|  | Travel Impact Visualization                                   |  |
|  |                                                               |  |
|  |                      [MAP VISUALIZATION]                      |  |
|  |                                                               |  |
|  | Legend:  ● Scenario A Routes  ○ Scenario B Routes            |  |
|  |          ▲ Home Venues        ▼ Away Venues                  |  |
|  |                                                               |  |
|  | Team Filter: [All Teams] ▼    Time Period: [Full Season] ▼   |  |
|  |                                                               |  |
|  | [Download Map]                                                |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  +---------------------------------------------------------------+  |
|  | Team-by-Team Comparison                                       |  |
|  |                                                               |  |
|  | Team: [Texas] ▼                                               |  |
|  |                                                               |  |
|  | Metric          | Scenario A | Scenario B | Difference        |  |
|  | ------------------------------------------------------------  |  |
|  | Total Travel    | 5,280 mi   | 5,850 mi   | -570 mi (A better)|  |
|  | Away Games      | 15         | 15         | No difference     |  |
|  | Back-to-Back    | 3          | 2          | +1 (B better)     |  |
|  | Rivalry Games   | 5 (home: 2) | 5 (home: 3) | B better        |  |
|  | NET Projection  | 15.2       | 16.8       | +1.6 (B better)   |  |
|  |                                                               |  |
|  | [View All Teams]                                              |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  [Back]  [Export Comparison]  [Select Scenario A]  [Select Scenario B]|
|                                                                      |
+----------------------------------------------------------------------+
```

## Schedule Comparison & Travel Impact Elements

### Header & Navigation
- **Logo**: Big 12 FlexTime logo in black and white
- **User Menu**: Dropdown with profile, preferences, and logout options
- **Notifications**: Dropdown showing recent system notifications
- **Primary Navigation**: Home, Schedules, Teams, Venues, Reports, Settings
- **Breadcrumb**: Shows current location in workflow

### Scenario Selection Panel
- **Scenario Checkboxes**: Select scenarios to compare
- **Scenario Labels**: Descriptive names indicating optimization focus
- **Compare Selected**: Button to update comparison with selected scenarios

### Comparison Metrics Panel
- **Metric Category Buttons**: Travel, Competitive, Venue, Postseason
- **Custom Metric**: Option to define custom comparison metrics
- **Active Indication**: Visual indicator for currently selected metric category

### Side-by-Side Comparison Panel
- **Scenario Headers**: Names and optimization focus
- **Key Metrics**: Relevant metrics for the selected category
- **Comparative Data**: Values with comparison to previous season or baseline
- **View Calendar**: Links to calendar view for each scenario

### Travel Impact Visualization Panel
- **Map Display**: Geographic visualization of travel routes
- **Legend**: Explanation of map symbols and colors
- **Filters**: Team and time period selection dropdowns
- **Download Map**: Option to export visualization

### Team-by-Team Comparison Panel
- **Team Selector**: Dropdown to select specific team
- **Comparison Table**: Side-by-side metrics for selected team
- **Difference Column**: Numerical and qualitative comparison
- **View All Teams**: Option to see comparison for all teams

### Action Buttons
- **Back**: Return to previous screen
- **Export Comparison**: Generate report of comparison
- **Select Scenario**: Buttons to choose preferred scenario

## Manual Adjustments Screen

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
|  Manual Adjustments > Basketball (Men) 2025-26 > Scenario A          |
|  ==========================================================          |
|                                                                      |
|  +-------------------+  +---------------------------------------+    |
|  | Calendar Controls |  | January 2026                          |    |
|  |                   |  |                                       |    |
|  | View: [Calendar] ▼|  | Su | Mo | Tu | We | Th | Fr | Sa     |    |
|  |                   |  |----+----+----+----+----+----+----    |    |
|  | Team: [All] ▼     |  |    |    |    | 1  | 2  | 3  | 4      |    |
|  |                   |  |----+----+----+----+----+----+----    |    |
|  | Month: [Jan] ▼    |  | 5  | 6  | 7  | 8  | 9  | 10 | 11     |    |
|  |                   |  |    |    | TX |    |    | KU | OSU    |    |
|  | [Previous]        |  |    |    | vs |    |    | vs | vs     |    |
|  | [Next]            |  |    |    | OU |    |    | KSU| ISU    |    |
|  |                   |  |----+----+----+----+----+----+----    |    |
|  | [Today]           |  | 12 | 13 | 14 | 15 | 16 | 17 | 18     |    |
|  |                   |  | BU | TCU|    | UT |    | WVU| CIN    |    |
|  | [Legend]          |  | vs | vs |    | vs |    | vs | vs     |    |
|  |                   |  | UCF| ISU|    | BU |    | TX | KU     |    |
|  |                   |  |----+----+----+----+----+----+----    |    |
|  |                   |  | 19 | 20 | 21 | 22 | 23 | 24 | 25     |    |
|  |                   |  |    | KSU| OU |    | AZ |    | TCU    |    |
|  |                   |  |    | vs | vs |    | vs |    | vs     |    |
|  |                   |  |    | AZ | CIN|    | OSU|    | UT     |    |
|  +-------------------+  +---------------------------------------+    |
|                                                                      |
|  +---------------------------------------------------------------+  |
|  | Game Details                                                  |  |
|  |                                                               |  |
|  | Selected: Kansas vs. Kansas State - January 10, 2026          |  |
|  | Venue: Allen Fieldhouse (Lawrence, KS)                        |  |
|  | Time: 7:00 PM CT                                              |  |
|  | TV: ESPN                                                      |  |
|  |                                                               |  |
|  | [Edit Game]  [Move Game]  [Swap Home/Away]  [Delete Game]     |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  +---------------------------------------------------------------+  |
|  | Impact Analysis                                               |  |
|  |                                                               |  |
|  | Travel Impact:                                                |  |
|  | Kansas State: +120 miles (previous game: Jan 6 vs. Arizona)   |  |
|  | Kansas: No additional travel (home game)                      |  |
|  |                                                               |  |
|  | Constraint Impact:                                            |  |
|  | ✓ All hard constraints satisfied                             |  |
|  | ⚠ Soft constraint affected: Kansas State back-to-back games  |  |
|  |                                                               |  |
|  | [View Full Impact Analysis]                                   |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  [Cancel Changes]  [Save Draft]  [Validate Schedule]  [Finalize]    |
|                                                                      |
+----------------------------------------------------------------------+
```

## Responsive Behavior
- **Desktop**: Full layout as shown
- **Tablet**: Stacked panels with preserved functionality
- **Mobile**: Single column with collapsible panels, simplified calendar view

## Accessibility Features
- High contrast black and white design
- Keyboard navigable calendar with date announcements
- Screen reader compatible game information
- Focus indicators for interactive elements
- Alternative text descriptions for map visualization
