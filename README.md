# FinSecure Frontend

A modern, minimalist React application for HR and Finance management built with Vite and Tailwind CSS.

## Features

### 🎨 **Enhanced UI/UX for Insurance Module**
- **Modern Card-Based Design**: Improved insurance pages with professional styling
- **Interactive Elements**: Hover effects, smooth transitions, and better visual hierarchy
- **Role-Based Views**: Different interfaces for Admin, HR, and Employee users
- **Responsive Layout**: Optimized for desktop and mobile devices

### 🧭 **Navigation & Layout**
- **Header Navigation**: Clean header with module links and logout button
- **Breadcrumb Navigation**: Easy navigation between insurance sub-pages
- **Status Indicators**: Visual status badges and progress indicators
- **Filter Controls**: Enhanced filtering options with modern button styles

### 📱 **Insurance Module Enhancements**
- **Dashboard Cards**: Interactive cards with descriptions and action indicators
- **Statistics Widgets**: Quick stats for admins and HR users
- **Advanced Filters**: Status filtering with count badges
- **Employee Search**: Quick employee ID filtering functionality
- **Action Panels**: Inline approval/rejection workflows

### 🔧 **Technical Stack**
- **React 19**: Latest React with modern hooks and features
- **React Router DOM**: Client-side routing for navigation
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Vite**: Fast build tool and development server
- **ESLint**: Code quality and consistency

### 📊 **Modules**
- **HR Management**: Employee records and organizational data
- **Finance**: Banking, investments, salary processing, and reports
- **Insurance**: Enhanced claims management, plans, and employee coverage
- **Timesheet**: Time tracking and attendance
- **Training**: Course management and development
- **Assets**: Equipment and resource tracking
- **Profile**: Personal account management

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```

## Project Structure

```
src/
├── pages/
│   ├── insurance/           # Enhanced insurance pages
│   │   ├── InsurancePage.jsx    # Main dashboard with modern cards
│   │   ├── AllClaims.jsx        # Enhanced claims management
│   │   └── ...                  # Other insurance pages
│   ├── finance/             # Finance-related pages
│   ├── hr/                  # HR-related pages
│   └── ...                  # Other module pages
├── App.jsx                  # Main app with routing
└── main.jsx                 # App entry point
```

## Design Principles

- **Minimalist**: Clean layouts with strategic use of white space
- **Functional**: Focus on usability and workflow efficiency
- **Consistent**: Unified design language across components
- **Accessible**: Proper contrast and semantic HTML structure
- **Scalable**: Modular components for easy maintenance

## Authentication

The app uses JWT-based authentication with role-based access:
- **Admin**: Full access to approve/reject claims and manage all data
- **HR**: Read-only access to comprehensive insurance data
- **Employee**: Limited access to personal claims and coverage

## Insurance Module Features

### For Administrators
- **Claim Management**: Approve/reject claims with inline action panels
- **Employee Filtering**: Quick search by employee ID
- **Status Filtering**: Filter by pending, approved, or rejected claims
- **Bulk Operations**: Efficient workflow for multiple claims

### For HR Users
- **Read-Only Access**: Comprehensive view of all insurance data
- **Reporting**: Access to insurance reports and analytics
- **Employee Oversight**: View employee insurance details

### For Employees
- **Personal Dashboard**: Access to personal claims and top-ups
- **Self-Service**: Manage personal insurance information
- **Status Tracking**: Monitor claim progress and approvals

## Contributing

When enhancing the insurance module:
1. Maintain the card-based design pattern
2. Use Tailwind CSS classes for consistent styling
3. Add hover effects and smooth transitions
4. Ensure role-based conditional rendering
5. Test across different user roles

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
