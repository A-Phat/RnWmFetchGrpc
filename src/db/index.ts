import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import Order from './models/Order'
import { mySchema } from './schema'
import Product from './models/Product'
import { migrations } from './migrations'



const adapter = new SQLiteAdapter({
  schema: mySchema,
  migrations,
  jsi: true, // ใช้ JSI สำหรับ performance สูงสุด
  onSetUpError: (error) => {
    console.error('❌ Database setup error:', error)
  },
})

export const database = new Database({
  adapter,
  modelClasses: [Order, Product],
})
