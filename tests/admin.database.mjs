import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
const db = new PGlite();
const root = process.cwd();
await db.exec(`
create role anon; create role authenticated;
create schema auth; create schema storage;
create table auth.users(id uuid primary key,email text);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key,bucket_id text,name text);
alter table storage.objects enable row level security;
`);
await db.exec(
  fs.readFileSync(root + "/supabase/migrations/001_admin.sql", "utf8"),
);
await db.exec(fs.readFileSync(root + "/supabase/seed.sql", "utf8"));
await db.exec(
  fs.readFileSync(root + "/supabase/migrations/002_branding.sql", "utf8"),
);
await db.exec(
  "grant usage on schema storage to authenticated; grant insert on storage.objects to authenticated;",
);
const owner = "00000000-0000-4000-8000-000000000001",
  staff = "00000000-0000-4000-8000-000000000002",
  outsider = "00000000-0000-4000-8000-000000000003";
await db.exec(`insert into auth.users values ('${owner}','owner@test.invalid'),('${staff}','staff@test.invalid'),('${outsider}','outsider@test.invalid');
insert into public.members values ('${owner}','owner@test.invalid','superadmin',true),('${staff}','staff@test.invalid','staff',true);`);
let assertions = 0;
function ok(condition, label) {
  if (!condition) throw new Error(label);
  assertions++;
  console.log("PASS " + label);
}
async function identity(id) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("set role authenticated");
}
async function rejects(sql, params, label) {
  try {
    await db.query(sql, params);
  } catch {
    ok(true, label);
    return;
  }
  throw new Error(label + " was allowed");
}
await db.exec("set role anon");
ok(
  (await db.query("select * from public.store_products")).rows.length === 30,
  "public catalog contains 30 products",
);
await rejects(
  "select * from public.orders",
  [],
  "anonymous cannot read orders",
);
await rejects(
  "select public.adjust_stock($1,1,$2)",
  ["seminovo-11-128", "Test"],
  "anonymous cannot mutate stock",
);
await identity(outsider);
ok(
  (await db.query("select * from public.products")).rows.length === 0,
  "nonmember sees no internal products",
);
await rejects(
  "select public.adjust_stock($1,1,$2)",
  ["seminovo-11-128", "Test"],
  "nonmember cannot mutate stock",
);
await identity(owner);
await db.query("select public.adjust_stock($1,5,$2)", [
  "seminovo-11-128",
  "Estoque inicial",
]);
let { rows } = await db.query(
  "select public.create_order($1,$2,$3,$4::jsonb) as id",
  [
    "Cliente teste",
    "47900000000",
    "",
    JSON.stringify([{ product_id: "seminovo-11-128", quantity: 2 }]),
  ],
);
const order = rows[0].id;
await db.query("select public.transition_order($1,'confirmed')", [order]);
await db.query("select public.transition_order($1,'confirmed')", [order]);
ok(
  (
    await db.query(
      "select stock from public.products where id='seminovo-11-128'",
    )
  ).rows[0].stock === 3,
  "confirmation deducts stock exactly once",
);
await db.query("select public.transition_order($1,'paid')", [order]);
await db.query("select public.transition_order($1,'paid')", [order]);
ok(
  (await db.query("select * from public.financial_entries")).rows.length === 1,
  "payment creates exactly one entry",
);
await db.query("select public.transition_order($1,'cancelled')", [order]);
await db.query("select public.transition_order($1,'cancelled')", [order]);
ok(
  (
    await db.query(
      "select stock from public.products where id='seminovo-11-128'",
    )
  ).rows[0].stock === 5,
  "cancellation restores stock exactly once",
);
ok(
  (
    await db.query(
      "select sum(case when kind='income' then amount else -amount end) as total from public.financial_entries",
    )
  ).rows[0].total === 0n ||
    Number(
      (
        await db.query(
          "select sum(case when kind='income' then amount else -amount end) as total from public.financial_entries",
        )
      ).rows[0].total,
    ) === 0,
  "paid cancellation records refund",
);
rows = (
  await db.query("select public.create_order($1,$2,$3,$4::jsonb) as id", [
    "Cliente teste",
    "47900000000",
    "",
    JSON.stringify([{ product_id: "seminovo-11-128", quantity: 99 }]),
  ])
).rows;
await rejects(
  "select public.transition_order($1,'confirmed')",
  [rows[0].id],
  "insufficient stock rejects confirmation",
);
ok(
  (await db.query("select status from public.orders where id=$1", [rows[0].id]))
    .rows[0].status === "pending",
  "failed confirmation preserves pending status",
);
await identity(staff);
ok(
  (await db.query("select * from public.financial_entries")).rows.length === 0,
  "staff cannot read financial ledger",
);
await rejects(
  "select public.add_financial_entry($1,100,$2,current_date)",
  ["income", "Teste"],
  "staff cannot write financial ledger",
);
await rejects(
  "select public.set_member($1,$2,true)",
  [outsider, "superadmin"],
  "staff cannot elevate privileges",
);
await identity(owner);
await rejects(
  "update public.products set stock=999",
  [],
  "direct table mutations denied even to admin",
);
await db.query("select public.set_member($1,$2,false)", [staff, "staff"]);
await identity(staff);
ok(
  (await db.query("select * from public.products")).rows.length === 0,
  "suspended user loses data access",
);

