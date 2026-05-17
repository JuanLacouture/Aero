import { createClient } from '@/lib/supabase/server'
import StudentHomeContent from '@/components/student/StudentHomeContent'

export default async function StudentHomePage() {
  const supabase = await createClient()

  const { data: vendorsData } = await supabase
    .from('vendors')
    .select('id, business_name, description, cover_image_url, rating_avg, rating_count, is_open, schedule_start, schedule_end')
    .order('is_open', { ascending: false })
    .order('rating_avg', { ascending: false })

  return <StudentHomeContent vendors={vendorsData ?? []} />
}
