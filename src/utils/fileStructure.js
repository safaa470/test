// File Structure Guidelines and Utilities
// This file documents our 500-line limit policy and provides utilities for enforcement

/**
 * FILE STRUCTURE GUIDELINES
 * 
 * 1. 500-Line Limit Rule
 *    - No file should exceed 500 lines of code
 *    - When approaching 400 lines, consider refactoring
 *    - Split files by logical boundaries and responsibilities
 * 
 * 2. Component Organization
 *    - Main page components go in feature folders (e.g., inventory/, requisitions/)
 *    - Break down into: Page, Stats, Filters, Table, Actions, Modals
 *    - Shared components stay in components/
 * 
 * 3. Server Route Organization
 *    - Split large route files by feature area
 *    - Separate approval logic, validation, and CRUD operations
 *    - Use middleware for common functionality
 * 
 * 4. Naming Conventions
 *    - Use descriptive names that indicate purpose
 *    - Group related files in folders
 *    - Maintain consistent patterns across features
 */

export const FILE_SIZE_LIMITS = {
  SOFT_LIMIT: 400, // Start considering refactoring
  HARD_LIMIT: 500, // Must refactor before exceeding
  IDEAL_SIZE: 200  // Target size for new files
};

export const COMPONENT_PATTERNS = {
  PAGE: 'Main container component that orchestrates the feature',
  STATS: 'Statistics and metrics display components',
  FILTERS: 'Search and filtering controls',
  TABLE: 'Data display and table components',
  ACTIONS: 'Action buttons and bulk operations',
  MODALS: 'Modal management and coordination'
};

export const REFACTORING_TRIGGERS = [
  'File exceeds 400 lines',
  'Multiple distinct responsibilities in one file',
  'Complex logic that can be isolated',
  'Reusable functionality that could be shared',
  'Difficult to test or maintain'
];

/**
 * Utility to check if a file should be refactored based on line count
 * @param {number} lineCount - Number of lines in the file
 * @returns {object} - Refactoring recommendation
 */
export const checkRefactoringNeeded = (lineCount) => {
  if (lineCount >= FILE_SIZE_LIMITS.HARD_LIMIT) {
    return {
      needed: true,
      priority: 'HIGH',
      message: `File has ${lineCount} lines and exceeds the hard limit of ${FILE_SIZE_LIMITS.HARD_LIMIT}. Immediate refactoring required.`
    };
  }
  
  if (lineCount >= FILE_SIZE_LIMITS.SOFT_LIMIT) {
    return {
      needed: true,
      priority: 'MEDIUM',
      message: `File has ${lineCount} lines and exceeds the soft limit of ${FILE_SIZE_LIMITS.SOFT_LIMIT}. Consider refactoring soon.`
    };
  }
  
  return {
    needed: false,
    priority: 'LOW',
    message: `File has ${lineCount} lines and is within acceptable limits.`
  };
};

/**
 * Suggested file structure for different types of features
 */
export const SUGGESTED_STRUCTURES = {
  FEATURE_PAGE: [
    'FeaturePage.jsx (main container)',
    'FeatureStats.jsx (statistics)',
    'FeatureFilters.jsx (search/filters)',
    'FeatureTable.jsx (data display)',
    'FeatureActions.jsx (actions/exports)',
    'FeatureModals.jsx (modal coordination)'
  ],
  
  SERVER_ROUTES: [
    'index.js (main routes)',
    'validation.js (input validation)',
    'approval.js (approval logic)',
    'export.js (export functionality)',
    'utils.js (helper functions)'
  ],
  
  MODALS: [
    'Keep individual modals separate',
    'Create coordination components for multiple modals',
    'Extract complex form logic to separate files'
  ]
};

export default {
  FILE_SIZE_LIMITS,
  COMPONENT_PATTERNS,
  REFACTORING_TRIGGERS,
  checkRefactoringNeeded,
  SUGGESTED_STRUCTURES
};