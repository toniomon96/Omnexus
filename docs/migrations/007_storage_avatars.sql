-- Migration 007: Avatar Storage Policies
-- Run AFTER creating the 'avatars' public bucket in Supabase dashboard:
--   Storage → New bucket → name: avatars → toggle Public ON
--
-- Then run this SQL in the Supabase SQL editor.

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');
