const { z } = require('zod');

const getPostsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 50)),
    category: z.string().optional(),
    author: z.string().optional(), // "me" to fetch own posts
  }),
});

const createPostSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
    content: z.string().min(1, 'Content is required'),
    category: z.string().default('announcement'),
    visibility: z.enum(['public', 'targeted', 'private']).default('public'),
    targetGroupIds: z.array(z.string().uuid('Invalid UUID for group')).optional(),
  }),
});

const updatePostSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
    content: z.string().min(1, 'Content is required').optional(),
    category: z.string().optional(),
  }),
});

const postIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Post ID format'),
  }),
});

module.exports = {
  getPostsQuerySchema,
  createPostSchema,
  updatePostSchema,
  postIdParamSchema
};