await db.exec("reset role; set role anon");
ok(
  (await db.query("select display_name from public.store_branding")).rows[0]
    .display_name === "ZenatoCell",
  "public can read only the store identity",
);
await rejects(
  "select public.save_branding($1,null)",
  ["Outra marca"],
  "anonymous cannot alter branding",
);
await identity(owner);
await db.query("select public.save_branding($1,null)", ["ZenatoCell Gestão"]);
ok(
  (await db.query("select display_name from public.store_branding")).rows[0]
    .display_name === "ZenatoCell Gestão",
  "manager can save store name",
);
await rejects(
  "select public.save_branding($1,$2)",
  ["ZenatoCell", "https://example.com/logo.webp"],
  "arbitrary external logo paths rejected",
);
await rejects(
  "select public.save_branding($1,$2)",
  ["ZenatoCell", "logos/00000000-0000-4000-8000-000000000099.webp"],
  "logo must exist in approved storage",
);
await db.query(
  "insert into storage.objects(id,bucket_id,name) values(gen_random_uuid(),$1,$2)",
  ["brand-assets", "logos/00000000-0000-4000-8000-000000000001.webp"],
);
await db.query("select public.save_branding($1,$2)", [
  "ZenatoCell",
  "logos/00000000-0000-4000-8000-000000000001.webp",
]);
ok(
  (
    await db.query("select logo_path from public.store_branding")
  ).rows[0].logo_path.endsWith("000000000001.webp"),
  "uploaded logo can be linked by manager",
);
await rejects(
  "update public.store_branding set display_name=$1",
  ["Bypass"],
  "direct branding updates denied",
);
await db.query("select public.set_member($1,$2,true)", [staff, "staff"]);
await identity(staff);
await rejects(
  "select public.save_branding($1,null)",
  ["Sem permissão"],
  "staff cannot change store identity",
);
await rejects(
  "insert into storage.objects(id,bucket_id,name) values(gen_random_uuid(),$1,$2)",
  ["brand-assets", "logos/00000000-0000-4000-8000-000000000002.webp"],
  "staff cannot upload brand assets",
);
await identity(owner);
await rejects(
  "insert into storage.objects(id,bucket_id,name) values(gen_random_uuid(),$1,$2)",
  ["brand-assets", "other/logo.webp"],
  "brand upload restricted to logo namespace",
);
await db.query("select public.save_branding($1,null)", ["ZenatoCell"]);
ok(
  (await db.query("select logo_path from public.store_branding")).rows[0]
    .logo_path === null,
  "manager can restore original logo without deleting assets",
);
console.log(assertions + " database assertions passed");
await db.close();
