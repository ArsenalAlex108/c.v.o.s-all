import { Migration } from '@mikro-orm/migrations';

export class Migration20250212061606 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "review" ("id" text not null, "content" text not null, "customer_id" text not null, "variant_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "review_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_deleted_at" ON "review" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "review" cascade;`);
  }

}
