import Gate from "./Gate.jsx";
import App from "./App.jsx";
import { supabaseConfigured } from "./lib/supabase.js";

export default function Root() {
  if (!supabaseConfigured) return <App />;
  return <Gate />;
}
