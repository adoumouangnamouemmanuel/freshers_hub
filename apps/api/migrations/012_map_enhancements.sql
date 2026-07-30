-- Add floor_level and images array to locations

ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS floor_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Update existing records with dummy images and floor levels
UPDATE locations SET 
  images = '["https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80"]'::jsonb,
  floor_level = 0
WHERE category = 'academic';

UPDATE locations SET 
  images = '["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"]'::jsonb,
  floor_level = 0
WHERE category = 'dining';

UPDATE locations SET 
  images = '["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80"]'::jsonb,
  floor_level = 0
WHERE category = 'hostel';

UPDATE locations SET 
  images = '["https://images.unsplash.com/photo-1588693892749-09040bb4ab69?w=800&q=80"]'::jsonb,
  floor_level = 0
WHERE category = 'recreation' OR category = 'services';
