import fs from 'fs';
import { 
  users, type User, type InsertUser, 
  type WaitlistEntry, type InsertWaitlistEntry,
  type Material, type InsertMaterial,
  type Assignment, type InsertAssignment,
  type Submission, type InsertSubmission
} from "@shared/schema";

// Interface with CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Waitlist entries methods
  createWaitlistEntry(entry: InsertWaitlistEntry): Promise<WaitlistEntry>;
  getWaitlistEntryByEmail(email: string): Promise<WaitlistEntry | undefined>;
  getAllWaitlistEntries(): Promise<WaitlistEntry[]>;
  
  // Material methods
  createMaterial(material: InsertMaterial): Promise<Material>;
  getMaterial(id: number): Promise<Material | undefined>;
  getMaterialsByTeacher(teacherId: number): Promise<Material[]>;
  
  // Assignment methods
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  getAssignment(id: number): Promise<Assignment | undefined>;
  getAssignmentsByTeacher(teacherId: number): Promise<Assignment[]>;
  getAssignmentsForStudent(): Promise<Assignment[]>; // All available assignments
  
  // Submission methods
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmission(id: number): Promise<Submission | undefined>;
  getSubmissionByStudentAndAssignment(studentId: number, assignmentId: number): Promise<Submission | undefined>;
  getSubmissionsByAssignment(assignmentId: number): Promise<Submission[]>;
  getSubmissionsByStudent(studentId: number): Promise<Submission[]>;
  updateSubmissionFeedback(id: number, feedback: any, score: number): Promise<Submission>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private waitlistEntries: Map<number, WaitlistEntry>;
  private materials: Map<number, Material>;
  private assignments: Map<number, Assignment>;
  private submissions: Map<number, Submission>;
  
  currentUserId: number;
  currentWaitlistId: number;
  currentMaterialId: number;
  currentAssignmentId: number;
  currentSubmissionId: number;

  private storageFile = 'db.json';

  constructor() {
    // Load data from file if exists
    try {
      const data = JSON.parse(fs.readFileSync(this.storageFile, 'utf8'));
      this.users = new Map(data.users);
      this.waitlistEntries = new Map(data.waitlistEntries);
      this.materials = new Map(data.materials);
      this.assignments = new Map(data.assignments);
      this.submissions = new Map(data.submissions);
      
      this.currentUserId = data.currentUserId;
      this.currentWaitlistId = data.currentWaitlistId;
      this.currentMaterialId = data.currentMaterialId;
      this.currentAssignmentId = data.currentAssignmentId;
      this.currentSubmissionId = data.currentSubmissionId;
    } catch {
      // Initialize empty if file doesn't exist
      this.users = new Map();
      this.waitlistEntries = new Map();
      this.materials = new Map();
      this.assignments = new Map();
      this.submissions = new Map();
      
      this.currentUserId = 1;
      this.currentWaitlistId = 1;
      this.currentMaterialId = 1;
      this.currentAssignmentId = 1;
      this.currentSubmissionId = 1;
      
      // Create demo users
      this.createInitialUsers();
    }
  }

  private saveToFile() {
    const data = {
      users: Array.from(this.users.entries()),
      waitlistEntries: Array.from(this.waitlistEntries.entries()),
      materials: Array.from(this.materials.entries()),
      assignments: Array.from(this.assignments.entries()),
      submissions: Array.from(this.submissions.entries()),
      currentUserId: this.currentUserId,
      currentWaitlistId: this.currentWaitlistId,
      currentMaterialId: this.currentMaterialId,
      currentAssignmentId: this.currentAssignmentId,
      currentSubmissionId: this.currentSubmissionId
    };
    fs.writeFileSync(this.storageFile, JSON.stringify(data));
  }
  
  private createInitialUsers() {
    // Since this is a non-async function now, we can call createUser directly
    this.users.set(1, {
      id: 1,
      username: "teacher",
      password: "teacher123",
      name: "John Teacher",
      email: "teacher@example.com",
      role: "teacher",
      createdAt: new Date()
    });
    this.currentUserId++;
    
    this.users.set(2, {
      id: 2,
      username: "student",
      password: "student123",
      name: "Jane Student",
      email: "student@example.com",
      role: "student",
      createdAt: new Date()
    });
    this.currentUserId++;
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === role
    );
  }

  // Waitlist Methods
  async createWaitlistEntry(insertEntry: InsertWaitlistEntry): Promise<WaitlistEntry> {
    const id = this.currentWaitlistId++;
    const entry: WaitlistEntry = { 
      ...insertEntry, 
      id, 
      createdAt: new Date() 
    };
    this.waitlistEntries.set(id, entry);
    return entry;
  }

  async getWaitlistEntryByEmail(email: string): Promise<WaitlistEntry | undefined> {
    return Array.from(this.waitlistEntries.values()).find(
      (entry) => entry.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async getAllWaitlistEntries(): Promise<WaitlistEntry[]> {
    return Array.from(this.waitlistEntries.values());
  }
  
  // Material Methods
  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const id = this.currentMaterialId++;
    const material: Material = {
      ...insertMaterial,
      id,
      createdAt: new Date()
    };
    this.materials.set(id, material);
    this.saveToFile();
    return material;
  }
  
  async getMaterial(id: number): Promise<Material | undefined> {
    return this.materials.get(id);
  }
  
  async getMaterialsByTeacher(teacherId: number): Promise<Material[]> {
    return Array.from(this.materials.values()).filter(
      (material) => material.teacherId === teacherId
    );
  }
  
  // Assignment Methods
  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const id = this.currentAssignmentId++;
    const assignment: Assignment = {
      ...insertAssignment,
      id,
      createdAt: new Date(),
      // Ensure null values for nullable fields
      dueDate: insertAssignment.dueDate || null,
      materialId: insertAssignment.materialId || null
    };
    this.assignments.set(id, assignment);
    return assignment;
  }
  
  async getAssignment(id: number): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }
  
  async getAssignmentsByTeacher(teacherId: number): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).filter(
      (assignment) => assignment.teacherId === teacherId
    );
  }
  
  async getAssignmentsForStudent(): Promise<Assignment[]> {
    // In a real app, this would filter based on class/course enrollment
    return Array.from(this.assignments.values());
  }
  
  // Submission Methods
  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = this.currentSubmissionId++;
    const submission: Submission = {
      ...insertSubmission,
      id,
      submittedAt: new Date(),
      evaluatedAt: null,
      feedback: null,
      score: null
    };
    this.submissions.set(id, submission);
    return submission;
  }
  
  async getSubmission(id: number): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }
  
  async getSubmissionByStudentAndAssignment(studentId: number, assignmentId: number): Promise<Submission | undefined> {
    return Array.from(this.submissions.values()).find(
      (submission) => submission.studentId === studentId && submission.assignmentId === assignmentId
    );
  }
  
  async getSubmissionsByAssignment(assignmentId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(
      (submission) => submission.assignmentId === assignmentId
    );
  }
  
  async getSubmissionsByStudent(studentId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(
      (submission) => submission.studentId === studentId
    );
  }
  
  async updateSubmissionFeedback(id: number, feedback: any, score: number): Promise<Submission> {
    const submission = this.submissions.get(id);
    if (!submission) {
      throw new Error("Submission not found");
    }
    
    const updatedSubmission: Submission = {
      ...submission,
      feedback,
      score,
      evaluatedAt: new Date()
    };
    
    this.submissions.set(id, updatedSubmission);
    return updatedSubmission;
  }
}

export const storage = new MemStorage();
