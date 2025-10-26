import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertPatientSchema,
  updatePatientSchema,
  insertDiagnosisSchema,
  updateDiagnosisSchema,
  insertDischargeSchema,
  updateDischargeSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Patient routes
  app.get("/api/patients", async (req, res) => {
    console.log('🚀 API GET /api/patients called');
    try {
      const patients = await storage.getAllPatients();
      console.log('✅ Successfully got patients, count:', patients.length);
      res.json(patients);
    } catch (error: any) {
      console.error('❌ Error in GET /api/patients:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/patients/recent", async (req, res) => {
    console.log('🚀 API GET /api/patients/recent called');
    try {
      const patients = await storage.getRecentPatients(5);
      console.log('✅ Successfully got recent patients, count:', patients.length);
      res.json(patients);
    } catch (error: any) {
      console.error('❌ Error in GET /api/patients/recent:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/patients", async (req, res) => {
    console.log('🚀 API POST /api/patients called with body:', req.body);
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      console.log('✅ Data validation successful:', validatedData);
      const patient = await storage.createPatient(validatedData);
      console.log('✅ Patient created successfully:', patient.id);
      res.status(201).json(patient);
    } catch (error: any) {
      console.error('❌ Error in POST /api/patients:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/patients/:id", async (req, res) => {
    try {
      const validatedData = updatePatientSchema.parse(req.body);
      const patient = await storage.updatePatient(req.params.id, validatedData);
      res.json(patient);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/patients/:id", async (req, res) => {
    try {
      await storage.deletePatient(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Diagnosis routes
  app.get("/api/diagnoses", async (req, res) => {
    try {
      const diagnoses = await storage.getAllDiagnoses();
      res.json(diagnoses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/diagnoses/:patientId", async (req, res) => {
    try {
      const diagnoses = await storage.getDiagnosesByPatientId(req.params.patientId);
      res.json(diagnoses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/diagnoses", async (req, res) => {
    try {
      const validatedData = insertDiagnosisSchema.parse(req.body);
      const diagnosis = await storage.createDiagnosis(validatedData);
      res.status(201).json(diagnosis);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/diagnoses/:id", async (req, res) => {
    try {
      const validatedData = updateDiagnosisSchema.parse(req.body);
      const diagnosis = await storage.updateDiagnosis(req.params.id, validatedData);
      res.json(diagnosis);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/diagnoses/:id", async (req, res) => {
    try {
      await storage.deleteDiagnosis(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Discharge routes
  app.get("/api/discharges", async (req, res) => {
    try {
      const discharges = await storage.getAllDischarges();
      res.json(discharges);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/discharges/:patientId", async (req, res) => {
    try {
      const discharges = await storage.getDischargesByPatientId(req.params.patientId);
      res.json(discharges);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/discharges", async (req, res) => {
    try {
      const validatedData = insertDischargeSchema.parse(req.body);
      const discharge = await storage.createDischarge(validatedData);
      res.status(201).json(discharge);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/discharges/:id", async (req, res) => {
    try {
      const validatedData = updateDischargeSchema.parse(req.body);
      const discharge = await storage.updateDischarge(req.params.id, validatedData);
      res.json(discharge);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/discharges/:id", async (req, res) => {
    try {
      await storage.deleteDischarge(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
