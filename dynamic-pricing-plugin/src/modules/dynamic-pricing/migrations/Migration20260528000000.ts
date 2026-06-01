import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260528000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_product_variant_dynamicpricing_pricing_rule" drop column if exists "year";`)
  }

  override async down(): Promise<void> {
    // no-op: year column no longer exists in the codebase
  }
}
