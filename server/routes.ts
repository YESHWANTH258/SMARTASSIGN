import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertWaitlistSchema, 
  loginUserSchema, 
  insertUserSchema,
  insertMaterialSchema,
  insertAssignmentSchema,
  insertSubmissionSchema,
  Question
} from "@shared/schema";
import { ZodError } from "zod";
import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Setup multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueFilename = `${uuidv4()}-${file.originalname}`;
      cb(null, uniqueFilename);
    }
  })
});

// Simulated AI functions (to be replaced with actual OpenAI integration)
async function generateQuestionsFromText(text: string, count: number = 5): Promise<Question[]> {
  // This is a placeholder for AI generation - in a real app, we'd call OpenAI here
  const questionTypes = ['multiple_choice', 'short_answer', 'essay'] as const;
  
  const questions: Question[] = [];
  
  for (let i = 0; i < count; i++) {
    const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    
    let question: Question = {
      id: i + 1,
      type,
      text: `Sample question ${i + 1} based on the uploaded content`,
      points: Math.floor(Math.random() * 5) + 1
    };
    
    if (type === 'multiple_choice') {
      question.options = [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ];
      question.correctAnswer = question.options[Math.floor(Math.random() * question.options.length)];
    } else if (type === 'short_answer') {
      question.correctAnswer = "Sample answer";
    }
    
    questions.push(question);
  }
  
  return questions;
}

async function evaluateSubmission(questions: Question[], answers: Record<string, string | string[]>): Promise<any> {
  // This is a placeholder for AI evaluation - in a real app, we'd call OpenAI here
  let totalScore = 0;
  let maxScore = 0;
  const questionFeedback: Record<string, any> = {};
  
  for (const question of questions) {
    const questionId = question.id.toString();
    const userAnswer = answers[questionId];
    maxScore += question.points;
    
    if (!userAnswer) {
      questionFeedback[questionId] = {
        points: 0,
        feedback: "No answer provided",
        isCorrect: false
      };
      continue;
    }
    
    let isCorrect = false;
    let earnedPoints = 0;
    let feedback = "";
    
    if (question.type === 'multiple_choice') {
      if (userAnswer === question.correctAnswer) {
        isCorrect = true;
        earnedPoints = question.points;
        feedback = "Correct answer!";
      } else {
        feedback = `Incorrect. The correct answer was: ${question.correctAnswer}`;
      }
    } else if (question.type === 'short_answer') {
      // Simple string matching for demo purposes
      if (typeof userAnswer === 'string' && 
          typeof question.correctAnswer === 'string' && 
          userAnswer.toLowerCase().includes(question.correctAnswer.toLowerCase())) {
        isCorrect = true;
        earnedPoints = question.points;
        feedback = "Your answer is correct!";
      } else {
        earnedPoints = Math.floor(question.points * 0.3); // Partial credit
        feedback = "Your answer is partially correct. Consider including key terms from the material.";
      }
    } else if (question.type === 'essay') {
      // For essays, we simulate an AI evaluation
      earnedPoints = Math.floor(Math.random() * question.points);
      feedback = "Your essay demonstrates understanding of the core concepts, but could elaborate more on key points.";
    }
    
    totalScore += earnedPoints;
    questionFeedback[questionId] = {
      points: earnedPoints,
      feedback,
      isCorrect
    };
  }
  
  return {
    overallFeedback: `You scored ${totalScore} out of ${maxScore} points (${Math.round((totalScore/maxScore) * 100)}%)`,
    score: totalScore,
    questionFeedback
  };
}

