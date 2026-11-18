interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_GAME_SERVER_URL?: string;
  readonly VITE_ROSTER_ABILITY_DRAW_ENABLED?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }
