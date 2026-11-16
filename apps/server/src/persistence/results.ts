import { createClient } from "@supabase/supabase-js";
import type { MatchPlayer, MatchResult, MatchMode } from "@volleyball-mythics/protocol";

export interface FinalMatchResult {
  matchId: string;
  mode: MatchMode;
  score: MatchResult["score"];
  winner: NonNullable<MatchResult["winner"]>;
  reason: NonNullable<MatchResult["reason"]>;
  rulesVersion: number;
  startedAt: string;
  endedAt: string;
  players: readonly Omit<MatchPlayer, "matchId">[];
}

export function createResultsRepository(url: string, serviceSecret: string) {
  if (!serviceSecret) throw new Error("Server Supabase secret is required");
  const client = createClient(url, serviceSecret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    async persist(result: FinalMatchResult): Promise<void> {
      const { error } = await client.rpc("persist_match_result", {
        p_result: { ...result, players: result.players },
      });
      if (error) throw error;
    },
  };
}
