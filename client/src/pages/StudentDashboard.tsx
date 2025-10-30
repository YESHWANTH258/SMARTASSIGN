import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { AIAssistant } from "@/components/AIAssistant";

const StudentDashboard = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showPerformanceDialog, setShowPerformanceDialog] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setLocation("/login");
      return;
    }
    
    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== "student") {
        toast({
          title: "Access denied",
          description: "You need a student account to access this page",
          variant: "destructive",
        });
        setLocation("/login");
        return;
      }
      setUser(parsedUser);
    } catch (error) {
      setLocation("/login");
    }
  }, [setLocation, toast]);
  
  // Assignments query
  const assignmentsQuery = useQuery({
    queryKey: ["/api/assignments"],
    queryFn: () => apiRequest("GET", "/api/assignments", null, {
      headers: { "x-user-id": user?.id.toString() }
    }),
    enabled: !!user?.id,
  });
  
  // Submissions query
  const submissionsQuery = useQuery({
    queryKey: ["/api/submissions"],
    queryFn: () => apiRequest("GET", "/api/submissions", null, {
      headers: { "x-user-id": user?.id.toString() }
    }),
    enabled: !!user?.id,
  });
  
  // Submit assignment mutation
  const submitMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest("POST", "/api/submissions", data, {
        headers: { "x-user-id": user?.id.toString() }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Assignment submitted",
        description: "Your assignment has been submitted and evaluated",
      });
      setAssignmentDialogOpen(false);
      setSelectedAssignment(null);
      setAnswers({});
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      
      // Show feedback dialog with submission result
      setSelectedSubmission(data.submission);
      setFeedbackDialogOpen(true);
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit assignment",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmitAssignment = () => {
    // Check if all questions are answered
    if (selectedAssignment) {
      const questions = selectedAssignment.questions;
      const isComplete = questions.every((q: any) => !!answers[q.id]);
      
      if (!isComplete) {
        toast({
          title: "Incomplete submission",
          description: "Please answer all questions before submitting",
          variant: "destructive",
        });
        return;
      }
      
      submitMutation.mutate({
        assignmentId: selectedAssignment.id,
        answers,
      });
    }
  };
  
  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };
  
  const getQuestionComponent = (question: any) => {
    switch (question.type) {
      case "multiple_choice":
        return (
          <RadioGroup
            value={answers[question.id] as string || ""}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            {question.options.map((option: string) => (
              <div className="flex items-center space-x-2" key={option}>
                <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                <Label htmlFor={`${question.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case "short_answer":
        return (
          <Textarea
            placeholder="Your answer..."
            value={answers[question.id] as string || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="resize-none"
          />
        );
      case "essay":
        return (
          <Textarea
            placeholder="Your essay..."
            value={answers[question.id] as string || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="resize-none min-h-32"
          />
        );
      default:
        return <div>Unsupported question type</div>;
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem("user");
    setLocation("/login");
  };
  
  // Check if an assignment is already submitted
  const isAssignmentSubmitted = (assignmentId: number) => {
    if (!submissionsQuery.data) return false;
    return submissionsQuery.data.some((sub: any) => sub.assignmentId === assignmentId);
  };
  
  // Get submission for an assignment
  const getSubmissionForAssignment = (assignmentId: number) => {
    if (!submissionsQuery.data) return null;
    return submissionsQuery.data.find((sub: any) => sub.assignmentId === assignmentId);
  };
  
  // AI Assistant for assignments
  const handleAskAI = async () => {
    if (!aiQuestion.trim()) {
      toast({
        title: "Empty question",
        description: "Please enter your question",
        variant: "destructive",
      });
      return;
    }

    setIsAiLoading(true);
    try {
      const response = await apiRequest("POST", "/api/ai-assist", {
        question: aiQuestion,
        context: selectedAssignment,
        type: "assignment"
      });
      setAiResponse(response.answer);
    } catch (error) {
      toast({
        title: "AI Assistant Error",
        description: "Failed to get AI assistance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Performance Analysis
  const performanceQuery = useQuery({
    queryKey: ["/api/student/performance", user?.id],
    queryFn: () => apiRequest("GET", "/api/student/performance", null, {
      headers: { "x-user-id": user?.id.toString() }
    }),
    enabled: !!user?.id,
  });

  // Class Performance Query
  const classPerformanceQuery = useQuery({
    queryKey: ["/api/class/performance"],
    queryFn: () => apiRequest("GET", "/api/class/performance", null, {
      headers: { "x-user-id": user?.id.toString() }
    }),
    enabled: !!user?.id,
  });
  
  if (!user) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <i className="ri-brain-line text-primary text-3xl mr-2"></i>
              <span className="font-bold text-xl text-slate-800">EduAI</span>
            </div>
            <div className="flex items-center">
              <span className="mr-4">Welcome, {user.name}</span>
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">Student Dashboard</h1>
        
        <Tabs defaultValue="assignments">
          <TabsList className="mb-6">
            <TabsTrigger value="assignments">Available Assignments</TabsTrigger>
            <TabsTrigger value="submissions">My Submissions</TabsTrigger>
            <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="assignments">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800">Available Assignments</h2>
            </div>
            
            {assignmentsQuery.isLoading ? (
              <div className="text-center py-10">Loading assignments...</div>
            ) : assignmentsQuery.isError ? (
              <div className="text-center py-10 text-red-500">
                Error loading assignments: {assignmentsQuery.error.message}
              </div>
            ) : assignmentsQuery.data?.length === 0 ? (
              <Card className="bg-slate-50 border-dashed border-2 border-slate-200">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-slate-100 p-3 mb-4">
                    <i className="ri-file-paper-line text-3xl text-slate-400"></i>
                  </div>
                  <h3 className="text-lg font-medium text-slate-700 mb-1">No assignments available</h3>
                  <p className="text-slate-500 text-center mb-4 max-w-md">
                    There are no assignments available for you at the moment
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignmentsQuery.data.map((assignment: any) => {
                  const isSubmitted = isAssignmentSubmitted(assignment.id);
                  const submission = getSubmissionForAssignment(assignment.id);
                  
                  return (
                    <Card key={assignment.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="truncate">{assignment.title}</CardTitle>
                          {isSubmitted && (
                            <Badge variant="outline" className="ml-2">
                              {submission.score}%
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          {assignment.questions.length} questions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="rounded bg-slate-50 p-3 mb-3 min-h-20 max-h-32 overflow-hidden">
                          <p className="text-sm text-slate-600 line-clamp-5">
                            {assignment.description}
                          </p>
                        </div>
                        <div className="flex items-center text-sm text-slate-500">
                          <i className="ri-calendar-line mr-1"></i>
                          <span>Created on {new Date(assignment.createdAt).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        {isSubmitted ? (
                          <Button 
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setFeedbackDialogOpen(true);
                            }}
                          >
                            <i className="ri-eye-line mr-2"></i>
                            View Feedback
                          </Button>
                        ) : (
                          <Dialog open={assignmentDialogOpen && selectedAssignment?.id === assignment.id} onOpenChange={(open) => {
                            setAssignmentDialogOpen(open);
                            if (!open) {
                              setSelectedAssignment(null);
                              setAnswers({});
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                className="w-full"
                                onClick={() => setSelectedAssignment(assignment)}
                              >
                                <i className="ri-edit-line mr-2"></i>
                                Start Assignment
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{assignment.title}</DialogTitle>
                                <DialogDescription>
                                  {assignment.description}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-6 py-4">
                                {assignment.questions.map((question: any, index: number) => (
                                  <div key={question.id} className="p-4 border rounded-md">
                                    <div className="flex justify-between mb-2">
                                      <h3 className="font-medium">Question {index + 1}</h3>
                                      <Badge variant="outline">{question.points} points</Badge>
                                    </div>
                                    <p className="mb-4">{question.text}</p>
                                    {getQuestionComponent(question)}
                                  </div>
                                ))}
                              </div>
                              
                              <DialogFooter>
                                <Button 
                                  onClick={handleSubmitAssignment}
                                  disabled={submitMutation.isPending}
                                >
                                  {submitMutation.isPending ? "Submitting..." : "Submit Assignment"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="submissions">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800">My Submission History</h2>
            </div>
            
            {submissionsQuery.isLoading ? (
              <div className="text-center py-10">Loading submissions...</div>
            ) : submissionsQuery.isError ? (
              <div className="text-center py-10 text-red-500">
                Error loading submissions: {submissionsQuery.error.message}
              </div>
            ) : submissionsQuery.data?.length === 0 ? (
              <Card className="bg-slate-50 border-dashed border-2 border-slate-200">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-slate-100 p-3 mb-4">
                    <i className="ri-draft-line text-3xl text-slate-400"></i>
                  </div>
                  <h3 className="text-lg font-medium text-slate-700 mb-1">No submissions yet</h3>
                  <p className="text-slate-500 text-center mb-4 max-w-md">
                    You haven't submitted any assignments yet
                  </p>
                  <Button onClick={() => setLocation("#assignments")}>
                    <i className="ri-file-list-line mr-2"></i>
                    Go to Assignments
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Table>
                <TableCaption>Your submission history</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissionsQuery.data.map((submission: any) => {
                    // Find matching assignment
                    const assignment = assignmentsQuery.data?.find(
                      (a: any) => a.id === submission.assignmentId
                    );
                    
                    return (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          {assignment?.title || `Assignment #${submission.assignmentId}`}
                        </TableCell>
                        <TableCell>{new Date(submission.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={submission.score} className="w-20" />
                            <span>{submission.score}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setFeedbackDialogOpen(true);
                            }}
                          >
                            <i className="ri-eye-line mr-1"></i>
                            View Feedback
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TabsContent>
          
          <TabsContent value="performance">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {performanceQuery.data && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Overall Progress</h3>
                        <Progress value={performanceQuery.data.overallProgress} />
                        <p className="text-sm text-gray-500 mt-1">
                          {performanceQuery.data.completedAssignments} of {performanceQuery.data.totalAssignments} assignments completed
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Recent Performance</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Assignment</TableHead>
                              <TableHead>Score</TableHead>
                              <TableHead>Class Average</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {performanceQuery.data.recentAssignments.map((assignment: any) => (
                              <TableRow key={assignment.id}>
                                <TableCell>{assignment.title}</TableCell>
                                <TableCell>{assignment.score}%</TableCell>
                                <TableCell>{assignment.classAverage}%</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Performance Analysis */}
              <AIAssistant 
                mode="performance"
                context={performanceQuery.data}
                placeholder="Ask about your performance trends, areas for improvement, or study recommendations..."
              />

              {/* Class Performance Comparison */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Class Performance Overview</CardTitle>
                  <CardDescription>See how you compare with your classmates</CardDescription>
                </CardHeader>
                <CardContent>
                  {classPerformanceQuery.data && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Overall Score</TableHead>
                          <TableHead>Assignments Completed</TableHead>
                          <TableHead>Progress</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classPerformanceQuery.data.map((student: any) => (
                          <TableRow key={student.id}>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.overallScore}%</TableCell>
                            <TableCell>{student.completedAssignments}</TableCell>
                            <TableCell>
                              <Progress value={student.progress} className="w-[100px]" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assignment Feedback</DialogTitle>
            <DialogDescription>
              View your submission feedback and score
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium">Overall Score</h3>
                  <p className="text-slate-500">
                    {selectedSubmission.feedback?.overallFeedback || `You scored ${selectedSubmission.score}%`}
                  </p>
                </div>
                <div className="text-4xl font-bold text-primary">
                  {selectedSubmission.score}%
                </div>
              </div>
              
              <h3 className="text-lg font-medium">Question Feedback</h3>
              
              <Accordion type="multiple" className="w-full">
                {selectedSubmission.feedback?.questionFeedback && 
                  Object.entries(selectedSubmission.feedback.questionFeedback).map(([questionId, feedback]: [string, any]) => {
                    // Find the corresponding question
                    const assignment = assignmentsQuery.data?.find(
                      (a: any) => a.id === selectedSubmission.assignmentId
                    );
                    
                    const question = assignment?.questions.find(
                      (q: any) => q.id.toString() === questionId
                    );
                    
                    if (!question) return null;
                    
                    return (
                      <AccordionItem key={questionId} value={questionId}>
                        <AccordionTrigger className="flex justify-between items-center">
                          <div className="flex-1 text-left">
                            <span className="mr-2">Question {question.id}</span>
                            <Badge variant={feedback.isCorrect ? "default" : "outline"} className="ml-2">
                              {feedback.points} / {question.points} points
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pt-2">
                            <div>
                              <p className="font-medium">Question:</p>
                              <p className="text-slate-600">{question.text}</p>
                            </div>
                            
                            <div>
                              <p className="font-medium">Your Answer:</p>
                              <p className="text-slate-600">
                                {selectedSubmission.answers[questionId]}
                              </p>
                            </div>
                            
                            {question.correctAnswer && (
                              <div>
                                <p className="font-medium">Correct Answer:</p>
                                <p className="text-slate-600">{question.correctAnswer}</p>
                              </div>
                            )}
                            
                            <div>
                              <p className="font-medium">Feedback:</p>
                              <p className="text-slate-600">{feedback.feedback}</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
              </Accordion>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setFeedbackDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDashboard;