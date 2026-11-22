-- =============================================================================
-- 00_extensions.sql
-- Enable required PostgreSQL extensions BEFORE schema creation
-- =============================================================================

-- UUID generation for primary keys (v4 random UUIDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PostGIS for geospatial queries on terminal locations and route geometry
CREATE EXTENSION IF NOT EXISTS "postgis";

-- pg_trgm for fuzzy text search on terminal/city names (low-bandwidth users
-- often make typos on small phone keyboards)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
