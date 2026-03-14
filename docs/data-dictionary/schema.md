# UvidAI Database Schema

Database: PostgreSQL 16 with PostGIS, pgvector, and pg_trgm extensions.

---

## Conversations & Chat

### `conversations`

Stores chat conversation sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique conversation identifier |
| user_id | varchar(255) | NOT NULL, indexed | User identifier (anonymous or authenticated) |
| title | varchar(500) | | Auto-generated conversation title |
| location_context | jsonb | | Cached geocoded location for the conversation |
| metadata | jsonb | default '{}' | Additional metadata (source, device, etc.) |
| created_at | timestamptz | NOT NULL, default now() | Creation timestamp |
| updated_at | timestamptz | NOT NULL, default now() | Last activity timestamp |

### `messages`

Individual messages within a conversation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique message identifier |
| conversation_id | uuid | FK → conversations.id, NOT NULL | Parent conversation |
| role | varchar(20) | NOT NULL | Message role: 'user', 'assistant', 'system', 'tool' |
| content | text | NOT NULL | Message content (plain text or markdown) |
| tool_calls | jsonb | | Array of tool calls made by the assistant |
| tool_results | jsonb | | Results returned from tool execution |
| model | varchar(100) | | LLM model used for this response |
| tokens_input | integer | | Input token count |
| tokens_output | integer | | Output token count |
| latency_ms | integer | | Response generation time in milliseconds |
| cost_usd | decimal(10,6) | | Estimated cost in USD |
| created_at | timestamptz | NOT NULL, default now() | Message timestamp |

---

## Feedback & Evaluation

### `feedback`

User-submitted feedback on assistant responses.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique feedback identifier |
| message_id | uuid | FK → messages.id, NOT NULL, unique | The message being rated |
| rating | varchar(10) | NOT NULL | 'positive' or 'negative' |
| comment | text | | Optional text feedback from user |
| created_at | timestamptz | NOT NULL, default now() | Feedback submission time |

### `admin_ratings`

Admin/expert ratings for quality evaluation and fine-tuning dataset curation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique rating identifier |
| message_id | uuid | FK → messages.id, NOT NULL | The message being rated |
| admin_user | varchar(255) | NOT NULL | Admin who provided the rating |
| quality_score | integer | NOT NULL, CHECK (1-5) | Overall quality score 1–5 |
| factual_accuracy | integer | CHECK (1-5) | Factual accuracy score 1–5 |
| completeness | integer | CHECK (1-5) | Completeness of the answer 1–5 |
| notes | text | | Reviewer notes |
| created_at | timestamptz | NOT NULL, default now() | Rating timestamp |

### `fine_tune_datasets`

Groups of curated conversation examples for model fine-tuning.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Dataset identifier |
| name | varchar(255) | NOT NULL, unique | Dataset name (e.g., 'legal-v1', 'eco-v2') |
| description | text | | Purpose and scope of the dataset |
| status | varchar(20) | NOT NULL, default 'draft' | 'draft', 'ready', 'exported', 'archived' |
| created_at | timestamptz | NOT NULL, default now() | Creation timestamp |
| updated_at | timestamptz | NOT NULL, default now() | Last update timestamp |

### `fine_tune_dataset_items`

Individual examples within a fine-tuning dataset.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Item identifier |
| dataset_id | uuid | FK → fine_tune_datasets.id, NOT NULL | Parent dataset |
| conversation_id | uuid | FK → conversations.id, NOT NULL | Source conversation |
| input_messages | jsonb | NOT NULL | Array of input messages (system + user) |
| expected_output | text | NOT NULL | Curated/corrected assistant response |
| tags | text[] | default '{}' | Categorization tags (e.g., 'legal', 'eco') |
| created_at | timestamptz | NOT NULL, default now() | Creation timestamp |

---

## Geospatial Data

### `locations`

Geocoded and enriched location records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Location identifier |
| address | varchar(500) | NOT NULL | Original text address |
| city | varchar(100) | NOT NULL | City name ('Belgrade' or 'Novi Sad') |
| municipality | varchar(100) | | Municipality/opština name |
| coordinates | geometry(Point, 4326) | NOT NULL, indexed (GiST) | PostGIS point geometry (WGS84) |
| cadastral_municipality | varchar(200) | | Cadastral municipality (katastarska opština) |
| parcel_number | varchar(50) | | Cadastral parcel number |
| metadata | jsonb | default '{}' | Additional geocoding metadata |
| created_at | timestamptz | NOT NULL, default now() | Record creation time |
| updated_at | timestamptz | NOT NULL, default now() | Last update time |

