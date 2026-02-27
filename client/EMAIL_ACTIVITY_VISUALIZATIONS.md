# Email Activity Visualizations Guide

## Overview

The InboxFlow application now includes comprehensive email activity visualizations that provide deep insights into email processing, team performance, and system health. These visualizations help administrators and team leads understand email workflows, identify bottlenecks, and optimize team performance.

## Components

### 1. Activity Timeline (`ActivityTimeline.jsx`)

**Purpose**: Displays a chronological timeline of all email activities with detailed information.

**Features**:
- Color-coded activity types (created, classified, drafted, approved, sent, failed, etc.)
- Emoji icons for quick visual identification
- Timestamp information (date and time)
- User attribution for each activity
- Email subject reference
- Activity details and notes

**Use Cases**:
- Track email processing history
- Audit trail for compliance
- Identify when issues occurred
- Monitor team activity patterns

**Data Requirements**:
```javascript
{
  _id: string,
  action: 'CREATED' | 'CLASSIFIED' | 'DRAFTED' | 'APPROVED' | 'SENT' | 'FAILED' | 'REPLIED' | 'FORWARDED' | 'ASSIGNED',
  createdAt: ISO8601 timestamp,
  userId: { name: string, email: string },
  emailId: { subject: string },
  details: string (optional)
}
```

### 2. Email Activity Heatmap (`EmailActivityHeatmap.jsx`)

**Purpose**: Visualizes email activity intensity by day of week and hour of day.

**Features**:
- 7-day × 24-hour grid
- Color intensity represents activity volume
- Interactive tooltips showing exact counts
- Legend for intensity levels
- Identifies peak activity times

**Use Cases**:
- Understand team working patterns
- Identify peak email processing times
- Plan resource allocation
- Detect unusual activity patterns

**Data Requirements**:
```javascript
[
  {
    createdAt: ISO8601 timestamp,
    // other activity fields
  }
]
```

**Intensity Levels**:
- Gray: No activity
- Light Blue: 1-20% of max
- Blue: 21-40% of max
- Medium Blue: 41-60% of max
- Dark Blue: 61-80% of max
- Darkest Blue: 81-100% of max

### 3. Email Flow Diagram (`EmailFlowDiagram.jsx`)

**Purpose**: Shows the progression of emails through the processing pipeline.

**Features**:
- Visual flow from received → classified → drafted → approved → sent
- Percentage completion at each stage
- Dropoff visualization (emails not progressing)
- Failed email tracking
- Success rate calculation
- Processing rate metrics

**Use Cases**:
- Monitor email processing efficiency
- Identify bottlenecks in workflow
- Track success rates
- Understand failure patterns

**Data Requirements**:
```javascript
{
  totalEmails: number,
  processedEmails: number,
  draftedEmails: number,
  approvedEmails: number,
  sentEmails: number,
  failedEmails: number
}
```

**Metrics Calculated**:
- Success Rate: (sentEmails / totalEmails) × 100%
- Processing Rate: (processedEmails / totalEmails) × 100%
- Dropoff at each stage: previous stage - current stage

### 4. Response Time Chart (`ResponseTimeChart.jsx`)

**Purpose**: Tracks email response time trends over time.

**Features**:
- Line chart showing average response time
- Min/max response time bands
- Trend analysis
- Time-based grouping (daily)
- Interactive tooltips

**Use Cases**:
- Monitor team responsiveness
- Identify response time trends
- Set performance targets
- Track improvements over time

**Data Requirements**:
```javascript
[
  {
    date: ISO8601 timestamp,
    responseTime: number (minutes),
    // or
    avgResponseTime: number (minutes)
  }
]
```

**Metrics**:
- Average Response Time: Mean of all response times
- Min Response Time: Fastest response
- Max Response Time: Slowest response

### 5. Sentiment Analysis (`SentimentAnalysis.jsx`)

**Purpose**: Analyzes email sentiment distribution and provides insights.

**Features**:
- Bar chart showing sentiment distribution
- Sentiment breakdown cards (positive, neutral, negative)
- Percentage calculations
- Emoji indicators for sentiment
- Actionable insights

**Use Cases**:
- Identify customer satisfaction levels
- Prioritize negative sentiment emails
- Track sentiment trends
- Improve customer service

**Data Requirements**:
```javascript
[
  {
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE',
    // other email fields
  }
]
```

**Sentiment Insights**:
- Positive: Satisfied customers, good feedback
- Neutral: Informational, transactional emails
- Negative: Complaints, issues requiring attention

### 6. Email Volume Chart (`EmailVolumeChart.jsx`)

**Purpose**: Visualizes email volume trends over time.

**Features**:
- Line or bar chart options
- Tracks received, sent, and failed emails
- Time-based grouping (daily)
- Trend analysis
- Comparative visualization

**Use Cases**:
- Monitor email volume trends
- Identify seasonal patterns
- Plan capacity
- Detect anomalies

**Data Requirements**:
```javascript
[
  {
    date: ISO8601 timestamp,
    type: 'sent' | 'received' | 'failed',
    status: 'SENT' | 'FAILED' | 'NEW',
    // other email fields
  }
]
```

**Chart Types**:
- Line: Shows trends and patterns
- Bar: Shows discrete daily volumes

### 7. User Activity Stats (`UserActivityStats.jsx`)

**Purpose**: Displays team member performance metrics and activity levels.

**Features**:
- User performance table
- Activity level indicators (inactive, low, medium, high)
- Emails processed and sent counts
- Average response time
- Completion rate progress bars
- Last active timestamp
- Top performers section
- Summary statistics

**Use Cases**:
- Monitor team performance
- Identify high performers
- Track individual productivity
- Manage workload distribution

