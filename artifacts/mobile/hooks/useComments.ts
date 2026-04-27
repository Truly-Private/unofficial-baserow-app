import { useQuery } from "@tanstack/react-query";
import { useCreds } from "@/contexts/AuthContext";
import {
  listComments,
  createComment as createCommentApi,
  updateComment as updateCommentApi,
  deleteComment as deleteCommentApi,
  type BaserowComment,
} from "@/lib/baserow";

export function useComments(tableId: number, rowId: number) {
  const creds = useCreds();

  const query = useQuery({
    queryKey: ["comments", tableId, rowId],
    queryFn: () => listComments(creds, tableId, rowId),
    enabled: !!tableId && !!rowId,
  });

  return query;
}

export async function createComment(
  tableId: number,
  rowId: number,
  comment: string
): Promise<BaserowComment> {
  // This needs to be called within a component context where creds is available
  // For mutations, use useMutation with the creds hook
  throw new Error("Use createCommentMutation instead");
}

export async function updateComment(
  commentId: number,
  comment: string
): Promise<BaserowComment> {
  throw new Error("Use updateCommentMutation instead");
}

export async function deleteComment(commentId: number): Promise<void> {
  throw new Error("Use deleteCommentMutation instead");
}

// Re-export types
export type { BaserowComment };
