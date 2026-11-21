import { z } from "zod";
import { TEHNOSCARB_CONSTANTS } from "./tehnoscarb.constants";

export const modelSchema = z.object({
  id: z.union([z.number(), z.string()]),
  category: z.string().optional(),
  count: z.number().optional(),
  name: z.string(),
  full: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  avg: z.string().optional(),
  type: z.string(),
  brand: z.string().optional(),
  brand_id: z.string().optional(),
  alias: z.string().optional(),
  url: z.string(),
  brands_name: z.string().optional(),
  ru_types_name: z.string().optional(),
  types_sam: z.string().optional(),
  groups_sam: z.string().optional(),
  items_vip: z.string().nullable().optional(),
  items_id_int: z.string().nullable().optional(),
  models_alias: z.string().optional(),
  description: z.string().optional().default(""),
  min_items_added: z.string().optional().default(""),
  items_files: z.string().optional().default(""),
});

export const catalogSchema = z.object({
  options: z.array(z.any()),
  seo: z.array(z.any()),
  selected: z.array(z.any()),
  filters: z.array(z.any()),
  category: z.object({
    id: z.null(),
    name: z.null(),
  }),
  alies: z.null(),
  total: z.number(),
  totalItems: z.number(),
  way: z.array(z.any()),
  model: z.any(),
  models: z.array(modelSchema),
  modelsLayer: z.array(z.any()),
  items: z.array(z.any()),
  page: z.number(),
  recordOnPage: z.number(),
  price: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }),
  sort: z.array(z.any()),
  search: z.object({
    alias: z.string(),
    name: z.string(),
    cancel: z.string(),
    href: z.string(),
  }),
  count: z.null(),
  uri: z.string(),
  desc: z.string(),
  categories: z.array(z.any()),
  pagetitle: z.array(z.any()),
  sql: z.string().optional(),
});

const optionsSchema = z.object({
  catalog: catalogSchema,
});

export const tehnoscarbSchema = z.object({
  options: optionsSchema,
  isError: z.boolean().optional().default(false),
});

export const stateTehnoscarbItemSchema = z.object({
  foundIds: z.array(z.string()),
});

export const stateTehnoscarbSchema = z.object({
  [TEHNOSCARB_CONSTANTS.keywords.minelabEquinox900Key]:
    stateTehnoscarbItemSchema,
  [TEHNOSCARB_CONSTANTS.keywords.motogarnturaKey]: stateTehnoscarbItemSchema,
});
