create table if not exists merchants (
  id serial primary key,
  email text unique not null,
  password_hash text not null,
  upi_id text,
  imap_user text,
  imap_pass_enc text,
  sender_filter text default 'fampay',
  api_key text unique not null,
  webhook_url text,
  webhook_secret text not null,
  last_check timestamptz,
  created_at timestamptz default now()
);

create table if not exists orders (
  id text primary key,
  merchant_id int not null references merchants(id) on delete cascade,
  order_ref text,
  base_amount numeric(12,2) not null,
  payable_amount numeric(12,2) not null,
  status text not null default 'pending',
  utr text unique,
  redirect_url text,
  webhook_url text,
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  paid_at timestamptz
);

-- one pending order per exact amount per merchant (this is what makes matching safe)
create unique index if not exists one_pending_amount
  on orders (merchant_id, payable_amount) where status = 'pending';
create index if not exists orders_merchant on orders (merchant_id, created_at desc);
