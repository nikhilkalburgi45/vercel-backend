import express from "express";
import { createServer } from "http";
import { ContactMessage, contactMessageZodSchema } from "./models/schema";

export async function registerRoutes(app: express.Application) {
  const server = createServer(app);

  // Contact message routes
  app.post("/api/contact", async (req, res) => {
    try {
      // Validate the request body using Zod schema
      const validatedData = contactMessageZodSchema.parse({
        ...req.body,
        createdAt: new Date()
      });

      // Create and save the message
      const message = new ContactMessage(validatedData);
      await message.save();

      res.status(201).json({ 
        success: true,
        message: "Message sent successfully",
        data: message 
      });
    } catch (error: any) {
      console.error('Contact form error:', error);
      
      // Handle validation errors
      if (error.errors) {
        return res.status(400).json({ 
          success: false,
          message: "Validation error",
          errors: error.errors 
        });
      }

      // Handle other errors
      res.status(500).json({ 
        success: false,
        message: "Failed to send message. Please try again.",
        error: error.message 
      });
    }
  });

  app.get("/api/contact", async (req, res) => {
    try {
      const messages = await ContactMessage.find();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching messages", error });
    }
  });

  return server;
}
