// Storage interface and DatabaseStorage implementation using javascript_database blueprint
import {
  patients,
  diagnoses,
  discharges,
  patientSequence,
  type Patient,
  type InsertPatient,
  type UpdatePatient,
  type Diagnosis,
  type InsertDiagnosis,
  type UpdateDiagnosis,
  type Discharge,
  type InsertDischarge,
  type UpdateDischarge,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Patient operations
  getPatient(id: string): Promise<Patient | undefined>;
  getPatientByPatientId(patientId: string): Promise<Patient | undefined>;
  getAllPatients(): Promise<Patient[]>;
  getRecentPatients(limit: number): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, patient: UpdatePatient): Promise<Patient>;
  updatePatientStatus(id: string, status: string, dischargeDate?: Date): Promise<Patient>;
  deletePatient(id: string): Promise<void>;

  // Diagnosis operations
  getDiagnosis(id: string): Promise<Diagnosis | undefined>;
  getDiagnosesByPatientId(patientId: string): Promise<Diagnosis[]>;
  getAllDiagnoses(): Promise<Diagnosis[]>;
  createDiagnosis(diagnosis: InsertDiagnosis): Promise<Diagnosis>;
  updateDiagnosis(id: string, diagnosis: UpdateDiagnosis): Promise<Diagnosis>;
  deleteDiagnosis(id: string): Promise<void>;

  // Discharge operations
  getDischarge(id: string): Promise<Discharge | undefined>;
  getDischargesByPatientId(patientId: string): Promise<Discharge[]>;
  getAllDischarges(): Promise<Discharge[]>;
  createDischarge(discharge: InsertDischarge): Promise<Discharge>;
  updateDischarge(id: string, discharge: UpdateDischarge): Promise<Discharge>;
  deleteDischarge(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Patient operations
  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient || undefined;
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.patientId, patientId));
    return patient || undefined;
  }

  async getAllPatients(): Promise<Patient[]> {
    return await db.select().from(patients).orderBy(desc(patients.admissionDate));
  }

  async getRecentPatients(limit: number): Promise<Patient[]> {
    return await db.select().from(patients)
      .orderBy(desc(patients.admissionDate))
      .limit(limit);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    // Generate unique patient ID using sequence (e.g., P-20241024-001)
    // This prevents ID collisions even with deletions or concurrent inserts
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    // Insert into sequence to get next unique number
    const [seqRecord] = await db.insert(patientSequence).values({}).returning();
    const patientNumber = String(seqRecord.id).padStart(3, '0');
    const generatedPatientId = `P-${date}-${patientNumber}`;

    const [patient] = await db
      .insert(patients)
      .values({
        ...insertPatient,
        patientId: generatedPatientId,
      })
      .returning();
    return patient;
  }

  async updatePatient(id: string, updatePatient: UpdatePatient): Promise<Patient> {
    const [patient] = await db
      .update(patients)
      .set(updatePatient)
      .where(eq(patients.id, id))
      .returning();
    return patient;
  }

  async updatePatientStatus(id: string, status: string, dischargeDate?: Date): Promise<Patient> {
    const [patient] = await db
      .update(patients)
      .set({ status, dischargeDate })
      .where(eq(patients.id, id))
      .returning();
    return patient;
  }

  async deletePatient(id: string): Promise<void> {
    await db.delete(patients).where(eq(patients.id, id));
  }

  // Diagnosis operations
  async getDiagnosis(id: string): Promise<Diagnosis | undefined> {
  const [diagnosis] = await db.select().from(diagnoses).where(eq(diagnoses.id, id));
    return diagnosis || undefined;
  }

  async getDiagnosesByPatientId(patientId: string): Promise<Diagnosis[]> {
    return await db.select().from(diagnoses)
      .where(eq(diagnoses.patientId, patientId))
      .orderBy(desc(diagnoses.diagnosisDate));
  }

  async getAllDiagnoses(): Promise<Diagnosis[]> {
    return await db.select().from(diagnoses).orderBy(desc(diagnoses.diagnosisDate));
  }

  async createDiagnosis(insertDiagnosis: InsertDiagnosis): Promise<Diagnosis> {
    const [diagnosis] = await db
      .insert(diagnoses)
      .values(insertDiagnosis)
      .returning();
    return diagnosis;
  }

  async updateDiagnosis(id: string, updateDiagnosis: UpdateDiagnosis): Promise<Diagnosis> {
    const [diagnosis] = await db
      .update(diagnoses)
      .set(updateDiagnosis)
      .where(eq(diagnoses.id, id))
      .returning();
    return diagnosis;
  }

  async deleteDiagnosis(id: string): Promise<void> {
    await db.delete(diagnoses).where(eq(diagnoses.id, id));
  }

  // Discharge operations
  async getDischarge(id: string): Promise<Discharge | undefined> {
    const [discharge] = await db.select().from(discharges).where(eq(discharges.id, id));
    return discharge || undefined;
  }

  async getDischargesByPatientId(patientId: string): Promise<Discharge[]> {
    return await db.select().from(discharges)
      .where(eq(discharges.patientId, patientId))
      .orderBy(desc(discharges.dischargeDate));
  }

  async getAllDischarges(): Promise<Discharge[]> {
    return await db.select().from(discharges).orderBy(desc(discharges.dischargeDate));
  }

  async createDischarge(insertDischarge: InsertDischarge): Promise<Discharge> {
    const [discharge] = await db
      .insert(discharges)
      .values(insertDischarge)
      .returning();

    // Update patient status to discharged
    await this.updatePatientStatus(insertDischarge.patientId, "discharged", new Date());

    return discharge;
  }

  async updateDischarge(id: string, updateDischarge: UpdateDischarge): Promise<Discharge> {
    const [discharge] = await db
      .update(discharges)
      .set(updateDischarge)
      .where(eq(discharges.id, id))
      .returning();
    return discharge;
  }

  async deleteDischarge(id: string): Promise<void> {
    await db.delete(discharges).where(eq(discharges.id, id));
  }
}

import { SupabaseStorage } from './supabaseStorage';

// You can switch between DatabaseStorage and SupabaseStorage here
// export const storage = new DatabaseStorage();
export const storage = new SupabaseStorage();
