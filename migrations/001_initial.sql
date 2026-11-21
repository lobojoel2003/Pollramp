-- Pollramp initial schema.

create table users (
	id uuid primary key,
	email text not null,
	name text not null,
	role text not null check (role in ('admin', 'surveyor', 'viewer')),
	password_hash text not null,
	created_at timestamptz not null default now(),
	disabled_at timestamptz
);
create unique index users_email_key on users (lower(email));

create table sessions (
	-- SHA-256 of the session token; the token itself only lives in the cookie.
	id text primary key,
	user_id uuid not null references users (id) on delete cascade,
	created_at timestamptz not null default now(),
	expires_at timestamptz not null,
	user_agent text not null default ''
);
create index sessions_user_id_idx on sessions (user_id);
create index sessions_expires_at_idx on sessions (expires_at);

create table sites (
	id uuid primary key,
	slug text not null,
	name text not null,
	address text not null default '',
	city text not null default '',
	state text not null default '',
	postal_code text not null default '',
	lat double precision check (lat between -90 and 90),
	lng double precision check (lng between -180 and 180),
	precincts text[] not null default '{}',
	notes text not null default '',
	published boolean not null default false,
	voter_info jsonb not null default '{}',
	public_photo_id uuid,
	-- Denormalized from the latest submitted survey so the map is one query.
	status text not null default 'unsurveyed'
		check (status in ('accessible', 'fixable', 'barriers', 'incomplete', 'unsurveyed')),
	latest_survey_id uuid,
	client_updated_at timestamptz not null default now(),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	deleted_at timestamptz
);
create unique index sites_slug_key on sites (slug);
create index sites_updated_at_idx on sites (updated_at);

create table surveys (
	id uuid primary key,
	site_id uuid not null references sites (id) on delete cascade,
	checklist text not null,
	state text not null check (state in ('draft', 'submitted')),
	surveyor text not null default '',
	election text not null default '',
	responses jsonb not null default '{}',
	result jsonb,
	started_at timestamptz not null,
	submitted_at timestamptz,
	created_by uuid references users (id) on delete set null,
	client_updated_at timestamptz not null default now(),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	deleted_at timestamptz
);
create index surveys_site_id_idx on surveys (site_id);
create index surveys_updated_at_idx on surveys (updated_at);

create table photos (
	id uuid primary key,
	survey_id uuid not null references surveys (id) on delete cascade,
	item_id text not null,
	mime text not null check (mime in ('image/jpeg', 'image/png', 'image/webp')),
	width integer,
	height integer,
	size integer not null,
	data bytea not null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);
create index photos_survey_id_idx on photos (survey_id);
create index photos_updated_at_idx on photos (updated_at);

create table audit_log (
	id bigserial primary key,
	at timestamptz not null default now(),
	user_id uuid references users (id) on delete set null,
	action text not null,
	entity text not null,
	entity_id text not null,
	detail jsonb not null default '{}'
);
create index audit_log_entity_idx on audit_log (entity, entity_id);
