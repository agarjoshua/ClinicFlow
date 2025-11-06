import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, serial, date, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// CLINICFLOW - NEUROSURGERY CLINIC MANAGEMENT
// Complete schema for consultant + assistant workflow
// ============================================

// ============================================
// CLINICFLOW - NEUROSURGERY CLINIC MANAGEMENT
// Complete schema for consultant + assistant workflow
// ============================================

// Users table - Consultant and Assistant roles
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(), // Supabase auth user ID
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(), // 'consultant' | 'assistant'
  phone: text("phone"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Hospitals table - Multiple hospital locations
export const hospitals = pgTable("hospitals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // e.g., 'SYNERGY', 'AGA_KHAN'
  address: text("address"),
  phone: text("phone"),
  color: text("color").notNull().default('#3b82f6'), // For calendar color coding
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Clinic Sessions - Scheduled clinics at hospitals
export const clinicSessions = pgTable("clinic_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hospitalId: varchar("hospital_id").notNull().references(() => hospitals.id, { onDelete: "cascade" }),
  consultantId: varchar("consultant_id").notNull().references(() => users.id),
  sessionDate: date("session_date").notNull(),
  startTime: text("start_time").notNull(), // e.g., '09:00'
  endTime: text("end_time").notNull(), // e.g., '17:00'
  maxPatients: integer("max_patients").notNull().default(15),
  status: text("status").notNull().default('scheduled'), // 'scheduled' | 'completed' | 'cancelled'
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Patients table - Patient demographic and medical information
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientNumber: text("patient_number").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: date("date_of_birth"),
  age: integer("age"),
  gender: text("gender"), // 'Male' | 'Female' | 'Other'
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  emergencyContactPhone: text("emergency_contact_phone"),
  medicalHistory: text("medical_history"),
  allergies: text("allergies"),
  currentMedications: text("current_medications"),
  bloodType: text("blood_type"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Appointments/Bookings - Patient bookings for clinic sessions
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicSessionId: varchar("clinic_session_id").notNull().references(() => clinicSessions.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  consultantId: varchar("consultant_id").references(() => users.id), // Which doctor this appointment is FOR
  bookingNumber: integer("booking_number"), // 1-15 position in queue
  chiefComplaint: text("chief_complaint").notNull(),
  isPriority: boolean("is_priority").notNull().default(false),
  priorityReason: text("priority_reason"),
  triageNotes: text("triage_notes"),
  // Vital signs captured during triage
  temperature: text("temperature"), // e.g., "98.6°F" or "37°C"
  bloodPressure: text("blood_pressure"), // e.g., "120/80"
  heartRate: integer("heart_rate"), // beats per minute
  oxygenSaturation: integer("oxygen_saturation"), // percentage (0-100)
  status: text("status").notNull().default('booked'), // 'booked' | 'confirmed' | 'seen' | 'rescheduled' | 'cancelled'
  createdBy: varchar("created_by").notNull().references(() => users.id), // Who created/recorded this appointment
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Clinical Cases - Diagnosis and clinical management
export const clinicalCases = pgTable("clinical_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appointmentId: varchar("appointment_id").references(() => appointments.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  consultantId: varchar("consultant_id").notNull().references(() => users.id),
  caseDate: timestamp("case_date").notNull().default(sql`now()`),
  diagnosis: text("diagnosis"),
  diagnosisNotes: text("diagnosis_notes"),
  symptoms: text("symptoms"),
  // Vital Signs
  temperature: text("temperature"), // e.g., "98.6°F" or "37°C"
  bloodPressure: text("blood_pressure"), // e.g., "120/80"
  heartRate: integer("heart_rate"), // bpm
  oxygenSaturation: integer("oxygen_saturation"), // %
  // Clinical Findings
  neurologicalExam: text("neurological_exam"),
  imagingFindings: text("imaging_findings"),
  // Treatment
  treatmentPlan: text("treatment_plan"),
  medications: text("medications"),
  clinicalNotes: text("clinical_notes"),
  status: text("status").notNull().default('active'), // 'active' | 'closed'
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Medical Images - Scans, X-rays, MRIs, etc.
export const medicalImages = pgTable("medical_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicalCaseId: varchar("clinical_case_id").notNull().references(() => clinicalCases.id, { onDelete: "cascade" }),
  fileType: text("file_type").notNull(), // 'image' | 'video' | 'document' | 'link'
  imageType: text("image_type"), // 'MRI' | 'CT' | 'X-Ray' | 'Ultrasound' | 'Photo' | 'Other'
  fileUrl: text("file_url").notNull(), // URL or external link
  thumbnailUrl: text("thumbnail_url"),
  fileName: text("file_name"),
  fileSize: integer("file_size"), // in bytes
  description: text("description"),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").notNull().default(sql`now()`),
});

// Procedures - Neurosurgical procedures
export const procedures = pgTable("procedures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clinicalCaseId: varchar("clinical_case_id").notNull().references(() => clinicalCases.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  hospitalId: varchar("hospital_id").notNull().references(() => hospitals.id),
  consultantId: varchar("consultant_id").notNull().references(() => users.id),
  procedureType: text("procedure_type").notNull(), // 'Craniotomy' | 'Laminectomy' | 'VP Shunt' | etc.
  scheduledDate: date("scheduled_date"),
  scheduledTime: text("scheduled_time"),
  actualDate: date("actual_date"),
  actualTime: text("actual_time"),
  duration: integer("duration"), // in minutes
  status: text("status").notNull().default('planned'), // 'planned' | 'scheduled' | 'done' | 'postponed' | 'cancelled'
  statusReason: text("status_reason"), // Reason for postpone/cancel
  specialInstructions: text("special_instructions"),
  preOpAssessment: text("pre_op_assessment"),
  operativeNotes: text("operative_notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Post-Op Plans - Treatment plan after procedure
export const postOpPlans = pgTable("post_op_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  procedureId: varchar("procedure_id").notNull().unique().references(() => procedures.id, { onDelete: "cascade" }),
  medications: text("medications").notNull(),
  expectedStayDays: integer("expected_stay_days"),
  monitoringFrequency: text("monitoring_frequency"), // 'hourly' | 'every-4-hours' | 'daily'
  specialCareInstructions: text("special_care_instructions"),
  baselineGCS: integer("baseline_gcs"), // Glasgow Coma Scale 3-15
  baselineMotorUR: integer("baseline_motor_ur"), // Upper Right 0-5
  baselineMotorUL: integer("baseline_motor_ul"), // Upper Left 0-5
  baselineMotorLR: integer("baseline_motor_lr"), // Lower Right 0-5
  baselineMotorLL: integer("baseline_motor_ll"), // Lower Left 0-5
  dietInstructions: text("diet_instructions"),
  activityRestrictions: text("activity_restrictions"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Post-Op Updates - Daily monitoring by assistant
export const postOpUpdates = pgTable("post_op_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  procedureId: varchar("procedure_id").notNull().references(() => procedures.id, { onDelete: "cascade" }),
  updateDate: date("update_date").notNull(),
  dayPostOp: integer("day_post_op").notNull(), // Day 1, Day 2, etc.
  // Glasgow Coma Scale
  gcsScore: integer("gcs_score").notNull(), // 3-15
  // Motor Function Examination
  motorUR: integer("motor_ur").notNull(), // Upper Right 0-5
  motorUL: integer("motor_ul").notNull(), // Upper Left 0-5
  motorLR: integer("motor_lr").notNull(), // Lower Right 0-5
  motorLL: integer("motor_ll").notNull(), // Lower Left 0-5
  // Vital Signs
  bloodPressure: text("blood_pressure"),
  pulse: integer("pulse"),
  temperature: decimal("temperature", { precision: 4, scale: 1 }),
  respiratoryRate: integer("respiratory_rate"),
  spo2: integer("spo2"),
  // Clinical Notes
  currentMedications: text("current_medications"),
  improvementNotes: text("improvement_notes"),
  newComplaints: text("new_complaints"),
  neurologicalExam: text("neurological_exam"),
  woundStatus: text("wound_status"),
  // Photos
  photoUrls: text("photo_urls"), // JSON array of URLs
  // Metadata
  updatedBy: varchar("updated_by").notNull().references(() => users.id),
  consultantComments: text("consultant_comments"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Discharges - Patient discharge records
export const discharges = pgTable("discharges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  procedureId: varchar("procedure_id").notNull().unique().references(() => procedures.id, { onDelete: "cascade" }),
  patientId: varchar("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  dischargeDate: date("discharge_date").notNull(),
  totalHospitalDays: integer("total_hospital_days"),
  dischargeStatus: text("discharge_status").notNull(), // 'stable' | 'improved' | 'against_medical_advice' | 'referred' | 'other'
  // Final Assessments
  finalGCS: integer("final_gcs"),
  finalMotorUR: integer("final_motor_ur"),
  finalMotorUL: integer("final_motor_ul"),
  finalMotorLR: integer("final_motor_lr"),
  finalMotorLL: integer("final_motor_ll"),
  // Discharge Details
  dischargeMedications: text("discharge_medications"),
  followUpInstructions: text("follow_up_instructions"),
  activityRestrictions: text("activity_restrictions"),
  woundCareInstructions: text("wound_care_instructions"),
  warningSigns: text("warning_signs"),
  followUpDate: date("follow_up_date"),
  dischargeSummary: text("discharge_summary"),
  // Metadata
  dischargedBy: varchar("discharged_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id), // Consultant approval
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// ============================================
// RELATIONS
// ============================================

export const hospitalsRelations = relations(hospitals, ({ many }) => ({
  clinicSessions: many(clinicSessions),
  procedures: many(procedures),
}));

export const clinicSessionsRelations = relations(clinicSessions, ({ one, many }) => ({
  hospital: one(hospitals, {
    fields: [clinicSessions.hospitalId],
    references: [hospitals.id],
  }),
  consultant: one(users, {
    fields: [clinicSessions.consultantId],
    references: [users.id],
  }),
  appointments: many(appointments),
}));

export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
  clinicalCases: many(clinicalCases),
  procedures: many(procedures),
  discharges: many(discharges),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  clinicSession: one(clinicSessions, {
    fields: [appointments.clinicSessionId],
    references: [clinicSessions.id],
  }),
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  createdByUser: one(users, {
    fields: [appointments.createdBy],
    references: [users.id],
  }),
  clinicalCase: one(clinicalCases),
}));

export const clinicalCasesRelations = relations(clinicalCases, ({ one, many }) => ({
  appointment: one(appointments, {
    fields: [clinicalCases.appointmentId],
    references: [appointments.id],
  }),
  patient: one(patients, {
    fields: [clinicalCases.patientId],
    references: [patients.id],
  }),
  consultant: one(users, {
    fields: [clinicalCases.consultantId],
    references: [users.id],
  }),
  medicalImages: many(medicalImages),
  procedures: many(procedures),
}));

export const medicalImagesRelations = relations(medicalImages, ({ one }) => ({
  clinicalCase: one(clinicalCases, {
    fields: [medicalImages.clinicalCaseId],
    references: [clinicalCases.id],
  }),
  uploadedByUser: one(users, {
    fields: [medicalImages.uploadedBy],
    references: [users.id],
  }),
}));

export const proceduresRelations = relations(procedures, ({ one }) => ({
  clinicalCase: one(clinicalCases, {
    fields: [procedures.clinicalCaseId],
    references: [clinicalCases.id],
  }),
  patient: one(patients, {
    fields: [procedures.patientId],
    references: [patients.id],
  }),
  hospital: one(hospitals, {
    fields: [procedures.hospitalId],
    references: [hospitals.id],
  }),
  consultant: one(users, {
    fields: [procedures.consultantId],
    references: [users.id],
  }),
  postOpPlan: one(postOpPlans),
  postOpUpdates: many(postOpUpdates),
  discharge: one(discharges),
}));

export const postOpPlansRelations = relations(postOpPlans, ({ one }) => ({
  procedure: one(procedures, {
    fields: [postOpPlans.procedureId],
    references: [procedures.id],
  }),
}));

export const postOpUpdatesRelations = relations(postOpUpdates, ({ one }) => ({
  procedure: one(procedures, {
    fields: [postOpUpdates.procedureId],
    references: [procedures.id],
  }),
  updatedByUser: one(users, {
    fields: [postOpUpdates.updatedBy],
    references: [users.id],
  }),
}));

export const dischargesRelations = relations(discharges, ({ one }) => ({
  procedure: one(procedures, {
    fields: [discharges.procedureId],
    references: [procedures.id],
  }),
  patient: one(patients, {
    fields: [discharges.patientId],
    references: [patients.id],
  }),
  dischargedByUser: one(users, {
    fields: [discharges.dischargedBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [discharges.approvedBy],
    references: [users.id],
  }),
}));

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

// Users
export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["consultant", "assistant"]),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updateUserSchema = insertUserSchema.partial();

// Hospitals
export const insertHospitalSchema = createInsertSchema(hospitals, {
  name: z.string().min(1, "Hospital name is required"),
  code: z.string().min(1, "Hospital code is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
}).omit({ id: true, createdAt: true });

export const updateHospitalSchema = insertHospitalSchema.partial();

// Clinic Sessions
export const insertClinicSessionSchema = createInsertSchema(clinicSessions, {
  hospitalId: z.string(),
  consultantId: z.string(),
  sessionDate: z.string().or(z.date()),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
  maxPatients: z.number().min(1).max(30),
  status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updateClinicSessionSchema = insertClinicSessionSchema.partial();

// Patients
export const insertPatientSchema = createInsertSchema(patients, {
  patientNumber: z.string().min(1, "Patient number is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  age: z.number().min(0).max(150).optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updatePatientSchema = insertPatientSchema.partial();

// Appointments
export const insertAppointmentSchema = createInsertSchema(appointments, {
  clinicSessionId: z.string(),
  patientId: z.string(),
  chiefComplaint: z.string().min(1, "Chief complaint is required"),
  isPriority: z.boolean().optional(),
  bookingNumber: z.number().min(1).max(15).optional(),
  status: z.enum(["booked", "confirmed", "seen", "rescheduled", "cancelled"]).optional(),
  createdBy: z.string(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updateAppointmentSchema = insertAppointmentSchema.partial();

// Clinical Cases
export const insertClinicalCaseSchema = createInsertSchema(clinicalCases, {
  patientId: z.string(),
  consultantId: z.string(),
  diagnosis: z.string().optional(),
  status: z.enum(["active", "closed"]).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updateClinicalCaseSchema = insertClinicalCaseSchema.partial();

// Medical Images
export const insertMedicalImageSchema = createInsertSchema(medicalImages, {
  clinicalCaseId: z.string(),
  imageType: z.enum(["MRI", "CT", "X-Ray", "Ultrasound", "Photo"]),
  imageUrl: z.string().url(),
  uploadedBy: z.string(),
}).omit({ id: true, uploadedAt: true });

// Procedures
export const insertProcedureSchema = createInsertSchema(procedures, {
  clinicalCaseId: z.string(),
  patientId: z.string(),
  hospitalId: z.string(),
  consultantId: z.string(),
  procedureType: z.string().min(1, "Procedure type is required"),
  status: z.enum(["planned", "scheduled", "done", "postponed", "cancelled"]).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updateProcedureSchema = insertProcedureSchema.partial();

// Post-Op Plans
export const insertPostOpPlanSchema = createInsertSchema(postOpPlans, {
  procedureId: z.string(),
  medications: z.string().min(1, "Medications are required"),
  baselineGCS: z.number().min(3).max(15).optional(),
  baselineMotorUR: z.number().min(0).max(5).optional(),
  baselineMotorUL: z.number().min(0).max(5).optional(),
  baselineMotorLR: z.number().min(0).max(5).optional(),
  baselineMotorLL: z.number().min(0).max(5).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updatePostOpPlanSchema = insertPostOpPlanSchema.partial();

// Post-Op Updates
export const insertPostOpUpdateSchema = createInsertSchema(postOpUpdates, {
  procedureId: z.string(),
  updateDate: z.string().or(z.date()),
  dayPostOp: z.number().min(1),
  gcsScore: z.number().min(3).max(15),
  motorUR: z.number().min(0).max(5),
  motorUL: z.number().min(0).max(5),
  motorLR: z.number().min(0).max(5),
  motorLL: z.number().min(0).max(5),
  pulse: z.number().optional(),
  spo2: z.number().min(0).max(100).optional(),
  updatedBy: z.string(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updatePostOpUpdateSchema = insertPostOpUpdateSchema.partial();

// Discharges
export const insertDischargeSchema = createInsertSchema(discharges, {
  procedureId: z.string(),
  patientId: z.string(),
  dischargeDate: z.string().or(z.date()),
  dischargeStatus: z.enum(["stable", "improved", "against_medical_advice", "referred", "other"]),
  finalGCS: z.number().min(3).max(15).optional(),
  finalMotorUR: z.number().min(0).max(5).optional(),
  finalMotorUL: z.number().min(0).max(5).optional(),
  finalMotorLR: z.number().min(0).max(5).optional(),
  finalMotorLL: z.number().min(0).max(5).optional(),
  dischargedBy: z.string(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const updateDischargeSchema = insertDischargeSchema.partial();

// ============================================
// TYPESCRIPT TYPES
// ============================================

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Hospital = typeof hospitals.$inferSelect;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type UpdateHospital = z.infer<typeof updateHospitalSchema>;

export type ClinicSession = typeof clinicSessions.$inferSelect;
export type InsertClinicSession = z.infer<typeof insertClinicSessionSchema>;
export type UpdateClinicSession = z.infer<typeof updateClinicSessionSchema>;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type UpdatePatient = z.infer<typeof updatePatientSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type UpdateAppointment = z.infer<typeof updateAppointmentSchema>;

export type ClinicalCase = typeof clinicalCases.$inferSelect;
export type InsertClinicalCase = z.infer<typeof insertClinicalCaseSchema>;
export type UpdateClinicalCase = z.infer<typeof updateClinicalCaseSchema>;

export type MedicalImage = typeof medicalImages.$inferSelect;
export type InsertMedicalImage = z.infer<typeof insertMedicalImageSchema>;

export type Procedure = typeof procedures.$inferSelect;
export type InsertProcedure = z.infer<typeof insertProcedureSchema>;
export type UpdateProcedure = z.infer<typeof updateProcedureSchema>;

export type PostOpPlan = typeof postOpPlans.$inferSelect;
export type InsertPostOpPlan = z.infer<typeof insertPostOpPlanSchema>;
export type UpdatePostOpPlan = z.infer<typeof updatePostOpPlanSchema>;

export type PostOpUpdate = typeof postOpUpdates.$inferSelect;
export type InsertPostOpUpdate = z.infer<typeof insertPostOpUpdateSchema>;
export type UpdatePostOpUpdate = z.infer<typeof updatePostOpUpdateSchema>;

export type Discharge = typeof discharges.$inferSelect;
export type InsertDischarge = z.infer<typeof insertDischargeSchema>;
export type UpdateDischarge = z.infer<typeof updateDischargeSchema>;
