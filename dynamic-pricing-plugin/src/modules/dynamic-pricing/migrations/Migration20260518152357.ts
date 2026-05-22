import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260518152357 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "spot_price" ("id" text not null, "material" text not null, "ask" numeric not null, "bid" numeric not null, "price" numeric not null, "raw_ask" jsonb not null, "raw_bid" jsonb not null, "raw_price" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "spot_price_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_spot_price_deleted_at" ON "spot_price" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_spot_price_material_created_at" ON "spot_price" ("material", "created_at" DESC) WHERE "deleted_at" IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "spot_price" cascade;`);
  }

}
