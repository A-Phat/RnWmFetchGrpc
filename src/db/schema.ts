import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'orders',
      columns: [
        { name: 'payload', type: 'string' },
        { name: 'status', type: 'string' },       // 'PENDING' | 'SENT' | 'FAILED'
        { name: 'created_at', type: 'number' },
        { name: 'last_error', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'products',
      columns: [
        { name: 'skuid', type: 'string' },
        { name: 'barcode_pos', type: 'string', isIndexed: true },
        { name: 'product_name', type: 'string' },
        { name: 'merchant_id', type: 'string', isIndexed: true },
        { name: 'status', type: 'string' },
      ],
    }),
  ],
})
