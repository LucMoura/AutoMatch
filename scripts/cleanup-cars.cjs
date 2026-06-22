const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  let totalDeleted = 0;
  const BATCH = 1000;

  while (true) {
    // Fetch IDs in batches
    const { data, error } = await supabase
      .from("cars")
      .select("id")
      .like("main_image", "%placehold%")
      .limit(BATCH);

    if (error) {
      console.error("Error fetching batch:", error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      break;
    }

    const ids = data.map((r) => r.id);
    const { error: delErr } = await supabase
      .from("cars")
      .delete()
      .in("id", ids);

    if (delErr) {
      console.error("Error deleting batch:", delErr.message);
      process.exit(1);
    }

    totalDeleted += ids.length;
    console.log(`Deleted ${ids.length} (total: ${totalDeleted})`);
  }

  console.log(`\n✅ Done! Deleted ${totalDeleted} old scraped cars.`);
}

main().catch(console.error);
