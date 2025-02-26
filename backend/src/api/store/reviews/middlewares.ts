import {
  authenticate,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";
import {
  GetReviewParams,
} from "./validators";
import { listReviewsTransformQueryConfig } from "./query-config";

export const storeReviewsMiddlewares: MiddlewareRoute[] = [
  {
    method: "ALL",
    matcher: "/store/reviews*",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["GET"],
    matcher: "/store/reviews",
    middlewares: [
      validateAndTransformQuery(GetReviewParams, listReviewsTransformQueryConfig),
    ],
  },
];
