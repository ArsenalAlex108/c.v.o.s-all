import {
  createFindParams
} from "@medusajs/medusa/api/utils/validators";
import { z } from "zod";

export type GetReviewParamsType = z.infer<typeof GetReviewParams>;
export const GetReviewParams = createFindParams({
  limit: 15,
  offset: 0,
})