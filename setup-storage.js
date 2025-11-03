import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorageBuckets() {
  try {
    console.log("Setting up storage buckets...");

    // Create medical-media bucket
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error("Error listing buckets:", listError);
      return;
    }

    const medicalMediaExists = buckets.some((b) => b.name === "medical-media");

    if (!medicalMediaExists) {
      console.log("Creating medical-media bucket...");
      const { error: createError } = await supabase.storage.createBucket(
        "medical-media",
        {
          public: true,
          allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "video/mp4",
            "video/quicktime",
            "video/x-msvideo",
            "application/pdf",
          ],
          fileSizeLimit: 104857600, // 100MB
        }
      );

      if (createError) {
        console.error("Error creating medical-media bucket:", createError);
        return;
      }

      console.log("✓ medical-media bucket created successfully");
    } else {
      console.log("✓ medical-media bucket already exists");
    }

    // Set bucket policies
    console.log("Setting bucket policies...");

    const { error: policyError } = await supabase.storage.buckets.update(
      "medical-media",
      {
        public: true,
      }
    );

    if (policyError) {
      console.log("Note: Bucket update response:", policyError);
      // This might fail but the bucket should still work
    }

    console.log("✓ Storage setup complete!");
  } catch (error) {
    console.error("Setup error:", error);
    process.exit(1);
  }
}

setupStorageBuckets();
