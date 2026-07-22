import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  customType,
  index
} from "drizzle-orm/pg-core";

// Custom type for tsvector
const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const offices = pgTable("offices", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  description: text("description"),
  location: text("location"),
  hours: text("hours"),
  icon: text("icon"),
  heroImage: text("hero_image"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  contactWhatsapp: text("contact_whatsapp"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const officeStaff = pgTable("office_staff", {
  id: uuid("id").defaultRandom().primaryKey(),
  officeId: uuid("office_id").notNull().references(() => offices.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role"),
  email: text("email"),
  phone: text("phone"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const officeLinks = pgTable("office_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  officeId: uuid("office_id").notNull().references(() => offices.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  icon: text("icon"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const officeDocuments = pgTable("office_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  officeId: uuid("office_id").notNull().references(() => offices.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  type: text("type"),
  size: text("size"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const faqItems = pgTable("faq_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: text("category").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  searchVector: tsvector("search_vector"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    searchIndex: index("faq_search_idx").using("gin", table.searchVector),
  };
});

// Relations
export const officesRelations = relations(offices, ({ many }) => ({
  staff: many(officeStaff),
  links: many(officeLinks),
  documents: many(officeDocuments),
}));

export const officeStaffRelations = relations(officeStaff, ({ one }) => ({
  office: one(offices, {
    fields: [officeStaff.officeId],
    references: [offices.id],
  }),
}));

export const officeLinksRelations = relations(officeLinks, ({ one }) => ({
  office: one(offices, {
    fields: [officeLinks.officeId],
    references: [offices.id],
  }),
}));

export const officeDocumentsRelations = relations(officeDocuments, ({ one }) => ({
  office: one(offices, {
    fields: [officeDocuments.officeId],
    references: [offices.id],
  }),
}));
