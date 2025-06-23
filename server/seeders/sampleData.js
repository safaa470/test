const sampleCategories = [
  // Main categories
  { id: 1, name: 'Office Supplies', description: 'General office and administrative supplies' },
  { id: 2, name: 'Electronics', description: 'Electronic devices and components' },
  { id: 3, name: 'Furniture', description: 'Office and warehouse furniture' },
  { id: 4, name: 'Safety Equipment', description: 'Personal protective equipment and safety gear' },
  { id: 5, name: 'Cleaning Supplies', description: 'Cleaning and maintenance supplies' },
  { id: 6, name: 'Tools & Hardware', description: 'Tools and hardware equipment' },
  
  // Subcategories
  { id: 7, name: 'Stationery', parent_id: 1, description: 'Pens, papers, notebooks' },
  { id: 8, name: 'Printing Supplies', parent_id: 1, description: 'Ink, toner, paper' },
  { id: 9, name: 'Computers', parent_id: 2, description: 'Laptops, desktops, accessories' },
  { id: 10, name: 'Mobile Devices', parent_id: 2, description: 'Phones, tablets, accessories' },
  { id: 11, name: 'Desks & Chairs', parent_id: 3, description: 'Office seating and desks' },
  { id: 12, name: 'Storage', parent_id: 3, description: 'Cabinets, shelves, organizers' },
];

const sampleUnits = [
  // Count units
  { id: 1, name: 'Pieces', abbreviation: 'pcs', unit_type: 'count' },
  { id: 2, name: 'Dozen', abbreviation: 'doz', unit_type: 'count', base_unit_id: 1, conversion_factor: 12 },
  { id: 3, name: 'Box', abbreviation: 'box', unit_type: 'packaging' },
  { id: 4, name: 'Pack', abbreviation: 'pack', unit_type: 'packaging' },
  { id: 5, name: 'Set', abbreviation: 'set', unit_type: 'count' },
  
  // Weight units
  { id: 6, name: 'Kilograms', abbreviation: 'kg', unit_type: 'weight' },
  { id: 7, name: 'Grams', abbreviation: 'g', unit_type: 'weight', base_unit_id: 6, conversion_factor: 0.001 },
  { id: 8, name: 'Pounds', abbreviation: 'lbs', unit_type: 'weight', base_unit_id: 6, conversion_factor: 0.453592 },
  
  // Volume units
  { id: 9, name: 'Liters', abbreviation: 'L', unit_type: 'volume' },
  { id: 10, name: 'Milliliters', abbreviation: 'mL', unit_type: 'volume', base_unit_id: 9, conversion_factor: 0.001 },
  { id: 11, name: 'Gallons', abbreviation: 'gal', unit_type: 'volume', base_unit_id: 9, conversion_factor: 3.78541 },
  
  // Length units
  { id: 12, name: 'Meters', abbreviation: 'm', unit_type: 'length' },
  { id: 13, name: 'Centimeters', abbreviation: 'cm', unit_type: 'length', base_unit_id: 12, conversion_factor: 0.01 },
  { id: 14, name: 'Feet', abbreviation: 'ft', unit_type: 'length', base_unit_id: 12, conversion_factor: 0.3048 },
];

const sampleLocations = [
  { id: 1, name: 'Main Warehouse', description: 'Primary storage facility', address: '123 Industrial Blvd, Warehouse District' },
  { id: 2, name: 'Office Storage', description: 'Office supply storage room', address: '456 Business Ave, Office Building A' },
  { id: 3, name: 'Electronics Lab', description: 'Secure electronics storage', address: '789 Tech Street, Lab Building' },
  { id: 4, name: 'Loading Dock A', description: 'Receiving and shipping area', address: 'Dock A, Main Warehouse' },
  { id: 5, name: 'Cold Storage', description: 'Temperature controlled storage', address: 'Cold Storage Unit, Main Warehouse' },
  { id: 6, name: 'Tool Crib', description: 'Tool and equipment storage', address: 'Tool Room, Main Warehouse' },
];

