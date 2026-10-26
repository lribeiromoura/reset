import { z } from "zod";

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  timezone: z.string().trim().min(1).max(64).optional().refine((value) => {
    if (!value) return true;
    try {
      new Intl.DateTimeFormat("pt-BR", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Use um fuso horário IANA válido."),
}).refine((value) => value.name !== undefined || value.timezone !== undefined, "Informe ao menos um campo.");

export const accountDeletionSchema = z.object({
  confirmation: z.literal("EXCLUIR"),
  password: z.string().min(1).max(128),
});
