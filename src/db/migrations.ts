import { schemaMigrations, createTable } from '@nozbe/watermelondb/Schema/migrations'

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2, // ✅ ต้องตรงกับ version ใน schema.ts
      steps: [
        createTable({
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
    },
  ],
})