const sampleSuppliers = [
  { id: 1, name: 'Office Depot', contact_person: 'John Smith', email: 'orders@officedepot.com', phone: '555-0101', address: '100 Office Way, Supply City' },
  { id: 2, name: 'TechWorld Electronics', contact_person: 'Sarah Johnson', email: 'sales@techworld.com', phone: '555-0102', address: '200 Electronics Blvd, Tech Valley' },
  { id: 3, name: 'Furniture Plus', contact_person: 'Mike Wilson', email: 'info@furnitureplus.com', phone: '555-0103', address: '300 Furniture Ave, Design District' },
  { id: 4, name: 'Safety First Inc', contact_person: 'Lisa Brown', email: 'orders@safetyfirst.com', phone: '555-0104', address: '400 Safety Street, Protection Plaza' },
  { id: 5, name: 'CleanCorp Supplies', contact_person: 'David Lee', email: 'sales@cleancorp.com', phone: '555-0105', address: '500 Clean Way, Maintenance Mile' },
  { id: 6, name: 'Tools & More', contact_person: 'Jennifer Davis', email: 'orders@toolsandmore.com', phone: '555-0106', address: '600 Tool Street, Hardware Heights' },
];

const sampleInventoryItems = [
  // Office Supplies - Stationery
  {
    id: 1, name: 'Blue Ballpoint Pens', sku: 'PEN-BLUE-001', 
    description: 'Medium point blue ballpoint pens, pack of 12',
    category_id: 7, base_unit_id: 4, issue_unit_id: 1, location_id: 2, supplier_id: 1,
    quantity: 50, min_quantity: 10, max_quantity: 100, unit_price: 8.99
  },
  {
    id: 2, name: 'A4 Copy Paper', sku: 'PAPER-A4-001',
    description: 'White A4 copy paper, 500 sheets per ream',
    category_id: 7, base_unit_id: 3, location_id: 2, supplier_id: 1,
    quantity: 25, min_quantity: 5, max_quantity: 50, unit_price: 12.50
  },
  {
    id: 3, name: 'Spiral Notebooks', sku: 'NOTE-SPIRAL-001',
    description: 'College ruled spiral notebooks, 70 sheets',
    category_id: 7, base_unit_id: 1, location_id: 2, supplier_id: 1,
    quantity: 75, min_quantity: 15, max_quantity: 150, unit_price: 3.25
  },
  {
    id: 4, name: 'Sticky Notes', sku: 'STICKY-YELLOW-001',
    description: 'Yellow sticky notes, 3x3 inches, 100 sheets per pad',
    category_id: 7, base_unit_id: 4, issue_unit_id: 1, location_id: 2, supplier_id: 1,
    quantity: 30, min_quantity: 8, max_quantity: 60, unit_price: 2.75
  },

  // Office Supplies - Printing
  {
    id: 5, name: 'Black Ink Cartridge HP 64', sku: 'INK-HP64-BK',
    description: 'HP 64 Black ink cartridge for HP printers',
    category_id: 8, base_unit_id: 1, location_id: 2, supplier_id: 1,
    quantity: 12, min_quantity: 3, max_quantity: 25, unit_price: 24.99
  },
  {
    id: 6, name: 'Color Ink Cartridge HP 64', sku: 'INK-HP64-COL',
    description: 'HP 64 Tri-color ink cartridge for HP printers',
    category_id: 8, base_unit_id: 1, location_id: 2, supplier_id: 1,
    quantity: 8, min_quantity: 2, max_quantity: 20, unit_price: 29.99
  },

  // Electronics - Computers
  {
    id: 7, name: 'Dell Laptop OptiPlex 3000', sku: 'LAPTOP-DELL-3000',
    description: 'Dell OptiPlex 3000 laptop, 8GB RAM, 256GB SSD',
    category_id: 9, base_unit_id: 1, location_id: 3, supplier_id: 2,
    quantity: 5, min_quantity: 2, max_quantity: 15, unit_price: 899.99
  },
  {
    id: 8, name: 'Wireless Mouse', sku: 'MOUSE-WIRELESS-001',
    description: 'Wireless optical mouse with USB receiver',
    category_id: 9, base_unit_id: 1, location_id: 3, supplier_id: 2,
    quantity: 20, min_quantity: 5, max_quantity: 40, unit_price: 19.99
  },
  {
    id: 9, name: 'USB-C Cables', sku: 'CABLE-USBC-001',
    description: 'USB-C to USB-A cables, 6 feet length',
    category_id: 9, base_unit_id: 1, location_id: 3, supplier_id: 2,
    quantity: 35, min_quantity: 10, max_quantity: 70, unit_price: 12.99
  },

  // Electronics - Mobile Devices
  {
    id: 10, name: 'iPad Air 64GB', sku: 'TABLET-IPAD-AIR64',
    description: 'Apple iPad Air 64GB WiFi model',
    category_id: 10, base_unit_id: 1, location_id: 3, supplier_id: 2,
    quantity: 3, min_quantity: 1, max_quantity: 10, unit_price: 599.99
  },
  {
    id: 11, name: 'Phone Chargers', sku: 'CHARGER-PHONE-001',
    description: 'Universal phone chargers with multiple connectors',
    category_id: 10, base_unit_id: 1, location_id: 3, supplier_id: 2,
    quantity: 15, min_quantity: 5, max_quantity: 30, unit_price: 15.99
  },

  // Furniture - Desks & Chairs
  {
    id: 12, name: 'Office Chair Ergonomic', sku: 'CHAIR-ERGO-001',
    description: 'Ergonomic office chair with lumbar support',
    category_id: 11, base_unit_id: 1, location_id: 1, supplier_id: 3,
    quantity: 8, min_quantity: 2, max_quantity: 20, unit_price: 249.99
  },
  {
    id: 13, name: 'Standing Desk 48"', sku: 'DESK-STAND-48',
    description: 'Height adjustable standing desk, 48 inch width',
    category_id: 11, base_unit_id: 1, location_id: 1, supplier_id: 3,
    quantity: 4, min_quantity: 1, max_quantity: 10, unit_price: 399.99
  },

  // Furniture - Storage
  {
    id: 14, name: 'Filing Cabinet 4-Drawer', sku: 'FILE-CAB-4DR',
    description: 'Metal filing cabinet with 4 drawers and lock',
    category_id: 12, base_unit_id: 1, location_id: 1, supplier_id: 3,
    quantity: 6, min_quantity: 1, max_quantity: 15, unit_price: 189.99
  },
  {
    id: 15, name: 'Storage Bins Large', sku: 'BIN-STORAGE-LG',
    description: 'Large plastic storage bins with lids',
    category_id: 12, base_unit_id: 1, location_id: 1, supplier_id: 3,
    quantity: 25, min_quantity: 8, max_quantity: 50, unit_price: 24.99
  },

  // Safety Equipment
  {
    id: 16, name: 'Safety Helmets', sku: 'HELMET-SAFETY-001',
    description: 'ANSI approved safety helmets, adjustable',
    category_id: 4, base_unit_id: 1, location_id: 1, supplier_id: 4,
    quantity: 20, min_quantity: 5, max_quantity: 40, unit_price: 29.99
  },
  {
    id: 17, name: 'Safety Vests Hi-Vis', sku: 'VEST-HIVIS-001',
    description: 'High visibility safety vests, reflective strips',
    category_id: 4, base_unit_id: 1, location_id: 1, supplier_id: 4,
    quantity: 30, min_quantity: 10, max_quantity: 60, unit_price: 19.99
  },
  {
    id: 18, name: 'Safety Gloves', sku: 'GLOVES-SAFETY-001',
    description: 'Cut resistant safety gloves, size large',
    category_id: 4, base_unit_id: 4, issue_unit_id: 1, location_id: 1, supplier_id: 4,
    quantity: 40, min_quantity: 12, max_quantity: 80, unit_price: 8.99
  },

  // Cleaning Supplies
  {
    id: 19, name: 'All-Purpose Cleaner', sku: 'CLEAN-ALLPURP-001',
    description: 'Multi-surface all-purpose cleaner, 32 oz spray bottle',
    category_id: 5, base_unit_id: 1, location_id: 5, supplier_id: 5,
    quantity: 18, min_quantity: 6, max_quantity: 36, unit_price: 4.99
  },
  {
    id: 20, name: 'Paper Towels Industrial', sku: 'TOWEL-PAPER-IND',
    description: 'Industrial strength paper towels, 12 rolls per case',
    category_id: 5, base_unit_id: 3, issue_unit_id: 1, location_id: 5, supplier_id: 5,
    quantity: 15, min_quantity: 4, max_quantity: 30, unit_price: 34.99
  },
  {
    id: 21, name: 'Trash Bags Heavy Duty', sku: 'BAG-TRASH-HD',
    description: 'Heavy duty trash bags, 55 gallon capacity',
    category_id: 5, base_unit_id: 3, issue_unit_id: 1, location_id: 5, supplier_id: 5,
    quantity: 22, min_quantity: 6, max_quantity: 45, unit_price: 18.99
  },

  // Tools & Hardware
  {
    id: 22, name: 'Cordless Drill Set', sku: 'DRILL-CORDLESS-001',
    description: 'Cordless drill with battery and bit set',
    category_id: 6, base_unit_id: 5, location_id: 6, supplier_id: 6,
    quantity: 6, min_quantity: 2, max_quantity: 12, unit_price: 89.99
  },
  {
    id: 23, name: 'Screwdriver Set', sku: 'SCREWDRIVER-SET-001',
    description: 'Professional screwdriver set, 20 pieces',
    category_id: 6, base_unit_id: 5, location_id: 6, supplier_id: 6,
    quantity: 10, min_quantity: 3, max_quantity: 20, unit_price: 24.99
  },
  {
    id: 24, name: 'Measuring Tape 25ft', sku: 'TAPE-MEASURE-25',
    description: 'Heavy duty measuring tape, 25 feet',
    category_id: 6, base_unit_id: 1, location_id: 6, supplier_id: 6,
    quantity: 12, min_quantity: 4, max_quantity: 25, unit_price: 16.99
  },
  {
    id: 25, name: 'Work Gloves', sku: 'GLOVES-WORK-001',
    description: 'Leather work gloves, size large',
    category_id: 6, base_unit_id: 4, issue_unit_id: 1, location_id: 6, supplier_id: 6,
    quantity: 28, min_quantity: 8, max_quantity: 50, unit_price: 12.99
  },

  // Low stock items for testing
  {
    id: 26, name: 'Printer Paper Legal', sku: 'PAPER-LEGAL-001',
    description: 'Legal size printer paper, 500 sheets',
    category_id: 8, base_unit_id: 3, location_id: 2, supplier_id: 1,
    quantity: 3, min_quantity: 10, max_quantity: 30, unit_price: 15.99
  },
  {
    id: 27, name: 'Batteries AA', sku: 'BATTERY-AA-001',
    description: 'AA alkaline batteries, pack of 8',
    category_id: 2, base_unit_id: 4, issue_unit_id: 1, location_id: 3, supplier_id: 2,
    quantity: 2, min_quantity: 8, max_quantity: 25, unit_price: 9.99
  },

  // Out of stock items for testing
  {
    id: 28, name: 'Whiteboard Markers', sku: 'MARKER-WB-001',
    description: 'Dry erase whiteboard markers, assorted colors',
    category_id: 7, base_unit_id: 4, issue_unit_id: 1, location_id: 2, supplier_id: 1,
    quantity: 0, min_quantity: 5, max_quantity: 20, unit_price: 6.99
  },
  {
    id: 29, name: 'Extension Cords 25ft', sku: 'CORD-EXT-25',
    description: 'Heavy duty extension cord, 25 feet',
    category_id: 6, base_unit_id: 1, location_id: 6, supplier_id: 6,
    quantity: 0, min_quantity: 3, max_quantity: 15, unit_price: 32.99
  },
  {
    id: 30, name: 'Hand Sanitizer 8oz', sku: 'SANITIZER-8OZ',
    description: 'Hand sanitizer gel, 8 oz pump bottle',
    category_id: 5, base_unit_id: 1, location_id: 5, supplier_id: 5,
    quantity: 0, min_quantity: 12, max_quantity: 50, unit_price: 3.99
  }
];

export {
  sampleCategories,
  sampleUnits,
  sampleLocations,
  sampleSuppliers,
  sampleInventoryItems
};