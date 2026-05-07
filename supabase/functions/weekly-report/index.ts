import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // TODO: implement weekly report generation
  // 1. Query orders from last week grouped by vendor
  // 2. Generate PDF/CSV and upload to reports bucket
  // 3. Insert/update weekly_reports table

  return new Response(JSON.stringify({ message: 'Weekly report job scheduled' }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