### `pois`

Points of interest from OpenStreetMap and official registries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | POI identifier |
| osm_id | bigint | unique, indexed | OpenStreetMap node/way ID |
| name | varchar(500) | NOT NULL | POI name |
| name_sr | varchar(500) | | Name in Serbian |
| category | varchar(50) | NOT NULL, indexed | Category: 'education', 'health', 'shopping', 'transit', 'leisure' |
| subcategory | varchar(100) | | Subcategory: 'kindergarten', 'primary_school', 'pharmacy', etc. |
| coordinates | geometry(Point, 4326) | NOT NULL, indexed (GiST) | PostGIS point geometry |
| address | varchar(500) | | Street address |
| city | varchar(100) | NOT NULL, indexed | City name |
| is_public | boolean | default true | Public vs private institution |
| operating_hours | varchar(500) | | Operating hours (OSM format) |
| contact_phone | varchar(50) | | Contact phone number |
| contact_website | varchar(500) | | Website URL |
| metadata | jsonb | default '{}' | Additional attributes from OSM tags |
| embedding | vector(384) | indexed (ivfflat) | Semantic embedding for search |
| source | varchar(50) | NOT NULL, default 'osm' | Data source: 'osm', 'data_gov', 'manual' |
| last_synced_at | timestamptz | | Last data synchronization timestamp |
| created_at | timestamptz | NOT NULL, default now() | Record creation time |
| updated_at | timestamptz | NOT NULL, default now() | Last update time |

### `air_quality_readings`

Air quality measurements from monitoring stations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Reading identifier |
| station_id | varchar(100) | NOT NULL, indexed | Monitoring station identifier |
| station_name | varchar(255) | NOT NULL | Human-readable station name |
| coordinates | geometry(Point, 4326) | NOT NULL, indexed (GiST) | Station location |
| aqi | integer | | Calculated AQI index |
| pm25 | decimal(8,2) | | PM2.5 concentration (μg/m³) |
| pm10 | decimal(8,2) | | PM10 concentration (μg/m³) |
| no2 | decimal(8,2) | | NO₂ concentration (μg/m³) |
| o3 | decimal(8,2) | | O₃ concentration (μg/m³) |
| so2 | decimal(8,2) | | SO₂ concentration (μg/m³) |
| co | decimal(8,2) | | CO concentration (mg/m³) |
| temperature | decimal(5,2) | | Temperature (°C) at time of reading |
| humidity | decimal(5,2) | | Relative humidity (%) |
| measured_at | timestamptz | NOT NULL, indexed | When the measurement was taken |
| source | varchar(50) | NOT NULL | Source: 'sepa', 'xeco', 'citizen' |
| created_at | timestamptz | NOT NULL, default now() | Record ingestion time |

**Indexes:** Composite index on `(station_id, measured_at DESC)` for time-series queries.

### `companies`

Cached APR business registry data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Record identifier |
| registration_number | varchar(20) | NOT NULL, unique, indexed | Matični broj |
| tax_id | varchar(20) | unique, indexed | PIB (Poreski identifikacioni broj) |
| name | varchar(500) | NOT NULL | Full legal name |
| legal_form | varchar(100) | | Legal form (DOO, AD, PR, etc.) |
| status | varchar(50) | NOT NULL | Active, inactive, in liquidation, etc. |
| founding_date | date | | Date of incorporation |
| activity_code | varchar(10) | | Primary activity code (šifra delatnosti) |
| activity_description | varchar(500) | | Primary activity description |
| address | varchar(500) | | Registered address (sedište) |
| coordinates | geometry(Point, 4326) | indexed (GiST) | Geocoded HQ location |
| authorized_persons | jsonb | default '[]' | Array of authorized representatives |
| block_history | jsonb | default '[]' | Account block history |
| metadata | jsonb | default '{}' | Additional APR data |
| last_synced_at | timestamptz | NOT NULL | Last sync with APR |
| created_at | timestamptz | NOT NULL, default now() | Record creation time |
| updated_at | timestamptz | NOT NULL, default now() | Last update time |