// Authentication middleware
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // For a real app, you'd use proper session-based or token-based auth
  // This is just for demonstration purposes
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    const user = await storage.getUser(Number(userId));
    if (!user) {
      return res.status(401).json({ message: "Invalid user ID" });
    }
    
    // Attach user to request object
    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: "Authentication error" });
  }
};

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
  
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginUserSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user || user.password !== validatedData.password) {
        return res.status(401).json({ 
          message: "Invalid username or password" 
        });
      }
      
      // In a real app, you would use proper authentication (JWT, sessions, etc.)
      return res.status(200).json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid login data", 
          errors: error.errors 
        });
      }
      
      return res.status(500).json({ 
        message: "Login failed. Please try again later." 
      });
    }
  });
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(409).json({ 
          message: "This username is already taken" 
        });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(409).json({ 
          message: "This email is already registered" 
        });
      }
      
      // Create user
      const newUser = await storage.createUser(validatedData);
      
      return res.status(201).json({
        message: "Registration successful",
        user: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid registration data", 
          errors: error.errors 
        });
      }
      
      return res.status(500).json({ 
        message: "Registration failed. Please try again later." 
      });
    }
  });
  
  // Material routes
  app.post("/api/materials", authMiddleware, upload.single('file'), async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Check if user is a teacher
      if (user.role !== 'teacher') {
        return res.status(403).json({ 
          message: "Only teachers can upload materials" 
        });
      }
      
      if (!req.file) {
        return res.status(400).json({ 
          message: "No file uploaded" 
        });
      }
      
      const { title } = req.body;
      if (!title) {
        return res.status(400).json({ 
          message: "Title is required" 
        });
      }
      
      // Read file content (in a real app, you'd process different file types differently)
      const fileContent = fs.readFileSync(req.file.path, 'utf8');
      
      const material = await storage.createMaterial({
        teacherId: user.id,
        title,
        content: fileContent,
        fileType: path.extname(req.file.originalname).substring(1)
      });
      
      return res.status(201).json({
        message: "Material uploaded successfully",
        material
      });
    } catch (error) {
      return res.status(500).json({ 
        message: "Failed to upload material" 
      });
    }
  });
  
  app.get("/api/materials", authMiddleware, async (req, res) => {
    try {
      const user = (req as any).user;
      
      let materials;
      if (user.role === 'teacher') {
        materials = await storage.getMaterialsByTeacher(user.id);
      } else {
        // For students, we could filter by enrolled courses in a real app
        materials = [];
      }
      
      return res.status(200).json(materials);
    } catch (error) {
      return res.status(500).json({ 
        message: "Failed to retrieve materials" 
      });
    }
  });
  
  app.get("/api/materials/:id", authMiddleware, async (req, res) => {
    try {
      const materialId = parseInt(req.params.id);
      const material = await storage.getMaterial(materialId);
      
      if (!material) {
        return res.status(404).json({ 
          message: "Material not found" 
        });
      }
      
      return res.status(200).json(material);
    } catch (error) {
      return res.status(500).json({ 
        message: "Failed to retrieve material" 
      });
    }
  });
  
  // Assignment routes
  app.post("/api/assignments/generate", authMiddleware, async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Check if user is a teacher
      if (user.role !== 'teacher') {
        return res.status(403).json({ 
          message: "Only teachers can generate assignments" 
        });
      }
      
      const { materialId, title, description, questionCount } = req.body;
      
      if (!materialId || !title || !description) {
        return res.status(400).json({ 
          message: "materialId, title, and description are required" 
        });
      }
      
      // Get the material
      const material = await storage.getMaterial(Number(materialId));
      if (!material) {
        return res.status(404).json({ 
          message: "Material not found" 
        });
      }
      
      if (material.teacherId !== user.id) {
        return res.status(403).json({ 
          message: "You can only generate assignments from your own materials" 
        });
      }
      
      // Generate questions
      const questions = await generateQuestionsFromText(material.content, questionCount || 5);
      
      // Create assignment
      const assignment = await storage.createAssignment({
        teacherId: user.id,
        title,
        description,
        questions,
        materialId: material.id,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null
      });
      
      return res.status(201).json({
        message: "Assignment generated successfully",
        assignment
      });
    } catch (error) {
      return res.status(500).json({ 
        message: "Failed to generate assignment" 
      });
    }
  });
  
  app.get("/api/assignments", authMiddleware, async (req, res) => {
    try {
      const user = (req as any).user;
      
      let assignments;
      if (user.role === 'teacher') {
        assignments = await storage.getAssignmentsByTeacher(user.id);
      } else {
        assignments = await storage.getAssignmentsForStudent();
      }
      
      return res.status(200).json(assignments);
    } catch (error) {
      return res.status(500).json({ 
        message: "Failed to retrieve assignments" 
      });
    }
  });
  
  app.get("/api/assignments/:id", authMiddleware, async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const assignment = await storage.getAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ 
          message: "Assignment not found" 
        });
      }
      
      return res.status(200).json(assignment);
    } catch (error) {
      return res.status(500).json({ 
        message: "Failed to retrieve assignment" 
      });
    }
  });
  
  // Submission routes
  app.post("/api/submissions", authMiddleware, async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Check if user is a student
      if (user.role !== 'student') {
        return res.status(403).json({ 
          message: "Only students can submit assignments" 
        });
      }
      
      const { assignmentId, answers } = req.body;
      
      if (!assignmentId || !answers) {
        return res.status(400).json({ 
          message: "assignmentId and answers are required" 
        });
      }
      
      // Get the assignment
      const assignment = await storage.getAssignment(Number(assignmentId));
      if (!assignment) {
        return res.status(404).json({ 
          message: "Assignment not found" 
        });
      }
      
      // Check if the user has already submitted this assignment
      const existingSubmission = await storage.getSubmissionByStudentAndAssignment(user.id, assignment.id);
      if (existingSubmission) {
        return res.status(409).json({ 
          message: "You have already submitted this assignment" 
        });
      }
      
      // Create submission
      const submission = await storage.createSubmission({
        assignmentId: assignment.id,
        studentId: user.id,
        answers
      });
      
      // Evaluate submission
      const feedback = await evaluateSubmission(assignment.questions as Question[], answers);
      
      // Update submission with feedback
      const updatedSubmission = await storage.updateSubmissionFeedback(
        submission.id,
        feedback,
        feedback.score
      );
      
      return res.status(201).json({
        message: "Assignment submitted and evaluated successfully",
        submission: updatedSubmission
      });
    } catch (error) {
      return res.status(500).json({ 
        message: "Failed to submit assignment" 
      });
    }
  });
  
  app.get("/api/submissions", authMiddleware, async (req, res) => {
    try {
      const user = (req as any).user;
      
      let submissions;
      if (user.role === 'teacher') {
        // If assignment ID is provided, get submissions for that assignment
        if (req.query.assignmentId) {
          submissions = await storage.getSubmissionsByAssignment(Number(req.query.assignmentId));
        } else {
          submissions = []; // In a real app, we'd return all submissions for teacher's assignments
        }
      } else {
        submissions = await storage.getSubmissionsByStudent(user.id);
      }
      
      return res.status(200).json(submissions);
    } catch (error) {
      return res.status(500).json({ 
        message: "Failed to retrieve submissions" 
      });
    }
  });
  
  app.get("/api/submissions/:id", authMiddleware, async (req, res) => {
    try {
      const submissionId = parseInt(req.params.id);
      const submission = await storage.getSubmission(submissionId);
      
      if (!submission) {
        return res.status(404).json({ 
          message: "Submission not found" 
        });
      }
      
      const user = (req as any).user;
      
      // Only the student who submitted or the assignment's teacher can view it
      if (user.role === 'student' && submission.studentId !== user.id) {
        return res.status(403).json({
          message: "You can only view your own submissions"
        });
      }
      
      // For a teacher, verify they created the assignment
      if (user.role === 'teacher') {
        const assignment = await storage.getAssignment(submission.assignmentId);
        if (!assignment || assignment.teacherId !== user.id) {
          return res.status(403).json({
            message: "You can only view submissions for your own assignments"
          });
        }
      }
      
      return res.status(200).json(submission);
    } catch (error) {
      return res.status(500).json({ 
        message: "Failed to retrieve submission" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
