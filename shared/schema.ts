import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, serial, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Sequence for generating unique patient numbers
export const patientSequence = pgTable("patient_sequence", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Patients table - core patient demographic and medical information
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: text("patient_id").notNull().unique(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  contact: text("contact").notNull(),
  emergencyContact: text("emergency_contact").notNull(),
  address: text("address").notNull(),
  medicalHistory: text("medical_history"),
  allergies: text("allergies"),
  currentMedications: text("current_medications"),
  status: text("status").notNull().default("active"),
  admissionDate: timestamp("admission_date").notNull().default(sql`now()`),
  dischargeDate: timestamp("discharge_date"),
});

// Diagnoses table - medical diagnosis records for patients
export const diagnoses = pgTable("diagnoses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patient_id: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  symptoms: text("symptoms").notNull(),
  temperature: text("temperature"),
  bloodPressure: text("blood_pressure"),
  heartRate: integer("heart_rate"),
  oxygenSaturation: integer("oxygen_saturation"),
  diagnosisNotes: text("diagnosis_notes").notNull(),
  medications: text("medications"),
  treatmentPlan: text("treatment_plan"),
  mediaUrl: text("media_url"),
  diagnosisDate: timestamp("diagnosis_date").notNull().default(sql`now()`),
});

// Discharges table - patient discharge records
export const discharges = pgTable("discharge_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  dischargeDate: date("discharge_date"),
  dischargeTime: text("discharge_time"),
  dischargeType: text("discharge_type"),
  conditionOnDischarge: text("condition_on_discharge"),
  dischargeSummary: text("discharge_summary"),
  followUpInstructions: text("follow_up_instructions"),
  medications: text("medications"),
  dietInstructions: text("diet_instructions"),
  activityRestrictions: text("activity_restrictions"),
  followUpAppointment: date("follow_up_appointment"),
  dischargedBy: text("discharged_by"),
  finalDiagnosis: text("final_diagnosis"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Relations
export const patientsRelations = relations(patients, ({ many }) => ({
  diagnoses: many(diagnoses),
  discharges: many(discharges),
}));

export const diagnosesRelations = relations(diagnoses, ({ one }) => ({
  patient: one(patients, {
    fields: [diagnoses.patient_id],
    references: [patients.id],
  }),
}));

export const dischargesRelations = relations(discharges, ({ one }) => ({
  patient: one(patients, {
    fields: [discharges.patientId],
    references: [patients.id],
  }),
}));

// Insert schemas with validation
export const insertPatientSchema = createInsertSchema(patients, {
  name: z.string().min(1, "Name is required"),
  age: z.number().min(0).max(150),
  gender: z.enum(["Male", "Female", "Other"]),
  contact: z.string().min(1, "Contact is required"),
  emergencyContact: z.string().min(1, "Emergency contact is required"),
  address: z.string().min(1, "Address is required"),
  status: z.enum(["active", "discharged"]).optional(),
}).omit({
  id: true,
  patientId: true,
  admissionDate: true,
  dischargeDate: true,
});

export const updatePatientSchema = insertPatientSchema.partial();

export const insertDiagnosisSchema = createInsertSchema(diagnoses, {
  patient_id: z.string(),
  symptoms: z.string().min(1, "Symptoms are required"),
  temperature: z.string().optional(),
  bloodPressure: z.string().optional(),
  heartRate: z.number().min(0).max(300).optional(),
  oxygenSaturation: z.number().min(0).max(100).optional(),
  diagnosisNotes: z.string().min(1, "Diagnosis notes are required"),
  medications: z.string().optional(),
  treatmentPlan: z.string().optional(),
  mediaUrl: z.string().url().optional(),
}).omit({
  id: true,
  diagnosisDate: true,
});

// Remove old patientId reference
export const updateDiagnosisSchema = insertDiagnosisSchema.omit({ patient_id: true }).partial();

export const insertDischargeSchema = createInsertSchema(discharges, {
  dischargeSummary: z.string().optional(),
  patientId: z.string(),
  dischargeDate: z.string().min(1, "Discharge date is required"),
  dischargeTime: z.string().optional(),
  dischargeType: z.string().min(1, "Discharge type is required"),
  condition_on_discharge: z.string().min(1, "Condition on discharge is required"),
  followUpInstructions: z.string().min(1, "Follow-up instructions are required"),
  medications: z.string().optional(),
  dietInstructions: z.string().optional(),
  activity_restrictions: z.string().optional(),
  followUpAppointment: z.string().optional(),
  dischargedBy: z.string().optional(),
  finalDiagnosis: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateDischargeSchema = insertDischargeSchema.omit({ patientId: true }).partial();

// TypeScript types
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type UpdatePatient = z.infer<typeof updatePatientSchema>;

export type Diagnosis = typeof diagnoses.$inferSelect;
export type InsertDiagnosis = z.infer<typeof insertDiagnosisSchema>;
export type UpdateDiagnosis = z.infer<typeof updateDiagnosisSchema>;

export type Discharge = typeof discharges.$inferSelect;
export type InsertDischarge = z.infer<typeof insertDischargeSchema>;
export type UpdateDischarge = z.infer<typeof updateDischargeSchema>;
