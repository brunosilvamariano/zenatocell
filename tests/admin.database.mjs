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
await db.exec(
  fs.readFileSync(
    root + "/supabase/migrations/003_product_validation.sql",
    "utf8",
  ),
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
// Cenários de homologação: somente o PostgreSQL efêmero acima recebe estes dados.
await identity(owner);
const qaProduct = {
  id: "qa-device",
  name: "Produto de homologação",
  category: "Lacrado",
  description: "QA",
  photos: ["https://example.invalid/device.webp"],
  price: 10000,
  cost: 6000,
  installment: 1000,
  months: 12,
  warranty: "Garantia de teste",
  active: true,
};
const saveQA = async (patch = {}) =>
  db.query("select public.save_product($1::jsonb)", [
    JSON.stringify({ ...qaProduct, ...patch }),
  ]);
await saveQA();
ok(
  (await db.query("select stock from public.products where id='qa-device'"))
    .rows[0].stock === 0,
  "new products start with zero stock",
);
await db.query(
  "select public.adjust_stock('qa-device',10,'Entrada de homologação')",
);
await saveQA({ name: "Produto atualizado" });
ok(
  (await db.query("select stock from public.products where id='qa-device'"))
    .rows[0].stock === 10,
  "editing a product preserves stock",
);
await saveQA({ active: false });
await db.exec("reset role; set role anon");
ok(
  (await db.query("select * from public.store_products where id='qa-device'"))
    .rows.length === 0,
  "unpublished products are hidden from storefront",
);
await identity(owner);
await saveQA();
await rejects(
  "select public.save_product($1::jsonb)",
  [JSON.stringify({ ...qaProduct, photos: [] })],
  "empty product photo list rejected",
);
const { photos: ignoredPhotos, ...withoutPhotos } = qaProduct;
await rejects(
  "select public.save_product($1::jsonb)",
  [JSON.stringify(withoutPhotos)],
  "missing product photos rejected",
);
await rejects(
  "select public.save_product($1::jsonb)",
  [JSON.stringify({ ...qaProduct, price: -1 })],
  "negative product price rejected",
);
await rejects(
  "select public.save_product($1::jsonb)",
  [JSON.stringify({ ...qaProduct, cost: -1 })],
  "negative product cost rejected",
);
await rejects(
  "select public.adjust_stock('qa-device',0,'Entrada QA')",
  [],
  "zero stock movement rejected",
);
await rejects(
  "select public.adjust_stock('qa-device',-11,'Saída QA')",
  [],
  "stock cannot become negative",
);
ok(
  (await db.query("select stock from public.products where id='qa-device'"))
    .rows[0].stock === 10,
  "failed movement preserves stock",
);
await rejects(
  "select public.adjust_stock('qa-device',1,'  ')",
  [],
  "blank movement reason rejected",
);
const qaItems = [{ product_id: "qa-device", quantity: 2 }];
const createQA = async (items = qaItems) =>
  (
    await db.query("select public.create_order($1,$2,$3,$4::jsonb) as id", [
      "Cliente QA",
      "00000000000",
      "Homologação",
      JSON.stringify(items),
    ])
  ).rows[0].id;
await rejects(
  "select public.create_order($1,$2,$3,$4::jsonb)",
  ["Cliente QA", "00000000000", "", "[]"],
  "empty order rejected",
);
await rejects(
  "select public.create_order($1,$2,$3,$4::jsonb)",
  [
    "Cliente QA",
    "00000000000",
    "",
    JSON.stringify([{ product_id: "qa-device", quantity: 0 }]),
  ],
  "zero order quantity rejected",
);
await rejects(
  "select public.create_order($1,$2,$3,$4::jsonb)",
  [
    "Cliente QA",
    "00000000000",
    "",
    JSON.stringify([{ product_id: "missing", quantity: 1 }]),
  ],
  "unknown order product rejected",
);
const qaPending = await createQA();
ok(
  (await db.query("select total from public.orders where id=$1", [qaPending]))
    .rows[0].total === 20000,
  "server calculates order total from catalog",
);
ok(
  (await db.query("select stock from public.products where id='qa-device'"))
    .rows[0].stock === 10,
  "pending order does not deduct stock",
);
await saveQA({ price: 15000, cost: 9000 });
ok(
  (
    await db.query(
      "select unit_price,unit_cost from public.order_items where order_id=$1",
      [qaPending],
    )
  ).rows.every((row) => row.unit_price === 10000 && row.unit_cost === 6000),
  "order retains original price and cost after catalog edit",
);
await rejects(
  "select public.transition_order($1,'paid')",
  [qaPending],
  "pending order cannot skip confirmation",
);
await db.query("select public.transition_order($1,'cancelled')", [qaPending]);
ok(
  (await db.query("select stock from public.products where id='qa-device'"))
    .rows[0].stock === 10,
  "cancelling pending order preserves stock",
);
await rejects(
  "select public.transition_order($1,'confirmed')",
  [qaPending],
  "cancelled order cannot be reopened",
);
const qaStaffOrder = await createQA();
await identity(staff);
await rejects(
  "select public.save_product($1::jsonb)",
  [JSON.stringify(qaProduct)],
  "staff cannot edit product registration",
);
await db.query("select public.transition_order($1,'confirmed')", [
  qaStaffOrder,
]);
ok(
  (
    await db.query("select status from public.orders where id=$1", [
      qaStaffOrder,
    ])
  ).rows[0].status === "confirmed",
  "staff can confirm operational orders",
);
await rejects(
  "select public.transition_order($1,'paid')",
  [qaStaffOrder],
  "staff cannot register order payment",
);
await identity(owner);
await db.query("select public.transition_order($1,'paid')", [qaStaffOrder]);
await identity(staff);
await rejects(
  "select public.transition_order($1,'cancelled')",
  [qaStaffOrder],
  "staff cannot refund paid order",
);
await identity(owner);
await db.query("select public.transition_order($1,'cancelled')", [
  qaStaffOrder,
]);
ok(
  (await db.query("select stock from public.products where id='qa-device'"))
    .rows[0].stock === 10,
  "manager refund restores purchased units",
);
await db.query("select public.adjust_stock('qa-device',-9,'Preparação QA')");
const qaDuplicate = await createQA([
  { product_id: "qa-device", quantity: 1 },
  { product_id: "qa-device", quantity: 1 },
]);
await rejects(
  "select public.transition_order($1,'confirmed')",
  [qaDuplicate],
  "duplicate product lines cannot bypass stock validation",
);
ok(
  (await db.query("select stock from public.products where id='qa-device'"))
    .rows[0].stock === 1,
  "duplicate-line failure rolls back stock",
);
const multiOrder = await createQA([
  { product_id: "qa-device", quantity: 1 },
  { product_id: "seminovo-11-128", quantity: 99 },
]);
await rejects(
  "select public.transition_order($1,'confirmed')",
  [multiOrder],
  "insufficient second item rolls back entire order confirmation",
);
ok(
  (await db.query("select stock from public.products where id='qa-device'"))
    .rows[0].stock === 1,
  "multi-item rollback restores first product too",
);
ok(
  (
    await db.query("select * from public.stock_movements where order_id=$1", [
      multiOrder,
    ])
  ).rows.length === 0,
  "failed confirmation leaves no partial stock movements",
);
await db.query(
  "select public.add_financial_entry('income',12345,'Entrada QA','2026-11-01')",
);
await db.query(
  "select public.add_financial_entry('expense',2345,'Saída QA','2026-11-01')",
);
ok(
  Number(
    (
      await db.query(
        "select sum(case when kind='income' then amount else -amount end) as balance from public.financial_entries where description in ('Entrada QA','Saída QA')",
      )
    ).rows[0].balance,
  ) === 10000,
  "manual financial balance uses exact cents",
);
await rejects(
  "select public.add_financial_entry('income',0,'Entrada QA',current_date)",
  [],
  "zero financial amount rejected",
);
await rejects(
  "select public.add_financial_entry('expense',-1,'Saída QA',current_date)",
  [],
  "negative financial amount rejected",
);
await rejects(
  "select public.set_member($1,'staff',false)",
  [owner],
  "superadmin cannot suspend own account",
);
await db.query("select public.set_member($1,'owner',true)", [outsider]);
await identity(outsider);
await saveQA();
ok(
  (await db.query("select price from public.products where id='qa-device'"))
    .rows[0].price === 10000,
  "owner role can maintain products",
);
await rejects(
  "select public.set_member($1,'superadmin',true)",
  [staff],
  "owner cannot grant administrative access",
);
await db.query(
  "select public.add_financial_entry('income',100,'Receita do proprietário QA',current_date)",
);
ok(
  (
    await db.query(
      "select * from public.financial_entries where description='Receita do proprietário QA'",
    )
  ).rows.length === 1,
  "owner can access own operation financial ledger",
);
await identity(owner);
await rejects(
  "select public.save_product($1::jsonb)",
  [JSON.stringify({ ...qaProduct, photos: [""] })],
  "blank photo reference rejected",
);
await rejects(
  "select public.save_product($1::jsonb)",
  [JSON.stringify({ ...qaProduct, photos: [null] })],
  "null photo reference rejected",
);
await rejects(
  "select public.create_order($1,$2,$3,null)",
  ["Cliente QA", "00000000000", ""],
  "missing order items rejected",
);
console.log(assertions + " database assertions passed");
await db.close();
