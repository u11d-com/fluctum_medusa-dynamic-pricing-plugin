import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260519160005 extends Migration {

  override async up(): Promise<void> {
    // Composite index on (material, created_at DESC) makes the DISTINCT ON
    // query in getLatestSpotPrices an index-only scan regardless of table size.
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_spot_price_material_created_at"
      ON "spot_price" ("material", "created_at" DESC)
      WHERE "deleted_at" IS NULL;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_spot_price_material_created_at";`);
  }

}
