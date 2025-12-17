import { z } from 'zod';

export const productCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number({ invalid_type_error: 'Price must be a number' }).nonnegative(),
  stock: z.coerce.number({ invalid_type_error: 'Stock must be a number' }).int().nonnegative(),
  sku: z.string().optional(),
});

export const productUpdateSchema = productCreateSchema.partial().refine(
  (obj) => Object.keys(obj).length > 0,
  { message: 'At least one field must be provided for update' }
);

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export default productCreateSchema;
