import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260527000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "cart_price_lock" (
        "id" text not null,
        "cart_id" text not null,
        "variant_id" text not null,
        "material" text not null,
        "weight_oz" numeric null,
        "unit_price" numeric not null,
        "quantity" numeric not null,
        "spot_price" numeric not null,
        "spread_factor" numeric not null default 1,
        "spread_fixed" numeric not null default 0,
        "premium_percentage" numeric not null default 0,
        "premium_fixed" numeric not null default 0,
        "raw_weight_oz" jsonb null,
        "raw_unit_price" jsonb not null,
        "raw_quantity" jsonb not null,
        "raw_spot_price" jsonb not null,
        "raw_spread_factor" jsonb not null default '{"value":"1","precision":20}',
        "raw_spread_fixed" jsonb not null default '{"value":"0","precision":20}',
        "raw_premium_percentage" jsonb not null default '{"value":"0","precision":20}',
        "raw_premium_fixed" jsonb not null default '{"value":"0","precision":20}',
        "locked_at" timestamptz not null,
        "expires_at" timestamptz not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "cart_price_lock_pkey" primary key ("id")
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cart_price_lock_cart_deleted" ON "cart_price_lock" ("cart_id", "deleted_at") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "cart_price_lock" cascade;`)
  }
}
