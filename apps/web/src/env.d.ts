interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_GAME_SERVER_URL?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }
