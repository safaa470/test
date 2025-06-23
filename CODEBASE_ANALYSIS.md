# Warehouse Management System - Complete Codebase Analysis

## 🏗️ Architecture Overview

This is a full-stack warehouse management system built with:
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express + SQLite
- **Authentication**: JWT (session-based)
- **File Structure**: Enforced 400-line limit per file

## 📁 Project Structure

```
warehouse-management-system/
├── src/                          # Frontend React application
│   ├── components/              # React components (400-line limit enforced)
│   │   ├── Dashboard/          # Dashboard sub-components
│   │   ├── inventory/          # Inventory management components
│   │   ├── requisitions/       # Requisition management components
│   │   ├── users/              # User management components
│   │   └── modals/             # Modal components
│   ├── contexts/               # React contexts (AuthContext)
│   ├── hooks/                  # Custom hooks
│   └── utils/                  # Utility functions
├── server/                      # Backend Node.js application
│   ├── database/               # Database files and migrations
│   ├── routes/                 # Express API routes
│   ├── scripts/                # Database scripts
│   └── seeders/                # Database seeding
├── supabase/migrations/        # Database migration files (RESTRICTED)
└── dist/                       # Built frontend files
```

## 🔄 Data Flow Architecture

### Authentication Flow
```
Login Component → AuthContext → JWT Token → Session Storage → API Headers
```

### Component Hierarchy
```
App.jsx
├── AuthProvider (Context)
├── Router
│   ├── Login (Public Route)
│   └── Layout (Protected Route)
│       ├── Sidebar
│       ├── Header
│       └── Main Content
│           ├── Dashboard
│           ├── Inventory
│           ├── Requisitions
│           └── UserManagement (Admin Only)
```

## 🧩 Component Architecture

### File Organization Pattern (400-Line Rule)
Each major component follows this pattern when exceeding 400 lines:

```
ComponentName.jsx                 # Main component (< 400 lines)
ComponentName/
├── SubComponent1.jsx            # Extracted functionality
├── SubComponent2.jsx            # Another sub-component
├── hooks.js                     # Custom hooks
├── utils.js                     # Utility functions
└── constants.js                 # Constants
```

### Current Component Structure

#### Dashboard Components
- `Dashboard.jsx` → Main dashboard container
- `Dashboard/DashboardStats.jsx` → Statistics cards
- `Dashboard/QuickActions.jsx` → Action buttons
- `Dashboard/RecentActivity.jsx` → Activity feed
- `Dashboard/SystemInfo.jsx` → System status

#### Inventory Components
- `Inventory.jsx` → Wrapper component
- `inventory/InventoryPage.jsx` → Main inventory page
- `inventory/InventoryStats.jsx` → Inventory statistics
- `inventory/InventoryFilters.jsx` → Search and filters
- `inventory/InventoryTable.jsx` → Data table
- `inventory/InventoryActions.jsx` → Export/import actions
- `inventory/InventoryModals.jsx` → Modal management

#### Requisitions Components
- `Requisitions.jsx` → Wrapper component
- `requisitions/RequisitionsPage.jsx` → Main requisitions page
- `requisitions/RequisitionsStats.jsx` → Statistics
- `requisitions/RequisitionsFilters.jsx` → Filters
- `requisitions/RequisitionsTable.jsx` → Data table
- `requisitions/RequisitionsModals.jsx` → Modal management

#### User Management Components
- `UserManagement.jsx` → Wrapper component
- `users/UserManagementPage.jsx` → Main user page
- `users/UserStats.jsx` → User statistics
- `users/UserFilters.jsx` → User filters
- `users/UserTable.jsx` → User data table
- `users/UserModals.jsx` → Modal management

#### Modal Components
- `modals/InventoryModal.jsx` → Add/edit inventory items
- `modals/RequisitionModal.jsx` → Create/edit requisitions
- `modals/RequisitionViewModal.jsx` → View requisition details
- `modals/ApprovalModal.jsx` → Approve/reject requisitions
- `modals/UserModal.jsx` → Add/edit users
- `modals/CategoryModal.jsx` → Manage categories
- `modals/UnitModal.jsx` → Manage units
- `modals/LocationModal.jsx` → Manage locations
- `modals/SupplierModal.jsx` → Manage suppliers
- `modals/ConfirmationModal.jsx` → Generic confirmation dialog

