import ky from "ky";
import {toast} from "sonner";
import {z} from "zod";

const editRequestSchema = z.object({
  selectedCode: z.string(),
  fullCode: z.string(),
  instruction: z.string(),
});

const editResponseSchema = z.object({
  editedCode: z.string(),
});

type TEditRequest = z.infer<typeof editRequestSchema>;
type TEditResponse = z.infer<typeof editResponseSchema>;

export const fetcher = async (payload: TEditRequest, signal: AbortSignal) => {
  try {
    const validatedPayload = editRequestSchema.parse(payload);

    const response = await ky
      .post("/api/quick-edit", {
        json: validatedPayload,
        signal,
        timeout: 30_000,
        retry: 0,
      })
      .json<TEditResponse>();

    const validatedResponse = editResponseSchema.parse(response);

    return validatedResponse.editedCode || null;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return null;
    }
    toast.error("Failed to fetch AI quick edit");
    return null;
  }
};
