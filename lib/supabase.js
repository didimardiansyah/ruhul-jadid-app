import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://dgazoynwdgimtmolggvp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnYXpveW53ZGdpbXRtb2xnZ3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzMxMjEsImV4cCI6MjA4NTYwOTEyMX0.kXG64_K-GQa2jC3K0PteCkqXGyxlCfLFFKt-PLJTBAI"
);
