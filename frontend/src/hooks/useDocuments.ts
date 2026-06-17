import useSWR from "swr";
import { Document } from "../types";
import { getDocuments } from "../api/client";

export function useDocuments() {
  const { data, error, isLoading, mutate } = useSWR<Document[]>(
    "/api/documents",
    getDocuments,
    { refreshInterval: 3000 },
  );

  return {
    documents: data ?? [],
    isLoading,
    error,
    mutate,
  };
}
