import {
  PaginatedResponse,
} from "@medusajs/types";
import { QueryReview } from "./query";

/* Store */
export type StoreReviewsResponse = PaginatedResponse<{
  quotes: QueryReview[];
}>;
