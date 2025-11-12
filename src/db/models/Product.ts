import { Model } from '@nozbe/watermelondb'
import { field, readonly, date } from '@nozbe/watermelondb/decorators'

export default class Product extends Model {
    static table = 'products'

    @(field('skuid') as any) skuid!: string
    @(field('barcode_pos') as any) barcodePos!: string
    @(field('merchant_id') as any) merchantId!: string
    @(field('product_name') as any) productName?: string | null
    @(field('status') as any) status!: string
    // @ts-ignore
    @readonly
    @(date('created_at') as any)
    createdAt!: Date
}
