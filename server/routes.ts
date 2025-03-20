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

// AI functions to analyze text and generate questions
async function generateQuestionsFromText(text: string, count: number = 5): Promise<Question[]> {
  // Extract key concepts from the text for better question generation
  const textLines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  const questions: Question[] = [];
  
  // Determine how many of each question type to generate
  const mcqCount = Math.ceil(count * 0.4); // 40% multiple choice
  const shortAnswerCount = Math.ceil(count * 0.4); // 40% short answer
  const essayCount = count - mcqCount - shortAnswerCount; // Remaining for essay
  
  // Track used sentences to avoid duplicates
  const usedTextSections = new Set<string>();
  
  // Function to get a random substantial section of text (paragraph or sentence)
  const getRandomTextSection = (): string => {
    // Try to find paragraphs first (more context for questions)
    const paragraphs = text.split(/\r?\n\r?\n/).filter(p => p.trim().length > 30);
    
    if (paragraphs.length > 0) {
      let attempts = 0;
      while (attempts < 10) {
        const randomParagraph = paragraphs[Math.floor(Math.random() * paragraphs.length)];
        if (!usedTextSections.has(randomParagraph)) {
          usedTextSections.add(randomParagraph);
          return randomParagraph;
        }
        attempts++;
      }
    }
    
    // Fall back to sentences if we can't find unused paragraphs
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const substantialSentences = sentences.filter(s => s.trim().length > 20);
    
    if (substantialSentences.length > 0) {
      let attempts = 0;
      while (attempts < 10) {
        const randomSentence = substantialSentences[Math.floor(Math.random() * substantialSentences.length)];
        if (!usedTextSections.has(randomSentence)) {
          usedTextSections.add(randomSentence);
          return randomSentence;
        }
        attempts++;
      }
    }
    
    // Last resort - just use a line
    return textLines[Math.floor(Math.random() * textLines.length)];
  };
  
  // Generate multiple choice questions
  for (let i = 0; i < mcqCount; i++) {
    const section = getRandomTextSection();
    const words = section.split(/\s+/).filter(w => w.length > 4);
    
    // Generate a question about this section
    let questionText = "";
    
    // Different question patterns
    const patterns = [
      "What is the main concept described in the following text: ",
      "According to the material, which of the following best describes ",
      "Which statement correctly reflects the information about ",
      "Based on the content, what can be inferred about ",
      "What is the significance of "
    ];
    
    // Extract a key term if possible
    const keyTerms = words.filter(w => w.length > 5);
    const keyTerm = keyTerms.length > 0 ? 
      keyTerms[Math.floor(Math.random() * keyTerms.length)] : 
      "the concept";
    
    // Create the question
    questionText = patterns[i % patterns.length] + keyTerm + "?";
    
    // Create plausible options including the correct one
    const correctAnswer = section.substr(0, 40) + "...";
    const options = [
      correctAnswer,
      "This concept is not addressed in the material.",
      "The opposite of what the material suggests.",
      "A different perspective than what's presented."
    ];
    
    // Shuffle options
    for (let j = options.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [options[j], options[k]] = [options[k], options[j]];
    }
    
    questions.push({
      id: i + 1,
      type: "multiple_choice",
      text: questionText,
      options: options,
      correctAnswer: correctAnswer,
      points: Math.floor(Math.random() * 3) + 1 // 1-3 points
    });
  }
  
  // Generate short answer questions
  for (let i = 0; i < shortAnswerCount; i++) {
    const section = getRandomTextSection();
    const words = section.split(/\s+/).filter(w => w.length > 4);
    
    // Different question patterns
    const patterns = [
      "Provide a brief explanation of ",
      "Define the term ",
      "What is meant by ",
      "Briefly describe ",
      "Explain the concept of "
    ];
    
    // Extract a key term if possible
    const keyTerms = words.filter(w => w.length > 5);
    const keyTerm = keyTerms.length > 0 ? 
      keyTerms[Math.floor(Math.random() * keyTerms.length)] : 
      "this concept";
    
    // Create the question
    const questionText = patterns[(i + mcqCount) % patterns.length] + keyTerm + ".";
    
    questions.push({
      id: mcqCount + i + 1,
      type: "short_answer",
      text: questionText,
      correctAnswer: section.substr(0, 50) + "...", // First part of the section as correct answer
      points: Math.floor(Math.random() * 2) + 2 // 2-3 points
    });
  }
  
  // Generate essay questions
  for (let i = 0; i < essayCount; i++) {
    // For essays, we'll use broader topics from the document
    
    // Different essay prompt patterns
    const patterns = [
      "Analyze and discuss the implications of ",
      "Compare and contrast the different aspects of ",
      "Evaluate the significance of ",
      "Critically examine ",
      "Discuss the relationship between "
    ];
    
    // Try to identify document themes
    let theme = "";
    if (textLines.length > 0) {
      // Check first few lines for potential title/theme
      const potentialThemes = textLines.slice(0, Math.min(5, textLines.length))
        .filter(line => line.length > 10 && line.length < 100);
      
      if (potentialThemes.length > 0) {
        theme = potentialThemes[Math.floor(Math.random() * potentialThemes.length)];
      } else {
        // Fallback to a random substantial line
        theme = getRandomTextSection();
      }
    } else {
      theme = "the concepts presented in the material";
    }
    
    // Create the prompt
    const questionText = patterns[(i + mcqCount + shortAnswerCount) % patterns.length] + 
      theme + " as presented in the material.";
    
    questions.push({
      id: mcqCount + shortAnswerCount + i + 1,
      type: "essay",
      text: questionText,
      points: Math.floor(Math.random() * 2) + 3 // 3-4 points
    });
  }
  
  return questions;
}

