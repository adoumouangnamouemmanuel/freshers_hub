import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./identity";
import { groups } from "./groups";

export const postCategoryEnum = pgEnum("post_category", [
  "announcement",
  "alert",
  "event",
  "discussion"
]);

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: postCategoryEnum("category").notNull().default("announcement"),
  visibility: text("visibility").notNull().default("public"),
  
  eventDate: timestamp("event_date", { withTimezone: true }),
  locationText: text("location_text"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const postTargets = pgTable("post_targets", {
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(), // 'group' etc
  targetId: uuid("target_id").notNull(), // e.g. group.id
});

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
