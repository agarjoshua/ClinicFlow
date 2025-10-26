import { supabase } from './supabase';
import type {
  Patient,
  InsertPatient,
  UpdatePatient,
  Diagnosis,
  InsertDiagnosis,
  UpdateDiagnosis,
  Discharge,
  InsertDischarge,
  UpdateDischarge,
} from "@shared/schema";
import { IStorage } from './storage';

export class SupabaseStorage implements IStorage {
  // Patient operations
  async getPatient(id: string): Promise<Patient | undefined> {
    console.log('🔍 SupabaseStorage.getPatient called with id:', id);
    const { data, error } = await supabase
      .from('patients')
      .select()
      .eq('id', id)
      .single();
      
    console.log('📊 getPatient result:', { data, error });
    if (error || !data) return undefined;
    return data as Patient;
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    const { data, error } = await supabase
      .from('patients')
      .select()
      .eq('patient_id', patientId)
      .single();
      
    if (error || !data) return undefined;
    return data as Patient;
  }

  async getAllPatients(): Promise<Patient[]> {
    console.log('🔍 SupabaseStorage.getAllPatients called');
    const { data, error } = await supabase
      .from('patients')
      .select()
      .order('created_at', { ascending: false });
      
    console.log('📊 getAllPatients result:', { 
      dataCount: data?.length, 
      error, 
      firstRecord: data?.[0] 
    });
    if (error) throw error;
    return data as Patient[];
  }

  async getRecentPatients(limit: number): Promise<Patient[]> {
    console.log('🔍 SupabaseStorage.getRecentPatients called with limit:', limit);
    const { data, error } = await supabase
      .from('patients')
      .select()
      .order('created_at', { ascending: false })
      .limit(limit);
      
    console.log('📊 getRecentPatients result:', { 
      dataCount: data?.length, 
      error, 
      firstRecord: data?.[0] 
    });
    if (error) throw error;
    return data as Patient[];
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    console.log('🔍 SupabaseStorage.createPatient called with data:', insertPatient);
    
    // First, get a new sequence number
    const { data: seqData, error: seqError } = await supabase
      .from('patient_sequence')
      .insert({})
      .select('id')
      .single();
      
    console.log('📊 Sequence creation result:', { seqData, seqError });
    if (seqError) throw seqError;
    
    // Generate patient ID
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const patientNumber = String(seqData.id).padStart(3, '0');
    const generatedPatientId = `P-${date}-${patientNumber}`;
    console.log('📊 Generated patient ID:', generatedPatientId);
    
    // Create patient record
    const patientData = {
      ...insertPatient,
      patient_id: generatedPatientId,
    };
    console.log('📊 Inserting patient data:', patientData);
    
    const { data, error } = await supabase
      .from('patients')
      .insert(patientData)
      .select()
      .single();
      
    console.log('📊 Patient creation result:', { data, error });
    if (error) throw error;
    return data as Patient;
  }

  async updatePatient(id: string, updatePatient: UpdatePatient): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .update(updatePatient)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data as Patient;
  }

  async updatePatientStatus(id: string, status: string, dischargeDate?: Date): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .update({ 
        status, 
        discharge_date: dischargeDate 
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data as Patient;
  }

  async deletePatient(id: string): Promise<void> {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }

  // Diagnosis operations
  async getDiagnosis(id: string): Promise<Diagnosis | undefined> {
    const { data, error } = await supabase
      .from('diagnoses')
      .select()
      .eq('id', id)
      .single();
      
    if (error || !data) return undefined;
    return data as Diagnosis;
  }

  async getDiagnosesByPatientId(patientId: string): Promise<Diagnosis[]> {
    const { data, error } = await supabase
      .from('diagnoses')
      .select()
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as Diagnosis[];
  }

  async getAllDiagnoses(): Promise<Diagnosis[]> {
    const { data, error } = await supabase
      .from('diagnoses')
      .select()
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data as Diagnosis[];
  }

  async createDiagnosis(insertDiagnosis: InsertDiagnosis): Promise<Diagnosis> {
    const { data, error } = await supabase
      .from('diagnoses')
      .insert(insertDiagnosis)
      .select()
      .single();
      
    if (error) throw error;
    return data as Diagnosis;
  }

  async updateDiagnosis(id: string, updateDiagnosis: UpdateDiagnosis): Promise<Diagnosis> {
    const { data, error } = await supabase
      .from('diagnoses')
      .update(updateDiagnosis)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data as Diagnosis;
  }

  async deleteDiagnosis(id: string): Promise<void> {
    const { error } = await supabase
      .from('diagnoses')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }

  // Discharge operations
  async getDischarge(id: string): Promise<Discharge | undefined> {
    const { data, error } = await supabase
      .from('discharges')
      .select()
      .eq('id', id)
      .single();
      
    if (error || !data) return undefined;
    return data as Discharge;
  }

  async getDischargesByPatientId(patientId: string): Promise<Discharge[]> {
    const { data, error } = await supabase
      .from('discharges')
      .select()
      .eq('patient_id', patientId)
      .order('discharge_date', { ascending: false });
      
    if (error) throw error;
    return data as Discharge[];
  }

  async getAllDischarges(): Promise<Discharge[]> {
    const { data, error } = await supabase
      .from('discharges')
      .select()
      .order('discharge_date', { ascending: false });
      
    if (error) throw error;
    return data as Discharge[];
  }

  async createDischarge(insertDischarge: InsertDischarge): Promise<Discharge> {
    const { data, error } = await supabase
      .from('discharges')
      .insert(insertDischarge)
      .select()
      .single();
      
    if (error) throw error;
    
    // Update patient status to discharged
    await this.updatePatientStatus(insertDischarge.patientId, "discharged", new Date());
    
    return data as Discharge;
  }

  async updateDischarge(id: string, updateDischarge: UpdateDischarge): Promise<Discharge> {
    const { data, error } = await supabase
      .from('discharges')
      .update(updateDischarge)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data as Discharge;
  }

  async deleteDischarge(id: string): Promise<void> {
    const { error } = await supabase
      .from('discharges')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }
}