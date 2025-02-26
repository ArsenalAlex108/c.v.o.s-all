import { Modules } from "@medusajs/framework/utils";
import { MedusaModule } from "@medusajs/modules-sdk";
import { REVIEW_MODULE } from "../modules/review";

MedusaModule.setCustomLink(() => {
  return {
    isLink: true,
    isReadOnlyLink: true,
    extends: [
      {
        serviceName: REVIEW_MODULE,
        relationship: {
          serviceName: Modules.PRODUCT,
          entity: "ProductVariant",
          primaryKey: "id",
          foreignKey: "variant_id",
          alias: "variant",
          args: {
            methodSuffix: "Variants",
          },
        },
      },
      {
        serviceName: REVIEW_MODULE,
        relationship: {
          serviceName: Modules.CUSTOMER,
          entity: "Customer",
          primaryKey: "id",
          foreignKey: "customer_id",
          alias: "customer",
          args: {
            methodSuffix: "Customers",
          },
        },
      },
    ],
  };
});
