import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const invPath = path.join(root, 'contracts/route-inventory.json');
const specPath = path.join(root, 'contracts/openapi/storage-rental.openapi.json');

const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

if (!inv.some(r => r.method === 'get' && r.path === '/api/reports/export')) {
  inv.push({
    method: 'get',
    path: '/api/reports/export',
    source: 'backend/src/main/java/com/swp391/selfstorage/modules/reporting/controller/ReportController.java'
  });
}

if (!inv.some(r => r.method === 'post' && r.path === '/api/tickets/upload')) {
  inv.push({
    method: 'post',
    path: '/api/tickets/upload',
    source: 'backend/src/main/java/com/swp391/selfstorage/modules/support/controller/SupportTicketController.java'
  });
}

spec.paths['/api/reports/export'] = {
  get: {
    operationId: 'Report_exportCsv_export',
    tags: ['reporting'],
    summary: 'Report: exportCsv',
    description: 'Export analytics report to CSV format with UTF-8 BOM',
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'facilityCode', in: 'query', required: false, schema: { type: 'string' } },
      { name: 'startDate', in: 'query', required: false, schema: { type: 'string', format: 'date' } },
      { name: 'endDate', in: 'query', required: false, schema: { type: 'string', format: 'date' } }
    ],
    responses: {
      '200': {
        description: 'CSV File content',
        content: { 'text/csv': { schema: { type: 'string', format: 'binary' } } }
      }
    },
    'x-roles': ['OPS_MGR', 'FMANAGER']
  }
};

spec.paths['/api/tickets/upload'] = {
  post: {
    operationId: 'SupportTicket_upload_upload',
    tags: ['support'],
    summary: 'SupportTicket: upload',
    description: 'Upload incident evidence image',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': {
        description: 'Successful upload',
        content: { 'application/json': { schema: { '$ref': '#/components/schemas/Envelope' } } }
      }
    },
    'x-roles': ['CUSTOMER', 'STAFF', 'FMANAGER']
  }
};

fs.writeFileSync(invPath, JSON.stringify(inv, null, 2) + '\n');
fs.writeFileSync(specPath, JSON.stringify(spec, null, 2) + '\n');
console.log('Successfully updated OpenAPI spec and route inventory');
