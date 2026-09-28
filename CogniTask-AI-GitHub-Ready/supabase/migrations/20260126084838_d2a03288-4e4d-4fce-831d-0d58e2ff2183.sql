-- Add start_date and end_date for task repetition
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS repeat_frequency TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false;