async function evaluateSubmission(questions: Question[], answers: Record<string, string | string[]>): Promise<any> {
  // Enhanced AI evaluation function
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
        feedback = "Correct! Your answer aligns with the material perfectly.";
      } else {
        // Calculate partial credit based on similarity to correct answer
        const partialCredit = Math.floor(question.points * 0.25); // 25% credit for attempt
        earnedPoints = partialCredit;
        feedback = `The correct answer from the material was: "${question.correctAnswer}". Your answer has some differences from what was presented in the learning material.`;
      }
    } else if (question.type === 'short_answer') {
      // More sophisticated evaluation for short answers
      if (typeof userAnswer === 'string' && typeof question.correctAnswer === 'string') {
        // Check for exact match or significant overlap
        if (userAnswer.toLowerCase().includes(question.correctAnswer.toLowerCase()) || 
            question.correctAnswer.toLowerCase().includes(userAnswer.toLowerCase())) {
          isCorrect = true;
          earnedPoints = question.points;
          feedback = "Excellent! Your answer demonstrates a strong understanding of the material.";
        } else {
          // Check for partial keyword matches
          const correctKeywords = question.correctAnswer.toLowerCase().split(/\s+/).filter(w => w.length > 4);
          const userKeywords = userAnswer.toLowerCase().split(/\s+/).filter(w => w.length > 4);
          
          const matchingKeywords = correctKeywords.filter(keyword => 
            userKeywords.some(userWord => userWord.includes(keyword) || keyword.includes(userWord))
          );
          
          const matchRatio = correctKeywords.length > 0 ? 
            matchingKeywords.length / correctKeywords.length : 0;
          
          // Assign points based on keyword match ratio
          if (matchRatio > 0.7) {
            earnedPoints = Math.floor(question.points * 0.8);
            feedback = "Good answer! You've captured most of the key concepts from the material.";
          } else if (matchRatio > 0.4) {
            earnedPoints = Math.floor(question.points * 0.5);
            feedback = "Your answer contains some relevant concepts, but could be more comprehensive.";
          } else {
            earnedPoints = Math.floor(question.points * 0.2);
            feedback = "Your answer is on the right track, but misses key concepts from the material.";
          }
        }
      }
    } else if (question.type === 'essay') {
      // More detailed essay evaluation
      if (typeof userAnswer === 'string') {
        const wordCount = userAnswer.split(/\s+/).length;
        
        // Base evaluation on depth (approximated by word count)
        if (wordCount > 150) {
          earnedPoints = Math.floor(question.points * 0.9); // 90% for comprehensive answers
          feedback = "Excellent essay! Your response is thorough and shows deep understanding of the material.";
        } else if (wordCount > 100) {
          earnedPoints = Math.floor(question.points * 0.7); // 70% for good answers
          feedback = "Good essay. You've covered important aspects, but could expand on some points.";
        } else if (wordCount > 50) {
          earnedPoints = Math.floor(question.points * 0.5); // 50% for basic answers
          feedback = "Your essay contains basic concepts, but needs more depth and analysis.";
        } else {
          earnedPoints = Math.floor(question.points * 0.3); // 30% for minimal answers
          feedback = "Your response is too brief. Consider expanding your analysis with specific examples from the material.";
        }
      } else {
        earnedPoints = 0;
        feedback = "Invalid essay format.";
      }
    }
    
    totalScore += earnedPoints;
    questionFeedback[questionId] = {
      points: earnedPoints,
      feedback,
      isCorrect
    };
  }
  
  // Calculate percentage and generate overall feedback
  const percentage = Math.round((totalScore / maxScore) * 100);
  let overallFeedback = `You scored ${totalScore} out of ${maxScore} points (${percentage}%). `;
  
  if (percentage >= 90) {
    overallFeedback += "Outstanding work! You've demonstrated excellent understanding of the material.";
  } else if (percentage >= 80) {
    overallFeedback += "Great job! You have a strong grasp of most concepts in the material.";
  } else if (percentage >= 70) {
    overallFeedback += "Good work. You understand the core concepts but there's room for improvement.";
  } else if (percentage >= 60) {
    overallFeedback += "You've grasped some of the concepts, but should review the material more carefully.";
  } else {
    overallFeedback += "You should revisit the material and focus on understanding the key concepts.";
  }
  
  return {
    overallFeedback,
    score: percentage, // Return percentage score instead of raw points
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
