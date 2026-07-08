import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260707000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "currency_rate" (
        "id" text not null,
        "from_currency" text not null,
        "to_currency" text not null,
        "rate" numeric not null,
        "raw_rate" jsonb not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "currency_rate_pkey" primary key ("id")
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_currency_rate_pair_created_at" ON "currency_rate" ("from_currency", "to_currency", "created_at" DESC) WHERE "deleted_at" IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "currency_rate" cascade;`)
  }
}
