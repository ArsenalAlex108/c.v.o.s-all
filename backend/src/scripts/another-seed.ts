import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/core-flows";
import {
  ExecArgs,
  IFulfillmentModuleService,
  ISalesChannelModuleService,
  IStoreModuleService,
} from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import { Logger } from "@medusajs/medusa";
import { RemoteLink } from "@medusajs/modules-sdk";

/// HINT:
// - Cường seeding data bằng code
// - Sợ data chuẩn lẫn lộn với data không chuẩn? Xóa hết luôn. Cái nào cần thì chạy script seeding, vậy thôi
// - https://docs.medusajs.com/resources/medusa-cli/commands/db


export default async function seedDemoData({ container }: ExecArgs) {
  const logger: Logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const remoteLink: RemoteLink = container.resolve(
    ContainerRegistrationKeys.REMOTE_LINK
  );
  const fulfillmentModuleService: IFulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );
  const salesChannelModuleService: ISalesChannelModuleService =
    container.resolve(ModuleRegistrationName.SALES_CHANNEL);
  const storeModuleService: IStoreModuleService = container.resolve(
    ModuleRegistrationName.STORE
  );

  const countries = ["vn", "kh", "la"];

  logger.info("Seeding store data...");
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  const [store] = await storeModuleService.listStores();
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          {
            currency_code: "vnd",
            is_default: true,
          },
        ],
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });
  logger.info("Seeding region data...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Asia",
          currency_code: "usd",
          countries,
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
    })),
  });
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Indochine Warehouse",
          address: {
            city: "Ho Chi Minh",
            country_code: "VI",
            address_1: "",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await remoteLink.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  const [shippingProfiles, count] = await fulfillmentModuleService.listAndCountShippingProfiles({})
  const shippingProfile = shippingProfiles[0];


  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Asia Warehouse delivery",
    type: "shipping",
    service_zones: [
      {
        name: "Asia",
        geo_zones: [
          {
            country_code: "vn",
            type: "country",
          },
          {
            country_code: "kh",
            type: "country",
          },
          {
            country_code: "la",
            type: "country",
          },
        ],
      },
    ],
  });

  await remoteLink.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding stock location data.");

  // TODO:
  logger.info("Seeding product data...");

  const {
    result: [collection],
  } = await createCollectionsWorkflow(container).run({
    input: {
      collections: [
        {
          title: "Recently added",
          handle: "recently-added",
        },
      ],
    },
  });

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Consoles",
          is_active: true,
        },
        {
          name: "Action & Adventure",
          is_active: true,
        },
      ],
    },
  });

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title:
            'Road 96',
          collection_id: collection.id,
          category_ids: [
            categoryResult.find((cat) => cat.name === "Action & Adventure")?.id!,
          ],
          description:
            "Road 96 is a crazy, beautiful road- trip. The discovery of exciting places, and unusual people on your own personal journey to freedom.\nAn ever - evolving story - driven adventure inspired by Tarantino, The Coen Brothers, and Bong Joon - ho. Made by the award - winning creators of Valiant Hearts and Memories Retold. Moments of action, exploration, contemplative melancholy, human encounters and wacky situations. Set against a backdrop of authoritarian rule and oppression. \nA stunning visual style, a soundtrack filled with 90s hits, and a thousand routes through the game combine so each player can create their own unique stories on Road 96.",
          status: ProductStatus.PUBLISHED,
          options: [
            {
              title: "Edition",
              values: ["Standard", "Deluxe"],
            },
          ],
          images: [
            {
              url: "https://store-images.s-microsoft.com/image/apps.33921.14401791124788682.a53b3c8e-a868-4dbf-845f-6db87942340c.32c2bc03-fbaf-42e2-8326-1e68d22fa8ea",
            },
            {
              url: "https://store-images.s-microsoft.com/image/apps.10395.14401791124788682.a53b3c8e-a868-4dbf-845f-6db87942340c.b0c89347-5959-42b3-9b86-1fba086f8b31",
            },
            {
              url: "https://store-images.s-microsoft.com/image/apps.8388.14401791124788682.a53b3c8e-a868-4dbf-845f-6db87942340c.bc9278fa-5e52-4fc5-821e-fb006cdf0d43",
            },
            {
              url: "https://store-images.s-microsoft.com/image/apps.42930.14401791124788682.a53b3c8e-a868-4dbf-845f-6db87942340c.af2e13e6-3824-43f9-b62b-e92a2f476bbf",
            },
          ],
          variants: [
            {
              title: "New Normal",
              sku: "NEW-NORMAL-STANDARD",
              manage_inventory: false,
              prices: [
                {
                  amount: 19.99,
                  currency_code: "eur",
                },
                {
                  amount: 19.99,
                  currency_code: "usd",
                },
              ],
              options: {
                Edition: "Standard",
              },
            },
            {
              title: "New Normal",
              sku: "NEW-NORMAL-DELUXE",
              manage_inventory: false,
              prices: [
                {
                  amount: 21.99,
                  currency_code: "eur",
                },
                {
                  amount: 21.99,
                  currency_code: "usd",
                },
              ],
              options: {
                Edition: "Deluxe",
              },
            },
            {
              title: "Mile 0",
              sku: "MILE-0",
              manage_inventory: false,
              prices: [
                {
                  amount: 12.99,
                  currency_code: "eur",
                },
                {
                  amount: 12.99,
                  currency_code: "usd",
                },
              ],
              options: {
                Edition: "Standard",
              },
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  });

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "XBOX Series X",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Consoles")?.id!,
          ],
          description:
            "Xbox Series X, the fastest, most powerful Xbox ever. Explore rich new worlds with 12 teraflops of raw graphic processing power, DirectX ray tracing, a custom SSD, and 4K gaming. Make the most of every gaming minute with Quick Resume, lightning-fast load times, and gameplay of up to 120 FPS—all powered by Xbox Velocity Architecture. Enjoy thousands of games from four generations of Xbox, with hundreds of optimized titles that look and play better than ever. And when you add Xbox Game Pass Ultimate (membership sold separately), you get online multiplayer to play with friends and an instant library of 100+ high-quality games, including day one releases from Xbox Game Studios.",
          status: ProductStatus.PUBLISHED,
          images: [
            {
              url: "https://cms-assets.xboxservices.com/assets/bc/40/bc40fdf3-85a6-4c36-af92-dca2d36fc7e5.png?n=642227_Hero-Gallery-0_A1_857x676.png",
            },
            {
              url: "https://cms-assets.xboxservices.com/assets/14/b5/14b5af73-466f-4584-9c7c-de5464af8c3b.png?n=642227_Hero-Gallery-0_A3_857x676.png",
            },
            {
              url: "https://cms-assets.xboxservices.com/assets/c5/30/c53042dc-6a60-43f7-b1ff-0b4e018edbbe.png?n=642227_Hero-Gallery-0_A4_857x676.png",
            },
            {
              url: "https://cms-assets.xboxservices.com/assets/5c/5b/5c5bf348-d948-4c48-b7cc-55aaf94f2782.png?n=642227_Hero-Gallery-0_B1_857x676.png",
            },
            {
              url: "https://cms-assets.xboxservices.com/assets/63/5d/635d513d-a5b0-46e3-a665-97dede478295.png?n=642227_Hero-Gallery-0_B3_857x676.png",
            },
            {
              url: "https://cms-assets.xboxservices.com/assets/df/d1/dfd18a77-3b9e-4550-b9fb-1784171b7353.png?n=642227_Hero-Gallery-0_B4_857x676.png",
            },
            {
              url: "https://cms-assets.xboxservices.com/assets/37/d2/37d211d0-5c2c-42c6-bb71-ca7492c5e088.png?n=642227_Hero-Gallery-0_C1_857x676.png",
            },
            {
              url: "https://cms-assets.xboxservices.com/assets/74/13/74131ebf-a57a-40c5-896a-70e4434186b1.png?n=642227_Hero-Gallery-0_C3_857x676.png",
            },
            {
              url: "https://cms-assets.xboxservices.com/assets/d1/2c/d12cd3b8-3880-4dd4-8fe5-dc072a7904f0.png?n=642227_Hero-Gallery-0_C4_857x676.png",
            },
          ],
          options: [
            {
              title: "Edition",
              values: ["Disc Drive", "All Digital"],
            },
            {
              title: "Storage",
              values: ["1TB", "2TB"],
            },
            {
              title: "Color",
              values: ["Carbon Black", "Robot White", "Galaxy Black"],
            },
          ],
          variants: [
            {
              title: "Xbox Series X – 1TB Carbon Black - Disc Drive",
              sku: "XBOX-SERIES-X-1TB-CARBON-BLACK-DISC-DRIVE",
              options: {
                Edition: "Disc Drive",
                Storage: "1TB",
                Color: "Carbon Black",
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 499.99,
                  currency_code: "eur",
                },
                {
                  amount: 499.99,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "Xbox Series X – 1TB Robot White - All Digital",
              sku: "XBOX-SERIES-X-1TB-ROBOT-WHITE-ALL-DIGITAL",
              options: {
                Edition: "All Digital",
                Storage: "1TB",
                Color: "Robot White",
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 449.99,
                  currency_code: "eur",
                },
                {
                  amount: 449.99,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "Xbox Series X – 2TB Galaxy Black - Disc Drive",
              sku: "XBOX-SERIES-X-2TB-GALAXY-BLACK-DISC-DRIVE",
              options: {
                Edition: "Disc Drive",
                Storage: "2TB",
                Color: "Galaxy Black",
              },
              manage_inventory: false,
              prices: [
                {
                  amount: 599.99,
                  currency_code: "eur",
                },
                {
                  amount: 599.99,
                  currency_code: "usd",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  });

  // await createProductsWorkflow(container).run({
  //   input: {
  //     products: [
  //       {
  //         title: `6.5" Ultra HD Smartphone | 3x Impact-Resistant Screen`,
  //         collection_id: collection.id,
  //         category_ids: [
  //           categoryResult.find((cat) => cat.name === "Phones")?.id!,
  //         ],
  //         description:
  //           'This premium smartphone is crafted from durable and lightweight aerospace-grade aluminum, featuring an expansive 6.5" Ultra-High Definition AMOLED display. It boasts exceptional durability with a cutting-edge nanocrystal glass front, offering three times the impact resistance of standard smartphone screens. The device combines sleek design with robust protection, setting a new standard for smartphone resilience and visual excellence. Copy',
  //         weight: 400,
  //         status: ProductStatus.PUBLISHED,
  //         images: [
  //           {
  //             url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/phone-front.png",
  //           },
  //           {
  //             url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/phone-side.png",
  //           },
  //           {
  //             url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/phone-bottom.png",
  //           },
  //         ],
  //         options: [
  //           {
  //             title: "Memory",
  //             values: ["256 GB", "512 GB"],
  //           },
  //           {
  //             title: "Color",
  //             values: ["Purple", "Red"],
  //           },
  //         ],
  //         variants: [
  //           {
  //             title: "256 GB Purple",
  //             sku: "PHONE-256-PURPLE",
  //             options: {
  //               Memory: "256 GB",
  //               Color: "Purple",
  //             },
  //             manage_inventory: false,
  //             prices: [
  //               {
  //                 amount: 999,
  //                 currency_code: "eur",
  //               },
  //               {
  //                 amount: 999,
  //                 currency_code: "usd",
  //               },
  //             ],
  //           },
  //           {
  //             title: "256 GB Red",
  //             sku: "PHONE-256-RED",
  //             options: {
  //               Memory: "256 GB",
  //               Color: "Red",
  //             },
  //             manage_inventory: false,
  //             prices: [
  //               {
  //                 amount: 959,
  //                 currency_code: "eur",
  //               },
  //               {
  //                 amount: 959,
  //                 currency_code: "usd",
  //               },
  //             ],
  //           },
  //         ],
  //         sales_channels: [
  //           {
  //             id: defaultSalesChannel[0].id,
  //           },
  //         ],
  //       },
  //     ],
  //   },
  // });

  // await createProductsWorkflow(container).run({
  //   input: {
  //     products: [
  //       {
  //         title: `34" QD-OLED Curved Gaming Monitor | Ultra-Wide | Infinite Contrast | 175Hz`,
  //         collection_id: collection.id,
  //         category_ids: [
  //           categoryResult.find((cat) => cat.name === "Monitors")?.id!,
  //         ],
  //         description:
  //           "Experience the pinnacle of display technology with this 34-inch curved monitor. By merging OLED panels and Quantum Dot technology, this QD-OLED screen delivers exceptional contrast, deep blacks, unlimited viewing angles, and vivid colors. The curved design provides an immersive experience, allowing you to enjoy the best of both worlds in one cutting-edge display. This innovative monitor represents the ultimate fusion of visual performance and immersive design.",
  //         weight: 400,
  //         status: ProductStatus.PUBLISHED,
  //         images: [
  //           {
  //             url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/screen-front.png",
  //           },
  //           {
  //             url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/screen-side.png",
  //           },
  //           {
  //             url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/screen-top.png",
  //           },
  //           {
  //             url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/screen-back.png",
  //           },
  //         ],
  //         options: [
  //           {
  //             title: "Color",
  //             values: ["White", "Black"],
  //           },
  //         ],
  //         variants: [
  //           {
  //             title: "ACME Monitor 4k White",
  //             sku: "ACME-MONITOR-WHITE",
  //             options: {
  //               Color: "White",
  //             },
  //             manage_inventory: false,
  //             prices: [
  //               {
  //                 amount: 599,
  //                 currency_code: "eur",
  //               },
  //               {
  //                 amount: 599,
  //                 currency_code: "usd",
  //               },
  //             ],
  //           },
  //           {
  //             title: "ACME Monitor 4k White",
  //             sku: "ACME-MONITOR-BLACK",
  //             options: {
  //               Color: "Black",
  //             },
  //             manage_inventory: false,
  //             prices: [
  //               {
  //                 amount: 599,
  //                 currency_code: "eur",
  //               },
  //               {
  //                 amount: 599,
  //                 currency_code: "usd",
  //               },
  //             ],
  //           },
  //         ],
  //         sales_channels: [
  //           {
  //             id: defaultSalesChannel[0].id,
  //           },
  //         ],
  //       },
  //     ],
  //   },
  // });

  // await createProductsWorkflow(container).run({
  //   input: {
  //     products: [
  //       {
  //         title: "Hi-Fi Gaming Headset | Pro-Grade DAC | Hi-Res Certified",
  //         collection_id: collection.id,
  //         category_ids: [
  //           categoryResult.find((cat) => cat.name === "Accessories")?.id!,
  //         ],
  //         description: `Experience studio-quality audio with this advanced acoustic system, which pairs premium hardware with high-fidelity sound and innovative audio software for an immersive listening experience. The integrated digital-to-analog converter (DAC) enhances the audio setup with high-resolution certification and a built-in amplifier, delivering exceptional sound clarity and depth. This comprehensive audio solution brings professional-grade sound to your personal environment, whether for gaming, music production, or general entertainment.`,
  //         weight: 400,
  //         status: ProductStatus.PUBLISHED,
  //         images: [
  //           {
  //             url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/headphone-front.png",
  //           },
  //           {
  //             url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/headphone-side.png",
  //           },
  //           {
  //             url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/headphone-top.png",
  //           },
  //         ],
  //         options: [
  //           {
  //             title: "Color",
  //             values: ["Black", "White"],
  //           },
  //         ],
  //         variants: [
  //           {
  //             title: "Headphone Black",
  //             sku: "HEADPHONE-BLACK",
  //             options: {
  //               Color: "Black",
  //             },
  //             manage_inventory: false,
  //             prices: [
  //               {
  //                 amount: 149,
  //                 currency_code: "eur",
  //               },
  //               {
  //                 amount: 149,
  //                 currency_code: "usd",
  //               },
  //             ],
  //           },
  //           {
  //             title: "Headphone White",
  //             sku: "HEADPHONE-WHITE",
  //             options: {
  //               Color: "White",
  //             },
  //             manage_inventory: false,
  //             prices: [
  //               {
  //                 amount: 149,
  //                 currency_code: "eur",
  //               },
  //               {
  //                 amount: 149,
  //                 currency_code: "usd",
  //               },
  //             ],
  //           },
  //         ],
  //         sales_channels: [
  //           {
  //             id: defaultSalesChannel[0].id,
  //           },
  //         ],
  //       },
  //     ],
  //   },
  // });

  // await createProductsWorkflow(container).run({
  //   input: {
  //     products: [
  //       {
  //         title: "Wireless Keyboard | Touch ID | Numeric Keypad",
  //         category_ids: [
  //           categoryResult.find((cat) => cat.name === "Accessories")?.id!,
  //         ],
  //         description: `This wireless keyboard offers a comfortable typing experience with a numeric keypad and Touch ID. It features navigation buttons, full-sized arrow keys, and is ideal for spreadsheets and gaming. The rechargeable battery lasts about a month. It pairs automatically with compatible computers and includes a USB-C to Lightning cable for charging and pairing.`,
  //         weight: 400,
  //         status: ProductStatus.PUBLISHED,
  //         images: [
  //           {
  //             url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/keyboard-front.png",
  //           },
  //           {
  //             url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/keyboard-side.png",
  //           },
  //         ],
  //         options: [
  //           {
  //             title: "Color",
  //             values: ["Black", "White"],
  //           },
  //         ],
  //         variants: [
  //           {
  //             title: "Keyboard Black",
  //             sku: "KEYBOARD-BLACK",
  //             options: {
  //               Color: "Black",
  //             },
  //             manage_inventory: false,
  //             prices: [
  //               {
  //                 amount: 99,
  //                 currency_code: "eur",
  //               },
  //               {
  //                 amount: 99,
  //                 currency_code: "usd",
  //               },
  //             ],
  //           },
  //           {
  //             title: "Keyboard White",
  //             sku: "KEYBOARD-WHITE",
  //             options: {
  //               Color: "White",
  //             },
  //             manage_inventory: false,
  //             prices: [
  //               {
  //                 amount: 99,
  //                 currency_code: "eur",
  //               },
  //               {
  //                 amount: 99,
  //                 currency_code: "usd",
  //               },
  //             ],
  //           },
  //         ],
  //         sales_channels: [
  //           {
  //             id: defaultSalesChannel[0].id,
  //           },
  //         ],
  //       },
  //     ],
  //   },
  // });

  // await createProductsWorkflow(container).run({
  //   input: {
  //     products: [
  //       {
  //         title: "Wireless Rechargeable Mouse | Multi-Touch Surface",
  //         category_ids: [
  //           categoryResult.find((cat) => cat.name === "Accessories")?.id!,
  //         ],
  //         description: `This wireless keyboard offers a comfortable typing experience with a numeric keypad and Touch ID. It features navigation buttons, full-sized arrow keys, and is ideal for spreadsheets and gaming. The rechargeable battery lasts about a month. It pairs automatically with compatible computers and includes a USB-C to Lightning cable for charging and pairing.`,
  //         weight: 400,
  //         status: ProductStatus.PUBLISHED,
  //         images: [
  //           {
  //             url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/mouse-top.png",
  //           },
  //           {
  //             url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/mouse-front.png",
  //           },
  //         ],
  //         options: [
  //           {
  //             title: "Color",
  //             values: ["Black", "White"],
  //           },
  //         ],
  //         variants: [
  //           {
  //             title: "Mouse Black",
  //             sku: "MOUSE-BLACK",
  //             options: {
  //               Color: "Black",
  //             },
  //             manage_inventory: false,
  //             prices: [
  //               {
  //                 amount: 79,
  //                 currency_code: "eur",
  //               },
  //               {
  //                 amount: 79,
  //                 currency_code: "usd",
  //               },
  //             ],
  //           },
  //           {
  //             title: "Mouse White",
  //             sku: "MOUSE-WHITE",
  //             options: {
  //               Color: "White",
  //             },
  //             manage_inventory: false,
  //             prices: [
  //               {
  //                 amount: 79,
  //                 currency_code: "eur",
  //               },
  //               {
  //                 amount: 79,
  //                 currency_code: "usd",
  //               },
  //             ],
  //           },
  //         ],
  //         sales_channels: [
  //           {
  //             id: defaultSalesChannel[0].id,
  //           },
  //         ],
  //       },
  //     ],
  //   },
  // });

  // await createProductsWorkflow(container).run({
  //   input: {
  //     products: [
  //       {
  //         title: "Conference Speaker | High-Performance | Budget-Friendly",
  //         category_ids: [
  //           categoryResult.find((cat) => cat.name === "Accessories")?.id!,
  //         ],
  //         description: `This compact, powerful conference speaker offers exceptional, high-performance features at a surprisingly affordable price. Packed with advanced productivity-enhancing technology, it delivers premium functionality without the premium price tag. Experience better meetings and improved communication, regardless of where your team members are calling from.`,
  //         weight: 400,
  //         status: ProductStatus.PUBLISHED,
  //         images: [
  //           {
  //             url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/speaker-top.png",
  //           },
  //           {
  //             url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/speaker-front.png",
  //           },
  //         ],
  //         options: [
  //           {
  //             title: "Color",
  //             values: ["Black", "White"],
  //           },
  //         ],
  //         variants: [
  //           {
  //             title: "Speaker Black",
  //             sku: "SPEAKER-BLACK",
  //             options: {
  //               Color: "Black",
  //             },
  //             manage_inventory: false,
  //             prices: [
  //               {
  //                 amount: 79,
  //                 currency_code: "eur",
  //               },
  //               {
  //                 amount: 79,
  //                 currency_code: "usd",
  //               },
  //             ],
  //           },
  //           {
  //             title: "Speaker White",
  //             sku: "SPEAKER-WHITE",
  //             options: {
  //               Color: "White",
  //             },
  //             manage_inventory: false,
  //             prices: [
  //               {
  //                 amount: 55,
  //                 currency_code: "eur",
  //               },
  //               {
  //                 amount: 55,
  //                 currency_code: "usd",
  //               },
  //             ],
  //           },
  //         ],
  //         sales_channels: [
  //           {
  //             id: defaultSalesChannel[0].id,
  //           },
  //         ],
  //       },
  //     ],
  //   },
  // });

  logger.info("Finished seeding product data.");
}
