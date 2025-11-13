import { Model } from '@nozbe/watermelondb'
import { field, readonly, date } from '@nozbe/watermelondb/decorators'

export default class Product extends Model {
    static table = 'products'
    
    // Add associations if needed for future optimization
    static associations = {
        // Example: merchants: { type: 'belongs_to', key: 'merchant_id' }
    }

    @(field('skuid') as any) skuid!: string
    @(field('barcode_pos') as any) barcode_pos!: string
    @(field('merchant_id') as any) merchant_id!: string
    @(field('product_name') as any) product_name!: string
    @(field('status') as any) status!: string
    @(field('last_error') as any) last_error?: string
    
    // @ts-ignore
    @readonly
    @(date('created_at') as any)
    createdAt!: Date
    
    // @ts-ignore
    @readonly
    @(date('updated_at') as any)
    updatedAt!: Date
}
