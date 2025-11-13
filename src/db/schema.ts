import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
  version: 3, // Increment version for schema changes
  tables: [
    tableSchema({
      name: 'orders',
      columns: [
        { name: 'payload', type: 'string' },
        { name: 'status', type: 'string', isIndexed: true },       // Index for faster queries
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'last_error', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'products',
      columns: [
        { name: 'skuid', type: 'string', isIndexed: true },       // Index primary identifier
        { name: 'barcode_pos', type: 'string', isIndexed: true },
        { name: 'product_name', type: 'string' },
        { name: 'merchant_id', type: 'string', isIndexed: true },
        { name: 'status', type: 'string', isIndexed: true },      // Index for PENDING queries
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'last_error', type: 'string', isOptional: true },
      ],
    }),
  ],
})