## 🔌 API Architecture

### Backend Structure
```
server/
├── index.cjs                    # Main server file (Express setup)
├── database/
│   ├── migrator.js             # Database migration handler
│   └── warehouse.db            # SQLite database
├── routes/
│   ├── inventory.js            # Inventory CRUD operations
│   ├── categories.js           # Category management
│   ├── units.js                # Unit management
│   ├── locations.js            # Location management
│   └── suppliers.js            # Supplier management
└── seeders/
    ├── seedDatabase.js         # Main seeder
    └── sampleData.js           # Sample data definitions
```

### API Endpoints

#### Authentication
- `POST /api/auth/login` → User login
- `POST /api/auth/register` → User registration

#### Inventory Management
- `GET /api/inventory` → Get all inventory items
- `POST /api/inventory` → Create new item
- `PUT /api/inventory/:id` → Update item
- `DELETE /api/inventory/:id` → Delete item
- `GET /api/inventory/:id/purchases` → Get purchase history
- `POST /api/inventory/:id/purchase` → Record purchase

#### Supporting Data
- `GET/POST/PUT/DELETE /api/categories` → Category CRUD
- `GET/POST/PUT/DELETE /api/units` → Unit CRUD
- `GET/POST/PUT/DELETE /api/locations` → Location CRUD
- `GET/POST/PUT/DELETE /api/suppliers` → Supplier CRUD

#### Dashboard
- `GET /api/dashboard/stats` → Dashboard statistics

#### User Management
- `GET /api/users` → Get all users
- `POST /api/users` → Create user
- `PUT /api/users/:id` → Update user
- `DELETE /api/users/:id` → Delete user
- `GET /api/users/:id/activity` → User activity log

## 🗄️ Database Schema

### Core Tables
1. **users** - User accounts and authentication
2. **categories** - Item categories (hierarchical)
3. **units** - Measurement units with conversions
4. **locations** - Storage locations
5. **suppliers** - Supplier information
6. **inventory** - Main inventory items
7. **purchase_history** - Purchase tracking
8. **user_activity** - User action logging

### Relationships
```
inventory
├── category_id → categories.id
├── base_unit_id → units.id
├── issue_unit_id → units.id
├── location_id → locations.id
└── supplier_id → suppliers.id

purchase_history
├── inventory_id → inventory.id
├── supplier_id → suppliers.id
└── created_by → users.id

categories
└── parent_id → categories.id (self-referencing)

units
└── base_unit_id → units.id (for conversions)
```

## 🎯 State Management

### Context Providers
- **AuthContext** (`src/contexts/AuthContext.jsx`)
  - Manages user authentication state
  - Handles login/logout
  - Provides user data across app
  - Uses sessionStorage for session-based auth

### Custom Hooks
- **useConfirmation** (`src/hooks/useConfirmation.js`)
  - Manages confirmation dialogs
  - Returns promise-based confirmation
  - Used across delete/submit operations

### State Patterns
1. **Local State**: Component-level useState for forms and UI
2. **Prop Drilling**: Data passed down through component hierarchy
3. **Context**: Global auth state
4. **Server State**: API calls with loading/error states

## 🛣️ Routing Structure

```jsx
App.jsx
├── AuthProvider
└── Router
    ├── /login → Login (public)
    └── / → Layout (protected)
        ├── / → Dashboard
        ├── /inventory → Inventory
        ├── /requisitions → Requisitions
        └── /users → UserManagement (admin only)
```

### Route Protection
- **ProtectedRoute**: Requires authentication
- **AdminRoute**: Requires admin role
- **Navigation**: Sidebar with role-based menu items

## 🎨 Styling Architecture

