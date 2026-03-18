import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const filePath = path.join(__dirname, '..', 'public', 'og-share.png');
const fileBuffer = fs.readFileSync(filePath);

const { data, error } = await supabase.storage
  .from('og-image')
  .upload('share.png', fileBuffer, {
    contentType: 'image/png',
    upsert: true,
  });

if (error) {
  console.error('Upload failed:', error.message);
  process.exit(1);
}

const { data: urlData } = supabase.storage
  .from('og-image')
  .getPublicUrl('share.png');

console.log('Upload success!');
console.log('Public URL:', urlData.publicUrl);