**Data Requirements**:
```javascript
[
  {
    name: string,
    email: string,
    emailsProcessed: number,
    emailsSent: number,
    avgResponseTime: number (minutes),
    completionRate: number (0-100),
    lastActive: ISO8601 timestamp,
    role: string
  }
]
```

**Activity Levels**:
- Inactive: 0 emails processed
- Low: 1-10 emails processed
- Medium: 11-50 emails processed
- High: 50+ emails processed

## Activity Dashboard (`ActivityDashboard.jsx`)

The main Activity Dashboard integrates all visualizations into a comprehensive view.

### Features

1. **Time Range Selection**: Filter data by week, month, quarter, or year
2. **Key Metrics**: Quick overview of important statistics
3. **Email Processing Flow**: Visual pipeline of email progression
4. **Email Volume Chart**: Trends with line/bar toggle
5. **Activity Heatmap**: Day/hour activity intensity
6. **Response Time Trends**: Performance over time
7. **Sentiment Analysis**: Customer satisfaction insights
8. **Team Activity**: Individual and team performance
9. **Activity Timeline**: Detailed activity log

### Navigation

Access the Activity Dashboard from:
- Sidebar: Management → Activity
- URL: `/app/activity`

### Time Range Options

- **Last 7 days**: Recent activity and trends
- **Last 30 days**: Monthly performance
- **Last 90 days**: Quarterly analysis
- **Last year**: Annual trends

## Data Flow

```
Backend API
    ↓
Dashboard API (overview, activities)
    ↓
Analytics API (category, team stats)
    ↓
ActivityDashboard Component
    ↓
Individual Visualization Components
    ↓
User Interface
```

## API Endpoints Used

### Dashboard Endpoint
```
GET /api/dashboard
Query Parameters:
  - fromDate: ISO8601 timestamp
  - toDate: ISO8601 timestamp

Response:
{
  overview: {
    totalEmails: number,
    processedEmails: number,
    draftedEmails: number,
    approvedEmails: number,
    sentEmails: number,
    failedEmails: number,
    avgResponseTime: number
  },
  recentActivity: Activity[],
  categories: object,
  status: object,
  priorities: object
}
```

### Analytics Endpoints
```
GET /api/analytics/category
GET /api/analytics/team
Query Parameters:
  - fromDate: ISO8601 timestamp
  - toDate: ISO8601 timestamp
```

## Performance Considerations

### Optimization Tips

1. **Data Aggregation**: Pre-aggregate data on the backend when possible
2. **Pagination**: Use pagination for large datasets
3. **Caching**: Cache frequently accessed data
4. **Lazy Loading**: Load visualizations on demand
5. **Chart Optimization**: Use appropriate chart types for data size

### Recommended Limits

- Activity Timeline: 100-500 items
- Heatmap: 7 days × 24 hours (fixed)
- Volume Chart: 30-90 data points
- User Stats: 10-50 users

## Customization

### Adding New Visualizations

1. Create a new component in `src/components/analytics/`
2. Import required Chart.js modules
3. Implement data transformation logic
4. Add to ActivityDashboard
5. Update documentation

### Styling

All components use Tailwind CSS with:
- Consistent color palette
- Responsive design
- Dark mode support (future)
- Accessibility features

### Color Scheme

- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)
- Info: Purple (#A855F7)

## Accessibility

### Features

- Semantic HTML structure
- ARIA labels for charts
- Keyboard navigation support
- Color-blind friendly palette
- Sufficient contrast ratios
- Responsive design

### Best Practices

- Always provide text alternatives for charts
- Use descriptive labels
- Include data tables alongside charts
- Support keyboard shortcuts
- Test with screen readers

## Troubleshooting

### Common Issues

**1. No data displayed**
- Check API endpoints are returning data
- Verify date range parameters
- Check browser console for errors
- Ensure user has appropriate permissions

**2. Charts not rendering**
- Verify Chart.js is properly installed
- Check data format matches requirements
- Ensure container has height defined
- Check for JavaScript errors

**3. Performance issues**
- Reduce data range
- Implement pagination
- Use data aggregation
- Optimize API queries

**4. Missing activities**
- Verify activities are being created
- Check date range filters
- Ensure user permissions allow viewing
- Check database for activity records

## Future Enhancements

### Planned Features

1. **Real-time Updates**: WebSocket integration for live data
2. **Custom Reports**: User-defined report generation
3. **Export Functionality**: PDF, CSV, Excel exports
4. **Alerts & Notifications**: Threshold-based alerts
5. **Predictive Analytics**: ML-based forecasting
6. **Comparison Views**: Period-over-period comparison
7. **Custom Dashboards**: User-configurable layouts
8. **Mobile Optimization**: Enhanced mobile experience

### Integration Opportunities

- Slack notifications for key metrics
- Email reports with visualizations
- Third-party BI tool integration
- Custom metric calculations
- Advanced filtering options

## Support & Documentation

For questions or issues:

1. Check this documentation
2. Review component source code
3. Check browser console for errors
4. Review API responses
5. Contact development team

## Examples

### Accessing Activity Dashboard

```javascript
// Navigate to activity dashboard
navigate('/app/activity');

// With time range
navigate('/app/activity?range=month');
```

### Using Individual Components

```javascript
import ActivityTimeline from '../components/analytics/ActivityTimeline';

<ActivityTimeline 
  activities={activities} 
  loading={loading} 
/>
```

### Data Transformation

```javascript
// Transform raw API data for visualization
const transformActivityData = (activities) => {
  return activities.map(activity => ({
    ...activity,
    formattedDate: format(parseISO(activity.createdAt), 'MMM d, h:mm a')
  }));
};
```

The email activity visualizations provide comprehensive insights into email processing workflows, team performance, and system health. Use these tools to optimize operations and improve team productivity.