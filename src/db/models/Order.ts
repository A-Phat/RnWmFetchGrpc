import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Order extends Model {
    static table = 'orders'

    @(field('payload') as any) payload!: string
    @(field('status') as any) status!: string
    @(field('last_error') as any) lastError?: string | null
    // @ts-ignore
    @readonly
    @(date('created_at') as any)
    createdAt!: Date
}
