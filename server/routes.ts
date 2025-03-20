import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWaitlistSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Waitlist API endpoint
  app.post("/api/waitlist", async (req, res) => {
    try {
      // Validate the request body
      const validatedData = insertWaitlistSchema.parse(req.body);
      
      // Check if email already exists in waitlist
      const existingEntry = await storage.getWaitlistEntryByEmail(validatedData.email);
      if (existingEntry) {
        return res.status(409).json({ 
          message: "This email is already registered in our waitlist." 
        });
      }
      
      // Create waitlist entry
      const newEntry = await storage.createWaitlistEntry(validatedData);
      
      // Return success response
      return res.status(201).json({
        message: "Successfully added to waitlist",
        entry: newEntry
      });
    } catch (error) {
      // Handle validation errors
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid form data", 
          errors: error.errors 
        });
      }
      
      // Handle other errors
      return res.status(500).json({ 
        message: "Failed to add to waitlist. Please try again later." 
      });
    }
  });

  // Get waitlist entries (protected endpoint for admin use only in a real application)
  app.get("/api/waitlist", async (req, res) => {
    try {
      const entries = await storage.getAllWaitlistEntries();
      return res.status(200).json(entries);
    } catch (error) {
      return res.status(500).json({ 
        message: "Failed to retrieve waitlist entries." 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
