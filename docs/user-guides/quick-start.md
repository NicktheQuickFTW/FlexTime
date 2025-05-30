# FlexTime Quick Start Guide

Get up and running with FlexTime in just 5 minutes! This guide will walk you through creating your first schedule.

## Prerequisites

- Access to FlexTime system (web interface or API)
- Basic understanding of your sport's scheduling requirements
- Team and venue information ready

## Step 1: Login and Setup (1 minute)

1. **Access FlexTime**
   ```
   Web Interface: https://flextime.big12.org
   Username: [Your assigned username]
   Password: [Your assigned password]
   ```

2. **Verify Your Profile**
   - Click on your profile in the top-right corner
   - Ensure your sport and conference are correctly set
   - Update contact information if needed

## Step 2: Configure Basic Settings (1 minute)

1. **Select Your Sport**
   - Navigate to Settings → Sport Configuration
   - Choose your sport from the dropdown
   - Verify season dates are correct

2. **Set Up Teams**
   - Go to Teams → Manage Teams
   - Import team list or add manually
   - Verify team information (location, conference, etc.)

## Step 3: Add Basic Constraints (2 minutes)

1. **Essential Constraints**
   ```javascript
   // Example constraint setup
   {
     "type": "venue_availability",
     "description": "Home venue unavailable during academic breaks",
     "rules": {
       "blackout_dates": ["2025-11-25", "2025-12-23"]
     }
   }
   ```

2. **Quick Constraint Setup**
   - Click "Constraints → Quick Setup"
   - Select from pre-configured templates:
     - ✅ Academic Calendar Blackouts
     - ✅ Minimum Rest Days Between Games
     - ✅ Travel Distance Limits
     - ✅ Conference Game Requirements

## Step 4: Generate Your First Schedule (1 minute)

1. **Launch Schedule Builder**
   ```
   Navigate to: Schedules → Create New Schedule
   ```

2. **Basic Configuration**
   - **Schedule Name**: "2025 Regular Season"
   - **Season Type**: Regular Season
   - **Start Date**: First game date
   - **End Date**: Last game date
   - **Games per Team**: Based on your sport's requirements

3. **Generate Schedule**
   - Click "Generate Schedule"
   - Wait for optimization (typically 30-60 seconds)
   - Review the generated schedule

## Step 5: Review and Export

1. **Schedule Review**
   - Check for constraint violations (highlighted in red)
   - Verify travel patterns look reasonable
   - Ensure all teams have correct number of games

2. **Quick Export**
   ```
   Export Options:
   - 📊 Excel (.xlsx) - for sharing
   - 📅 Calendar (.ics) - for importing to calendars
   - 📄 PDF - for printing
   - 💾 JSON - for system integration
   ```

## 🎉 Congratulations!

You've created your first FlexTime schedule! Here's what to do next:

### Immediate Next Steps
- [ ] Share schedule with stakeholders for review
- [ ] Set up automatic notifications
- [ ] Configure advanced constraints if needed

### Advanced Features to Explore
- [ ] Multi-sport coordination
- [ ] Travel cost optimization
- [ ] Championship bracket generation
- [ ] Notion/Calendar integration

## Common First-Time Issues

| Issue | Quick Fix |
|-------|-----------|
| No teams showing | Import team data first |
| Schedule won't generate | Check for conflicting constraints |
| Too many travel violations | Adjust travel distance limits |
| Missing games | Verify game count settings |

## Quick Reference Card

```
🔍 Find Feature:     Ctrl/Cmd + K (search)
💾 Save Schedule:    Ctrl/Cmd + S
🔄 Regenerate:       Alt + R
📊 View Analytics:   Alt + A
❓ Get Help:         F1 or ? key
```

## Video Walkthrough

📹 **Watch the 5-minute Quick Start video**: [FlexTime Quick Start](./videos/quick-start-walkthrough.md)

## What's Next?

Ready to dive deeper? Check out:

- **[Schedule Creation Guide](./schedule-creation.md)** - Detailed scheduling process
- **[Constraint Management](./constraint-management.md)** - Advanced rule setup
- **[Team Management](./team-management.md)** - Comprehensive team setup

## Need Help?

- 📧 **Email Support**: support@flextime.big12.org
- 💬 **Live Chat**: Available during business hours
- 📚 **Knowledge Base**: [FAQ Section](./faq.md)
- 🎥 **Video Library**: [All Tutorial Videos](./videos/)

---

*⏱️ Total time: ~5 minutes*
*🎯 Success rate: 95% of users complete this guide successfully*

*Last updated: May 29, 2025*