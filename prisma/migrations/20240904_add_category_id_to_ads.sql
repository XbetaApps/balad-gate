-- Add category_id column to ads table
ALTER TABLE public.ads 
ADD COLUMN category_id UUID REFERENCES public.categories(id);

-- Create an index on the foreign key for better performance
CREATE INDEX IF NOT EXISTS idx_ads_category_id ON public.ads(category_id);

-- Update existing rows to have a default category
DO $$
DECLARE
    default_category_id UUID;
BEGIN
    -- Try to get the first available category
    SELECT id INTO default_category_id FROM public.categories ORDER BY created_at ASC LIMIT 1;
    
    -- If no categories exist, create a default one
    IF default_category_id IS NULL THEN
        INSERT INTO public.categories (name, created_at) 
        VALUES ('عام', NOW())
        RETURNING id INTO default_category_id;
    END IF;
    
    -- Update existing ads to use the default category
    UPDATE public.ads 
    SET category_id = default_category_id 
    WHERE category_id IS NULL;
END $$;

-- Make the column required after setting default values
ALTER TABLE public.ads 
ALTER COLUMN category_id SET NOT NULL;
