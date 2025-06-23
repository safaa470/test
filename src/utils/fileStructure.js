/**
 * File Structure Guidelines for Warehouse Management System
 * 
 * This file documents the 400-line limit rule and provides utilities
 * for maintaining proper file organization.
 */

// Maximum lines allowed per file
export const MAX_LINES_PER_FILE = 400;

// File organization patterns
export const FILE_PATTERNS = {
  // Components should be split when they exceed the limit
  COMPONENT_SPLIT: {
    // Main component file
    main: 'ComponentName.jsx',
    // Sub-components in dedicated folder
    subComponents: 'ComponentName/SubComponent.jsx',
    // Hooks and utilities
    hooks: 'ComponentName/hooks.js',
    utils: 'ComponentName/utils.js',
    constants: 'ComponentName/constants.js'
  },
  
  // Modal components pattern
  MODAL_SPLIT: {
    main: 'ModalName.jsx',
    form: 'ModalName/Form.jsx',
    sections: 'ModalName/Section.jsx',
    validation: 'ModalName/validation.js'
  },
  
  // Page components pattern
  PAGE_SPLIT: {
    main: 'PageName.jsx',
    stats: 'PageName/Stats.jsx',
    filters: 'PageName/Filters.jsx',
    table: 'PageName/Table.jsx',
    modals: 'PageName/Modals.jsx'
  }
};

// Utility function to check if a file should be split
export const shouldSplitFile = (lineCount) => {
  return lineCount > MAX_LINES_PER_FILE;
};

// Guidelines for splitting files
export const SPLIT_GUIDELINES = {
  // When to split components
  COMPONENT_TRIGGERS: [
    'Component has multiple distinct sections',
    'Component handles multiple responsibilities',
    'Component has complex form logic',
    'Component has extensive conditional rendering'
  ],
  
  // How to split components
  SPLIT_STRATEGIES: [
    'Extract sub-components by functionality',
    'Move form logic to separate components',
    'Extract utility functions to separate files',
    'Move constants and configurations to separate files',
    'Create custom hooks for complex state logic'
  ],
  
  // Naming conventions
  NAMING_CONVENTIONS: {
    subComponents: 'Use descriptive names that indicate purpose',
    folders: 'Use PascalCase matching the main component name',
    utilities: 'Use camelCase with descriptive function names',
    constants: 'Use UPPER_SNAKE_CASE for constants'
  }
};

// File size monitoring utility
export const monitorFileSize = (filePath, content) => {
  const lines = content.split('\n').length;
  
  if (shouldSplitFile(lines)) {
    console.warn(`⚠️  File ${filePath} has ${lines} lines (exceeds ${MAX_LINES_PER_FILE} limit)`);
    console.log('Consider splitting this file using the guidelines in src/utils/fileStructure.js');
  }
  
  return {
    filePath,
    lineCount: lines,
    exceedsLimit: shouldSplitFile(lines),
    recommendedAction: shouldSplitFile(lines) ? 'SPLIT_FILE' : 'OK'
  };
};

export default {
  MAX_LINES_PER_FILE,
  FILE_PATTERNS,
  shouldSplitFile,
  SPLIT_GUIDELINES,
  monitorFileSize
};