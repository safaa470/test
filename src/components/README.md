# Component Structure Guidelines

This document outlines the file organization rules and patterns for the Warehouse Management System.

## 400-Line Rule

**Every code file must not exceed 400 lines.** When a file approaches or exceeds this limit, it must be split into smaller, focused files.

## File Organization Patterns

### 1. Component Splitting Pattern

When a component exceeds 400 lines:

```
src/components/
├── ComponentName.jsx                 # Main component (< 400 lines)
├── ComponentName/
│   ├── SubComponent1.jsx            # Extracted sub-component
│   ├── SubComponent2.jsx            # Another sub-component
│   ├── hooks.js                     # Custom hooks
│   ├── utils.js                     # Utility functions
│   └── constants.js                 # Constants and configurations
```

### 2. Modal Components Pattern

```
src/components/modals/
├── ModalName.jsx                     # Main modal component
├── ModalName/
│   ├── Form.jsx                     # Form section
│   ├── ItemsSection.jsx             # Items management section
│   ├── validation.js                # Form validation logic
│   └── utils.js                     # Modal-specific utilities
```

### 3. Page Components Pattern

```
src/components/pages/
├── PageName.jsx                      # Main page component
├── PageName/
│   ├── Stats.jsx                    # Statistics section
│   ├── Filters.jsx                  # Filter controls
│   ├── Table.jsx                    # Data table
│   ├── Modals.jsx                   # Modal management
│   └── hooks.js                     # Page-specific hooks
```

## Examples of Properly Split Components

### Dashboard Component
- `Dashboard.jsx` (main component)
- `Dashboard/DashboardStats.jsx` (statistics section)
- `Dashboard/QuickActions.jsx` (action buttons)
- `Dashboard/RecentActivity.jsx` (activity feed)
- `Dashboard/SystemInfo.jsx` (system information)

### RequisitionModal Component
- `RequisitionModal.jsx` (main modal)
- `RequisitionModal/RequisitionForm.jsx` (basic form)
- `RequisitionModal/ItemsSection.jsx` (items management)

## When to Split Files

Split a file when it:
- Exceeds 400 lines
- Has multiple distinct responsibilities
- Contains complex form logic
- Has extensive conditional rendering
- Mixes different concerns (UI, logic, data)

## How to Split Files

1. **Identify logical sections** - Look for distinct functional areas
2. **Extract sub-components** - Move related JSX and logic together
3. **Create utility files** - Move pure functions to separate files
4. **Extract constants** - Move configuration to dedicated files
5. **Create custom hooks** - Move complex state logic to hooks

## Naming Conventions

- **Components**: PascalCase (`ComponentName.jsx`)
- **Folders**: PascalCase matching component name
- **Utilities**: camelCase (`utilityFunction.js`)
- **Constants**: UPPER_SNAKE_CASE (`CONSTANT_NAME`)
- **Hooks**: camelCase starting with 'use' (`useCustomHook.js`)

## Benefits of This Structure

1. **Maintainability** - Smaller files are easier to understand and modify
2. **Reusability** - Sub-components can be reused elsewhere
3. **Testing** - Smaller components are easier to test
4. **Collaboration** - Multiple developers can work on different parts
5. **Performance** - Better code splitting and lazy loading opportunities

## Enforcement

The file structure guidelines are documented in `src/utils/fileStructure.js` and should be followed for all new features and enhancements.

## Migration Strategy

Existing large files should be gradually refactored to follow these patterns during:
- Bug fixes
- Feature additions
- Code reviews
- Maintenance cycles