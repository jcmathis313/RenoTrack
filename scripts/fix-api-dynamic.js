const fs = require('fs');
const path = require('path');

// List of API route files that use getCurrentUser
const files = [
  'app/api/settings/quality-status/route.ts',
  'app/api/settings/quality-status/[id]/route.ts',
  'app/api/settings/component/route.ts',
  'app/api/settings/component/[id]/route.ts',
  'app/api/settings/room-template/route.ts',
  'app/api/settings/room-template/[id]/route.ts',
  'app/api/settings/component-category/route.ts',
  'app/api/settings/component-category/[id]/route.ts',
  'app/api/settings/component-status/route.ts',
  'app/api/settings/component-status/[id]/route.ts',
  'app/api/buildings/route.ts',
  'app/api/buildings/[id]/route.ts',
  'app/api/assessments/route.ts',
  'app/api/assessments/[id]/route.ts',
  'app/api/selections/route.ts',
  'app/api/selections/[id]/route.ts',
  'app/api/design-components/route.ts',
  'app/api/design-components/[id]/route.ts',
  'app/api/communities/route.ts',
  'app/api/communities/[id]/logo/route.ts',
  'app/api/communities/[id]/route.ts',
  'app/api/catalog/route.ts',
  'app/api/catalog/[id]/route.ts',
  'app/api/design-rooms/route.ts',
  'app/api/component-assessments/route.ts',
  'app/api/component-assessments/[id]/route.ts',
  'app/api/inspections/route.ts',
  'app/api/inspections/[id]/components/[componentId]/image/route.ts',
  'app/api/inspections/[id]/components/[componentId]/route.ts',
  'app/api/inspections/[id]/route.ts',
  'app/api/units/route.ts',
  'app/api/units/[id]/route.ts',
  'app/api/rooms/route.ts',
  'app/api/rooms/[id]/route.ts',
];

const dynamicExport = `// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
`;

files.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${filePath} - file not found`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Check if already has dynamic export
  if (content.includes('export const dynamic')) {
    console.log(`Skipping ${filePath} - already has dynamic export`);
    return;
  }
  
  // Find the last import statement
  const importLines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < importLines.length; i++) {
    if (importLines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex === -1) {
    console.log(`Warning: ${filePath} - no imports found, skipping`);
    return;
  }
  
  // Insert dynamic export after the last import
  importLines.splice(lastImportIndex + 1, 0, '', dynamicExport);
  const newContent = importLines.join('\n');
  
  fs.writeFileSync(fullPath, newContent, 'utf8');
  console.log(`Fixed ${filePath}`);
});

console.log('Done!');

