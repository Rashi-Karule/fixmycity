import { z } from 'zod';

export const CivicCategoryEnum = z.enum([
  'WASTE_MANAGEMENT',
  'WATER_SUPPLY',
  'ROADS_INFRASTRUCTURE',
  'STREET_LIGHTING',
  'TRAFFIC_TRANSPORT',
  'ENVIRONMENT_POLLUTION',
  'PUBLIC_HEALTH',
  'SAFETY_GOVERNANCE',
]);

export const ComplaintStatusEnum = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'RESOLVED',
  'UNDER_ADMIN_REVIEW',
  'REJECTED',
]);

export const PriorityLevelEnum = z.enum(['INTERMEDIATE', 'MODERATE', 'STANDARD']);

export const CreateComplaintSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(150, 'Title cannot exceed 150 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  category: CivicCategoryEnum,
  suggested_category: CivicCategoryEnum.optional(),
  classification_confidence: z.number().min(0).max(1).optional(),
  department_id: z.string().optional(),
  latitude: z
    .number()
    .min(-90)
    .max(90, 'Valid latitude coordinate is required'),
  longitude: z
    .number()
    .min(-180)
    .max(180, 'Valid longitude coordinate is required'),
  address: z.string().min(5, 'Specific location or address is required'),
  landmark: z.string().max(100).optional(),
  priority: PriorityLevelEnum.default('MODERATE'),
  image_urls: z.array(z.string()).min(1, 'At least one photo evidence is required'),
});

export const UpdateStatusSchema = z.object({
  status: ComplaintStatusEnum,
  notes: z.string().max(1000).optional(),
  resolution_image_url: z.string().url().optional().or(z.literal('')),
});

export const UpdatePrioritySchema = z.object({
  priority: PriorityLevelEnum,
  reason: z.string().min(3, 'A reason for adjusting priority is required'),
});

export const AddCommentSchema = z.object({
  comment_text: z
    .string()
    .min(2, 'Comment must be at least 2 characters')
    .max(500, 'Comment cannot exceed 500 characters'),
});
