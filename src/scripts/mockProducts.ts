import { database } from '../db'
import Product from '../db/models/Product'

export async function insertMockProducts() {
  const products = database.get<Product>('products')

  await database.write(async () => {
    await products.create(p => {
      p.skuid = 'SKU-001'
      p.barcode_pos = '8850000000011'
      p.product_name = 'Coke Zero 325ml'
      p.merchant_id = 'M001'
      p.status = 'PENDING'
    })

    await products.create(p => {
      p.skuid = 'SKU-002'
      p.barcode_pos = '8850000000022'
      p.product_name = 'Pepsi Max 325ml'
      p.merchant_id = 'M001'
      p.status = 'PENDING'
    })

    await products.create(p => {
      p.skuid = 'SKU-003'
      p.barcode_pos = '8850000000033'
      p.product_name = 'Sprite 325ml'
      p.merchant_id = 'M002'
      p.status = 'PENDING'
    })
  })

  console.log('✅ Mock products inserted (3 rows)')
}
