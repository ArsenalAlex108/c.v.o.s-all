import { model } from "@medusajs/framework/utils";

export const Review = model.define("review", {
  id: model.id({ prefix: "rev" }).primaryKey(),
  content: model.text(),
  customer_id: model.text(),
  variant_id: model.text(),
});
