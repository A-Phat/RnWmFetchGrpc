import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations'

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        createTable({
          name: 'products',
          columns: [
            { name: 'skuid', type: 'string' },
            { name: 'barcode_pos', type: 'string', isIndexed: true },
            { name: 'product_name', type: 'string' },
            { name: 'merchant_id', type: 'string', isIndexed: true },
            { name: 'status', type: 'string' },
            { name: 'created_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 3, // New migration for performance improvements
      steps: [
        // Add indexes to status column for faster PENDING queries
        addColumns({
          table: 'products',
          columns: [
            { name: 'updated_at', type: 'number' },
            { name: 'last_error', type: 'string', isOptional: true },
          ],
        }),
        // Add updated_at to orders
        addColumns({
          table: 'orders',
          columns: [
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
  ],
})
