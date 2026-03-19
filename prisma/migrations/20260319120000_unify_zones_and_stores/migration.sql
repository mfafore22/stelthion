-- Phase 1: Add new columns to FloorplanZone
ALTER TABLE "FloorplanZone" ADD COLUMN "drawShape" TEXT NOT NULL DEFAULT 'polygon';
ALTER TABLE "FloorplanZone" ADD COLUMN "subcategory" TEXT;

-- Phase 2: Migrate FloorplanStore rows into FloorplanZone
-- Convert rectangular stores into 4-point polygon zones
INSERT INTO "FloorplanZone" (
  "id", "mallId", "floor", "zoneId", "name", "nameFi",
  "category", "subcategory", "drawShape", "svgPoints",
  "labelX", "labelY", "capacity", "areaSqm", "baseVisitors",
  "publishedAt", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  s."mallId",
  s."floor",
  'store-' || s."slug",
  s."name",
  s."name",                                -- nameFi defaults to name (stores had no Finnish name)
  'Store',                                  -- spatial category
  NULL,                                     -- subcategory can be set later
  'rect',                                   -- drawShape
  -- Convert x,y,w,h to 4-point polygon: "x,y x+w,y x+w,y+h x,y+h"
  ROUND(s."x"::numeric, 1) || ',' || ROUND(s."y"::numeric, 1) || ' ' ||
  ROUND((s."x" + s."w")::numeric, 1) || ',' || ROUND(s."y"::numeric, 1) || ' ' ||
  ROUND((s."x" + s."w")::numeric, 1) || ',' || ROUND((s."y" + s."h")::numeric, 1) || ' ' ||
  ROUND(s."x"::numeric, 1) || ',' || ROUND((s."y" + s."h")::numeric, 1),
  ROUND((s."x" + s."w" / 2)::numeric, 1),  -- labelX = center
  ROUND((s."y" + s."h" / 2)::numeric, 1),  -- labelY = center
  0,                                        -- capacity (set manually later)
  0,                                        -- areaSqm (set manually later)
  0,                                        -- baseVisitors
  s."publishedAt",
  NOW(),
  NOW()
FROM "FloorplanStore" s;

-- Phase 3: Drop FloorplanStore table
DROP TABLE "FloorplanStore";
