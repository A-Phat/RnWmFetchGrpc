import { Model } from '@nozbe/watermelondb'
import { field, readonly, date } from '@nozbe/watermelondb/decorators'

export default class Product extends Model {
    static table = 'products'

    @(field('skuid') as any) skuid!: string
    @(field('barcode_pos') as any) barcode_pos!: string
    @(field('merchant_id') as any) merchant_id!: string
    @(field('product_name') as any) product_name!: string
    @(field('status') as any) status!: string
    // @ts-ignore
    @readonly
    @(date('created_at') as any)
    createdAt!: Date
}
