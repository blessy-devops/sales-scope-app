# Blessy Sales Dashboard - Project Knowledge Base

## 📋 Project Overview

**Blessy Sales Dashboard** is a comprehensive sales analytics and management application built with React, TypeScript, and Supabase. The application helps businesses track daily sales, manage sales targets, monitor channel performance, and detect anomalies in sales patterns across multiple sales channels.

### Core Purpose
- Track and analyze daily sales performance across multiple channels
- Set and monitor monthly sales targets
- Provide real-time insights into sales metrics and projections
- Detect sales anomalies and performance deviations
- Enable data-driven decision making through comprehensive dashboards

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript for type-safe development
- **Tailwind CSS** with custom design system for consistent styling
- **Vite** as build tool for fast development and optimized builds
- **React Router** for client-side routing
- **Date-fns** for date manipulation and formatting
- **Recharts** for data visualization and charts
- **Shadcn/ui** components for consistent UI patterns

### Backend & Database
- **Supabase** as backend-as-a-service providing:
  - PostgreSQL database with Row Level Security (RLS)
  - Real-time subscriptions
  - Authentication system
  - Edge functions for custom logic
  - File storage capabilities

### Database Schema
Key tables include:
- `channels` - Sales channel definitions (e-commerce, marketplace, landing pages)
- `daily_sales` - Daily sales records per channel
- `sales_targets` - Monthly sales targets per channel
- `target_history` - Audit log for target changes
- `user_profiles` - Extended user information
- `user_preferences` - User customization settings
- `anomaly_logs` - Automated anomaly detection records
- `daily_observations` - Manual daily notes and observations

## 🎯 Core Features

### 1. Dashboard Analytics (`/`)
- **Multi-period Analysis**: View current month or custom date ranges (multiple months)
- **Performance Metrics**: Real-time calculation of sales vs targets with performance percentages
- **Rhythm Analysis**: Current pace, projected totals, and required pace calculations
- **Channel Filtering**: Global view or individual channel performance
- **Interactive Charts**: Sales vs targets visualization with trend lines
- **Anomaly Alerts**: Automated detection and display of performance anomalies

Key Metrics Displayed:
- Total sales realized vs monthly targets
- Performance percentage (ahead/behind expected pace)
- Remaining target amount and percentage
- Daily rhythm metrics (current, projected, required)
- Channel-specific performance breakdown

### 2. Sales Entry (`/sales`)
- **Daily Sales Input**: Record sales amounts for each active channel
- **Date Selection**: Enter sales for any date (defaults to yesterday)
- **Batch Operations**: Copy previous day's values for quick entry
- **Real-time Validation**: Immediate feedback on data entry
- **Sales Summary**: Live calculation of totals and channel breakdown
- **Edit Capability**: Modify previously entered sales data

### 3. Target Management (`/targets`)
- **Monthly Target Setting**: Define sales targets per channel per month
- **Historical View**: Access and modify targets for any month/year
- **Target Copying**: Replicate previous month's targets
- **Change Tracking**: Complete audit trail of target modifications
- **Bulk Operations**: Efficiently set targets across multiple channels
- **Target Validation**: Ensure realistic and achievable target setting

### 4. Channel Management (`/channels`)
- **Channel CRUD**: Create, read, update, delete sales channels
- **Channel Types**: Support for E-commerce, Marketplace, Landing Page channels
- **Custom Icons**: Upload and manage channel-specific icons
- **Active/Inactive States**: Enable/disable channels without data loss
- **Channel Categorization**: Organize channels by type and purpose
- **Search & Filter**: Quickly find specific channels

### 5. User Experience Features
- **Real-time Updates**: Live data synchronization across all components
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Dark/Light Mode**: Theme switching with user preference persistence
- **User Preferences**: Customizable dashboard layouts and settings
- **Period Filtering**: Flexible date range selection for historical analysis
- **Data Export**: XLSX export capabilities for external analysis

