import { z } from "zod";

export const errorResponseSchema = z
  .object({
    error: z.object({
      code: z.string().meta({ example: "unauthorized" }),
      message: z.string(),
    }),
  })
  .meta({ id: "ErrorResponse" });

export const healthResponseSchema = z
  .object({
    status: z.literal("ok"),
    client: z
      .string()
      .meta({ description: "Nama API client", example: "FOMO" }),
    time: z.iso.datetime(),
  })
  .meta({ id: "HealthResponse" });

export type HealthResponse = z.infer<typeof healthResponseSchema>;
