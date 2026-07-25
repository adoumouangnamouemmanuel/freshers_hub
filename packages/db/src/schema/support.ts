import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { academicYears, units, users } from "./identity";

export const sessionStatusEnum = pgEnum("session_status", [
  "scheduled",
  "completed",
  "cancelled",
  "rescheduled",
  "no_show",
]);

export const sessionWithEnum = pgEnum("session_with", [
  "peer_coach",
  "unit_head",
  "counsellor",
  "peer_counsellor",
]);

export const coachAssignments = pgTable(
  "coach_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    academicYearId: integer("academic_year_id")
      .notNull()
      .references(() => academicYears.id),
    fresherId: uuid("fresher_id")
      .notNull()
      .references(() => users.id),
    peerCoachId: uuid("peer_coach_id")
      .notNull()
      .references(() => users.id),
    assignedBy: uuid("assigned_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    assignmentUnique: uniqueIndex("coach_assignments_year_fresher_coach_unique").on(
      table.academicYearId,
      table.fresherId,
      table.peerCoachId,
    ),
  }),
);

export const counsellorAssignments = pgTable(
  "counsellor_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    academicYearId: integer("academic_year_id")
      .notNull()
      .references(() => academicYears.id),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id),
    peerCounsellorId: uuid("peer_counsellor_id")
      .notNull()
      .references(() => users.id),
    assignedBy: uuid("assigned_by").references(() => users.id),
    status: text("status").notNull().default("active"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => ({
    assignmentUnique: uniqueIndex("counsellor_assignments_year_student_counsellor_unique").on(
      table.academicYearId,
      table.studentId,
      table.peerCounsellorId,
    ),
  }),
);

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull().default('Session'),
  unitId: integer("unit_id")
    .notNull()
    .references(() => units.id),
  academicYearId: integer("academic_year_id")
    .notNull()
    .references(() => academicYears.id),
  studentId: uuid("student_id")
    .notNull()
    .references(() => users.id),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => users.id),
  withType: sessionWithEnum("with_type"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  location: text("location"),
  status: sessionStatusEnum("status").notNull().default("scheduled"),
  isMandatory: boolean("is_mandatory").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const reportTemplates = pgTable("report_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  unitId: integer("unit_id")
    .notNull()
    .references(() => units.id),
  name: text("name").notNull(),
  schema: jsonb("schema").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const sessionReports = pgTable("session_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .unique()
    .references(() => sessions.id, { onDelete: "cascade" }),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => users.id),
  templateId: uuid("template_id").references(() => reportTemplates.id),
  content: jsonb("content").notNull(),
  needsFollowUp: boolean("needs_follow_up").notNull().default(false),
  followedUpAt: timestamp("followed_up_at", { withTimezone: true }),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const complianceFollowUps = pgTable("compliance_follow_ups", {
  id: uuid("id").defaultRandom().primaryKey(),
  academicYearId: integer("academic_year_id")
    .notNull()
    .references(() => academicYears.id),
  fresherId: uuid("fresher_id")
    .notNull()
    .references(() => users.id),
  followedUpBy: uuid("followed_up_by")
    .notNull()
    .references(() => users.id),
  notes: text("notes"),
  followedUpAt: timestamp("followed_up_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});


export const sessionFeedback = pgTable("session_feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => users.id),
  rating: smallint("rating"),
  comment: text("comment"),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const buddyPairings = pgTable(
  "buddy_pairings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    academicYearId: integer("academic_year_id")
      .notNull()
      .references(() => academicYears.id),
    fresherId: uuid("fresher_id")
      .notNull()
      .references(() => users.id),
    buddyId: uuid("buddy_id")
      .notNull()
      .references(() => users.id),
    odipRefId: text("odip_ref_id"),
    syncedAt: timestamp("synced_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    buddyUnique: uniqueIndex("buddy_pairings_year_fresher_buddy_unique").on(
      table.academicYearId,
      table.fresherId,
      table.buddyId,
    ),
  }),
);

export const contactClicks = pgTable("contact_clicks", {
  id: uuid("id").defaultRandom().primaryKey(),
  initiatorId: uuid("initiator_id")
    .notNull()
    .references(() => users.id),
  targetId: uuid("target_id")
    .notNull()
    .references(() => users.id),
  unitId: integer("unit_id").references(() => units.id),
  context: text("context"),
  clickedAt: timestamp("clicked_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  student: one(users, {
    fields: [sessions.studentId],
    references: [users.id],
    relationName: "student_sessions",
  }),
  provider: one(users, {
    fields: [sessions.providerId],
    references: [users.id],
    relationName: "provider_sessions",
  }),
  unit: one(units, {
    fields: [sessions.unitId],
    references: [units.id],
  }),
  academicYear: one(academicYears, {
    fields: [sessions.academicYearId],
    references: [academicYears.id],
  }),
}));
