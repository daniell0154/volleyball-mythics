import { createClient } from "@supabase/supabase-js";
import type { MatchPlayer, MatchResult, MatchMode } from "@volleyball-mythics/protocol";

export interface FinalMatchResult {
  matchId: string;
  mode: MatchMode;
  score: MatchResult["score"];
  winner: MatchResult["winner"];
  status?: "finished" | "cancelled";
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
    async persist(result: FinalMatchResult, signal?: AbortSignal): Promise<void> {
      const request = client.rpc(result.status === "cancelled" ? "persist_cancelled_match_result" : "persist_match_result", {
        p_result: { ...result, players: result.players },
      });
      const { error } = await (signal ? request.abortSignal(signal) : request);
      if (error) throw error;
    },
  };
}
