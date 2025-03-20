import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(), // "teacher" or "student"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  fileType: text("file_type").notNull(), // pdf, doc, txt
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMaterialSchema = createInsertSchema(materials).pick({
  teacherId: true,
  title: true,
  content: true,
  fileType: true,
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  questions: json("questions").notNull(), // Store as structured JSON
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  materialId: integer("material_id"), // Optional link to source material
});

export const insertAssignmentSchema = createInsertSchema(assignments).pick({
  teacherId: true,
  title: true,
  description: true,
  questions: true,
  dueDate: true,
  materialId: true,
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull(),
  studentId: integer("student_id").notNull(),
  answers: json("answers").notNull(), // Store as structured JSON
  feedback: json("feedback"), // AI feedback
  score: integer("score"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  evaluatedAt: timestamp("evaluated_at"),
});

export const insertSubmissionSchema = createInsertSchema(submissions).pick({
  assignmentId: true,
  studentId: true,
  answers: true,
});

export const waitlistEntries = pgTable("waitlist_entries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWaitlistSchema = createInsertSchema(waitlistEntries).pick({
  name: true,
  email: true,
  role: true,
});

// Question JSON types for better type checking
export const questionSchema = z.object({
  id: z.number(),
  type: z.enum(['multiple_choice', 'short_answer', 'essay']),
  text: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]).optional(),
  points: z.number().default(1),
});

export const answersSchema = z.record(z.string(), z.union([z.string(), z.array(z.string())]));

export const feedbackSchema = z.object({
  overallFeedback: z.string(),
  score: z.number(),
  questionFeedback: z.record(z.string(), z.object({
    points: z.number(),
    feedback: z.string(),
    isCorrect: z.boolean().optional(),
  })),
});

// Export all types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;

export type InsertWaitlistEntry = z.infer<typeof insertWaitlistSchema>;
export type WaitlistEntry = typeof waitlistEntries.$inferSelect;

export type Question = z.infer<typeof questionSchema>;
export type Answers = z.infer<typeof answersSchema>;
export type Feedback = z.infer<typeof feedbackSchema>;
