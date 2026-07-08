import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260707000001 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "cart_price_lock" ADD COLUMN IF NOT EXISTS "currency_code" text NOT NULL DEFAULT 'USD';`)
    this.addSql(`ALTER TABLE "cart_price_lock" ADD COLUMN IF NOT EXISTS "conversion_rate" numeric NOT NULL DEFAULT 1;`)
    this.addSql(`ALTER TABLE "cart_price_lock" ADD COLUMN IF NOT EXISTS "raw_conversion_rate" jsonb NOT NULL DEFAULT '{"value":"1","precision":20}';`)
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "cart_price_lock" DROP COLUMN IF EXISTS "raw_conversion_rate";`)
    this.addSql(`ALTER TABLE "cart_price_lock" DROP COLUMN IF EXISTS "conversion_rate";`)
    this.addSql(`ALTER TABLE "cart_price_lock" DROP COLUMN IF EXISTS "currency_code";`)
  }
}
