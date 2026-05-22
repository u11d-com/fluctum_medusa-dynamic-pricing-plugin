import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260520064201 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "pricing_rule" ("id" text not null, "name" text not null, "spread_factor" numeric not null default 1, "spread_fixed" numeric not null default 0, "premium_percentage" numeric not null default 0, "premium_fixed" numeric not null default 0, "raw_spread_factor" jsonb not null default '{"value":"1","precision":20}', "raw_spread_fixed" jsonb not null default '{"value":"0","precision":20}', "raw_premium_percentage" jsonb not null default '{"value":"0","precision":20}', "raw_premium_fixed" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pricing_rule_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pricing_rule_deleted_at" ON "pricing_rule" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "pricing_rule" cascade;`);
  }

}
