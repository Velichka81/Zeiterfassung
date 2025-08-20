-- Migration: Add image_url column to users table for avatars
ALTER TABLE users ADD COLUMN image_url TEXT;