## 🔧 Key Components & Hooks

### Core Hooks
- `useDailySales` - Manages daily sales data CRUD operations
- `useTargets` - Handles sales targets and target history
- `useChannels` - Channel management and operations
- `useUserPreferences` - User customization and settings persistence
- `useDataReferencia` - Business logic for date calculations and modes
- `useAnomalyDetection` - Automated anomaly detection and alerting
- `useRealTimeUpdates` - Real-time data synchronization

### UI Components
- `DashboardChart` - Interactive sales vs targets visualization
- `PeriodRangePicker` - Custom date range selection component
- `ChannelCard` - Channel display and management interface
- `AnomalyAlertsCard` - Anomaly detection display and management
- `TargetHistoryPanel` - Target change history visualization

## 📊 Business Logic & Calculations

### Performance Metrics
- **Expected Target**: (Monthly Target ÷ Days in Month) × Days Passed
- **Performance Value**: Realized Sales - Expected Target
- **Performance Percentage**: (Performance Value ÷ Expected Target) × 100
- **Remaining Target**: Monthly Target - Realized Sales

### Rhythm Analysis
- **Current Pace**: Total Sales ÷ Days Passed
- **Projected Total**: Current Pace × Total Days in Month
- **Required Pace**: Remaining Target ÷ Days Remaining
- **Projected Percentage**: (Projected Total ÷ Monthly Target) × 100

### Date Reference Modes
- **D-1 Mode**: Uses yesterday as reference date (default)
- **D0 Mode**: Uses today as reference date
- **Custom Periods**: Supports multi-month analysis and historical data

## 🔐 Security & Authentication

### Row Level Security (RLS)
- All tables protected with RLS policies
- User-specific data access controls
- Secure API endpoints with authentication

### User Management
- Supabase Auth integration
- Profile management with extended user data
- Preference persistence across sessions

## 📈 Data Flow & Real-time Features

### Real-time Updates
- Live sales data synchronization
- Instant metric recalculation
- Cross-component state management
- Connection status monitoring

### Data Validation
- Input validation at component and database level
- Business rule enforcement
- Data consistency checks
- Error handling and user feedback

## 🎨 Design System

### Color Scheme
- Semantic color tokens defined in `index.css`
- HSL-based color system for consistency
- Dark/light mode support
- Accessibility-compliant contrast ratios

### Component Patterns
- Consistent spacing and typography
- Reusable UI components from Shadcn/ui
- Custom variants for business-specific needs
- Responsive design patterns

## 🚀 Performance & Optimization

### Data Optimization
- Efficient database queries with proper indexing
- Real-time subscriptions for live updates
- Memoized calculations for complex metrics
- Lazy loading for large datasets

### UI Performance
- Component memoization for expensive calculations
- Optimized re-renders with proper dependency arrays
- Efficient state management
- Progressive loading patterns

## 📱 User Workflows

### Daily Usage Patterns
1. **Morning Review**: Check dashboard for yesterday's performance
2. **Sales Entry**: Input previous day's sales data
3. **Performance Analysis**: Review metrics and trends
4. **Target Adjustments**: Modify targets based on performance

### Monthly Planning
1. **Target Setting**: Define monthly targets per channel
2. **Historical Analysis**: Review previous month's performance
3. **Strategy Adjustment**: Modify targets based on trends
4. **Channel Optimization**: Activate/deactivate channels as needed

## 🔮 Extensibility & Future Enhancements

### Modular Architecture
- Hook-based business logic separation
- Component composition patterns
- Type-safe interfaces for data structures
- Extensible database schema

### Integration Points
- REST API compatibility
- Webhook support for external systems
- Export capabilities for reporting tools
- Authentication provider flexibility

This knowledge base provides a comprehensive overview of the Blessy Sales Dashboard project, its architecture, features, and implementation details. The application is designed for scalability, maintainability, and user experience excellence in sales management and analytics.