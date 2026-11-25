-- Wharfinger durable state (Neon Postgres). Evidence tables are append-only: updates and deletes are refused by trigger.
-- Not yet applied to a database: DATABASE_URL has not been provided. Applied by scripts/db-migrate.ts once it is.
create table if not exists voyages (
  id text primary key, vessel text not null, mmsi text, imo bigint, port_locode text not null, port_query text,
  voyage_index integer not null unique, voyage_address text not null, funder_address text, cap_uusdc bigint not null,
  terms jsonb not null, terms_hash text not null, status text not null default 'WATCHING', created_at timestamptz not null default now()
);
alter table voyages add column if not exists sof jsonb not null default '[]';
alter table voyages add column if not exists resolutions jsonb not null default '{}';
alter table voyages add column if not exists label text;
alter table voyages add column if not exists house boolean not null default false;
create table if not exists leases (voyage_id text not null references voyages(id), slot bigint not null, taken_at timestamptz not null default now(), primary key (voyage_id, slot));
create table if not exists purchases (
  id bigserial primary key, voyage_id text not null references voyages(id), slot bigint not null, kind text not null, attempt integer not null, pinned boolean not null,
  miner_id text, status integer not null, refusal text, receipt_hash text, epoch_id integer, signal_hash text, cost_uusdc bigint not null default 0,
  ms integer, asked_at timestamptz not null, verdict_ok boolean, refusals text[] not null default '{}', result jsonb, created_at timestamptz not null default now()
);
alter table purchases add column if not exists requested text;
alter table purchases add column if not exists signal_created_at timestamptz;
alter table purchases add column if not exists auth_valid_after bigint;
alter table purchases add column if not exists auth_valid_before bigint;
create table if not exists signals (hash text primary key, body jsonb not null, fetched_at timestamptz not null default now());
create index if not exists purchases_voyage on purchases (voyage_id, asked_at);
create table if not exists counters (name text primary key, value bigint not null default 0, updated_at timestamptz not null default now());
create table if not exists notes (id bigserial primary key, voyage_id text not null references voyages(id), author text not null, body text not null, receipts text[] not null default '{}', created_at timestamptz not null default now());
create table if not exists signatures (id bigserial primary key, voyage_id text not null references voyages(id), role text not null check (role in ('ANALYST','OWNER')), statement_hash text not null, address text not null, signature text not null, decision text, created_at timestamptz not null default now());
alter table signatures add column if not exists statement jsonb;
alter table signatures add column if not exists disputed_lines text[] not null default '{}';
alter table signatures add column if not exists reason text;
create or replace function refuse_change() returns trigger as $$ begin raise exception 'evidence tables are append-only'; end $$ language plpgsql;
drop trigger if exists purchases_append_only on purchases;
create trigger purchases_append_only before update or delete on purchases for each row execute function refuse_change();
drop trigger if exists signatures_append_only on signatures;
create trigger signatures_append_only before update or delete on signatures for each row execute function refuse_change();