### Tailwind CSS Setup
- **Base Styles**: `src/index.css`
- **Component Classes**: Defined in CSS layer
- **Utility Classes**: Used throughout components
- **Custom Components**: 
  - `.btn-primary`, `.btn-secondary`, etc.
  - `.form-input`, `.form-select`

### Design System
- **Colors**: Primary (blue), success (green), warning (yellow), error (red)
- **Spacing**: 8px grid system
- **Typography**: System fonts with defined weights
- **Components**: Consistent button and form styles

## 🔧 Development Patterns

### File Organization Rules
1. **400-line limit** enforced on all files
2. **Component splitting** when limit exceeded
3. **Folder structure** mirrors component hierarchy
4. **Naming conventions**: PascalCase for components, camelCase for utilities

### Error Handling
1. **Array Safety**: All API responses checked with `Array.isArray()`
2. **Try-Catch**: Comprehensive error handling in async operations
3. **Toast Notifications**: User feedback via react-hot-toast
4. **Fallback States**: Empty arrays/objects as defaults

### Data Fetching Patterns
```javascript
// Standard pattern used throughout
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

const fetchData = async () => {
  try {
    const response = await axios.get('/api/endpoint');
    const safeData = Array.isArray(response.data) ? response.data : [];
    setData(safeData);
  } catch (error) {
    toast.error('Error message');
    setData([]); // Safe fallback
  } finally {
    setLoading(false);
  }
};
```

## 🔗 Key Dependencies

### Frontend Dependencies
- **React 18** - UI framework
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Lucide React** - Icons
- **jsPDF** - PDF generation
- **Tailwind CSS** - Styling

### Backend Dependencies
- **Express** - Web framework
- **SQLite3** - Database
- **CORS** - Cross-origin requests
- **Multer** - File uploads
- **CSV Parser/Writer** - Data import/export

## 🚀 Build & Deployment

### Scripts
- `npm run dev` - Development with concurrent client/server
- `npm run build` - Production build
- `npm run seed` - Database seeding
- `npm run start` - Production server

### Environment
- **Development**: Client (port 3000) + Server (port 5000)
- **Production**: Served from dist/ folder
- **Database**: SQLite file-based storage

## 🔒 Security Features

### Authentication
- **JWT Tokens** stored in sessionStorage
- **Session-based** - cleared on browser close
- **Role-based access** - admin/manager/user roles
- **Route protection** - authenticated and role-based routes

### Data Validation
- **Input validation** on forms
- **SQL injection protection** via parameterized queries
- **XSS protection** via React's built-in escaping
- **CORS configuration** for API access

## 📋 Enhancement Guidelines

### Before Adding Features
1. **Check file line counts** - split if approaching 400 lines
2. **Follow existing patterns** - use established component structure
3. **Update all related components** - maintain data flow integrity
4. **Add proper error handling** - include array safety checks
5. **Test API endpoints** - ensure backend routes exist
6. **Update navigation** - add routes if needed

### Code Quality Standards
1. **Consistent naming** - follow established conventions
2. **Proper imports** - use relative paths correctly
3. **Error boundaries** - handle edge cases
4. **Loading states** - provide user feedback
5. **Responsive design** - mobile-first approach

### Database Changes
1. **Migration files** are RESTRICTED - cannot be modified
2. **Schema changes** must be handled via new migrations
3. **Seeding data** can be updated in seeders/
4. **API routes** must match database schema

## 🎯 Integration Points

### Critical Integration Areas
1. **Auth Context** - Used by all protected components
2. **API Base URL** - Configured in Vite proxy
3. **Modal Management** - Centralized in *Modals.jsx files
4. **Confirmation Dialogs** - useConfirmation hook
5. **Toast Notifications** - Consistent error/success feedback

### Data Flow Checkpoints
1. **API Response Validation** - Always check array types
2. **State Updates** - Trigger re-renders correctly
3. **Modal State** - Proper open/close handling
4. **Form Validation** - Client and server-side
5. **Route Protection** - Auth and role checks

This codebase follows a well-structured, modular architecture with clear separation of concerns and consistent patterns throughout. The 400-line file limit ensures maintainability, and the comprehensive error handling provides robustness.