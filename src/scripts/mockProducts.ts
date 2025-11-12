import { database } from '../db'
import Product from '../db/models/Product'

export async function insertMockProducts() {
  const products = database.get<Product>('products')

  await database.write(async () => {
    await products.create(p => {
      p.skuid = 'SKU-001'
      p.barcodePos = '8850000000011'
      p.productName = 'Coke Zero 325ml'
      p.merchantId = 'M001'
      p.status = 'PENDING'
    })

    await products.create(p => {
      p.skuid = 'SKU-002'
      p.barcodePos = '8850000000022'
      p.productName = 'Pepsi Max 325ml'
      p.merchantId = 'M001'
      p.status = 'PENDING'
    })

    await products.create(p => {
      p.skuid = 'SKU-003'
      p.barcodePos = '8850000000033'
      p.productName = 'Sprite 325ml'
      p.merchantId = 'M002'
      p.status = 'PENDING'
    })
  })

  console.log('✅ Mock products inserted (3 rows)')
}
