import { Schema, model, Document } from 'mongoose';
import { z } from "zod";

// Contact Message Schema
const contactMessageSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const contactMessageZodSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
  createdAt: z.date().optional()
});

export const ContactMessage = model('ContactMessage', contactMessageSchema);

export type ContactMessageDocument = Document & {
  name: string;
  email: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertContactMessage = z.infer<typeof contactMessageZodSchema>; 