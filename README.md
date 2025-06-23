# Warehouse Management System

A comprehensive inventory and requisition management system built with React and Node.js.

## Features

- **Inventory Management**: Track items, categories, units, locations, and suppliers
- **Requisition System**: Create and manage purchase requisitions with approval workflows
- **User Management**: Role-based access control (Admin, Manager, User)
- **Dashboard**: Real-time statistics and activity monitoring
- **Reporting**: Export data and generate PDF reports
- **File Structure**: Enforced 400-line limit per file for maintainability

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Seed the database with sample data:**
   ```bash
   npm run seed
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Default Login

- **Username:** admin
- **Password:** admin

## Sample Data

The seeding script adds comprehensive test data including:

### Inventory Items (30 items)
- **Office Supplies**: Pens, paper, notebooks, sticky notes, ink cartridges
- **Electronics**: Laptops, tablets, mice, cables, chargers, batteries
- **Furniture**: Chairs, desks, filing cabinets, storage bins
- **Safety Equipment**: Helmets, vests, safety gloves
- **Cleaning Supplies**: All-purpose cleaner, paper towels, trash bags, hand sanitizer
- **Tools & Hardware**: Drills, screwdrivers, measuring tapes, work gloves

### Supporting Data
- **6 Categories** with subcategories (Office Supplies → Stationery, Printing)
- **14 Units** with conversions (pieces, dozen, kg, grams, liters, etc.)
- **6 Locations** (Main Warehouse, Office Storage, Electronics Lab, etc.)
- **6 Suppliers** with complete contact information

### Test Scenarios
- **Normal Stock**: Items with adequate inventory levels
- **Low Stock**: Items below minimum quantity (triggers warnings)
- **Out of Stock**: Items with zero quantity (requires purchase orders)
- **Various Price Ranges**: From $2.75 (sticky notes) to $899.99 (laptops)
- **Unit Conversions**: Items with different base and issue units

## Database Commands

```bash
# Seed database with sample data
npm run seed

# Fresh seed (same as above)
npm run seed:fresh
```

## File Structure Guidelines

This project enforces a **400-line limit per file** to maintain code quality:

- Files exceeding 400 lines must be split into smaller, focused files
- Components are organized in dedicated folders with sub-components
- See `src/components/README.md` for detailed guidelines

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Inventory
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Create new item
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item

### Categories, Units, Locations, Suppliers
- Standard CRUD operations for each entity
- `GET /api/{entity}` - List all
- `POST /api/{entity}` - Create new
- `PUT /api/{entity}/:id` - Update
- `DELETE /api/{entity}/:id` - Delete

### Requisitions
- `GET /api/requisitions` - Get all requisitions
- `POST /api/requisitions` - Create new requisition
- `PUT /api/requisitions/:id` - Update requisition
- `POST /api/requisitions/:id/submit` - Submit for approval
- `POST /api/requisitions/:id/approve` - Approve/reject requisition

## Technology Stack

- **Frontend**: React 18, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express
- **Database**: SQLite with better-sqlite3
- **Build Tool**: Vite
- **Authentication**: JWT tokens (session-based)

## Development

The application uses a session-based authentication system where tokens are stored in sessionStorage and automatically cleared when the browser is closed.

### Project Structure
```
src/
├── components/           # React components (max 400 lines each)
├── contexts/            # React contexts
├── hooks/               # Custom hooks
├── utils/               # Utility functions
└── main.jsx            # Application entry point

server/
├── database/           # Database files and migrations
├── seeders/            # Database seeding scripts
├── scripts/            # Utility scripts
└── index.cjs          # Server entry point
```

## Testing the Application

After seeding, you can test various scenarios:

1. **Dashboard**: View inventory statistics and recent activity
2. **Inventory Management**: 
   - Browse items by category
   - Filter by stock levels (All, Good Stock, Low Stock, Out of Stock)
   - Search by name, SKU, or category
   - Add/edit items with different units and conversions
3. **Requisitions**:
   - Create requisitions with inventory items
   - Test approval workflows
   - View stock status warnings
4. **User Management** (Admin only):
   - Manage user accounts and roles
   - View user activity logs

## Contributing

When adding new features:
1. Follow the 400-line file limit
2. Use the established component patterns
3. Add proper error handling with array safety checks
4. Update documentation as needed

## License

This project is private and proprietary.