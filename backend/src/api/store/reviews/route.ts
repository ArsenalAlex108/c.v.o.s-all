import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { RemoteQueryFunction } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { StoreReviewsResponse } from "@starter/types";
import { GetReviewParamsType } from "./validators";

export const GET = async (
  req: AuthenticatedMedusaRequest<GetReviewParamsType>,
  res: MedusaResponse<StoreReviewsResponse>
) => {
  const query = req.scope.resolve<RemoteQueryFunction>(
    ContainerRegistrationKeys.QUERY
  );

  const { fields, pagination } = req.remoteQueryConfig;
  const { data: reviews, metadata } = await query.graph({
    entity: "review",
    fields,
    // TODO: Add filter, ideally by product_id
    // filters: {
    //   customer_id: req.auth_context.actor_id,
    // },
    pagination: {
      ...pagination,
      skip: pagination.skip!,
    },
  });

  res.json({
    reviews,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  });
};