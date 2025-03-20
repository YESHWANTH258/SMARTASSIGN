import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const TeacherDashboard = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setLocation("/login");
      return;
    }
    
    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== "teacher") {
        toast({
          title: "Access denied",
          description: "You need a teacher account to access this page",
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
  
  // Materials query
  const materialsQuery = useQuery({
    queryKey: ["/api/materials"],
    queryFn: () => apiRequest("GET", "/api/materials", null, {
      headers: { "x-user-id": user?.id.toString() }
    }),
    enabled: !!user?.id,
  });
  
  // Assignments query
  const assignmentsQuery = useQuery({
    queryKey: ["/api/assignments"],
    queryFn: () => apiRequest("GET", "/api/assignments", null, {
      headers: { "x-user-id": user?.id.toString() }
    }),
    enabled: !!user?.id,
  });
  
  // Upload material form
  const uploadSchema = z.object({
    title: z.string().min(3, { message: "Title must be at least 3 characters" }),
    file: z.instanceof(FileList).refine(files => files.length > 0, {
      message: "Please select a file",
    }),
  });
  
  type UploadFormValues = z.infer<typeof uploadSchema>;
  
  const uploadForm = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
    },
  });
  
  const uploadMutation = useMutation({
    mutationFn: (data: FormData) => {
      return apiRequest("POST", "/api/materials", data, {
        headers: { 
          "x-user-id": user?.id.toString(),
          // Don't set Content-Type here, it will be set automatically for FormData
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Upload successful",
        description: "Your material has been uploaded",
      });
      uploadForm.reset();
      setUploadDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload material",
        variant: "destructive",
      });
    },
  });
  
  const onUploadSubmit = (data: UploadFormValues) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("file", data.file[0]);
    
    uploadMutation.mutate(formData);
  };
  
  // Generate assignment form
  const generateSchema = z.object({
    title: z.string().min(3, { message: "Title must be at least 3 characters" }),
    description: z.string().min(10, { message: "Description must be at least 10 characters" }),
    questionCount: z.coerce.number().int().min(1).max(20),
  });
  
  type GenerateFormValues = z.infer<typeof generateSchema>;
  
  const generateForm = useForm<GenerateFormValues>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      title: "",
      description: "",
      questionCount: 5,
    },
  });
  
  const generateMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest("POST", "/api/assignments/generate", {
        ...data,
        materialId: selectedMaterial.id,
      }, {
        headers: { "x-user-id": user?.id.toString() }
      });
    },
    onSuccess: () => {
      toast({
        title: "Assignment generated",
        description: "Your assignment has been generated successfully",
      });
      generateForm.reset();
      setGenerateDialogOpen(false);
      setSelectedMaterial(null);
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate assignment",
        variant: "destructive",
      });
    },
  });
  
  const onGenerateSubmit = (data: GenerateFormValues) => {
    generateMutation.mutate(data);
  };
  
  const handleLogout = () => {
    localStorage.removeItem("user");
    setLocation("/login");
  };
  
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
        <h1 className="text-3xl font-bold text-slate-800 mb-8">Teacher Dashboard</h1>
        
        <Tabs defaultValue="materials">
          <TabsList className="mb-6">
            <TabsTrigger value="materials">Teaching Materials</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="materials">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800">My Materials</h2>
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <i className="ri-add-line mr-2"></i>
                    Upload Material
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Teaching Material</DialogTitle>
                    <DialogDescription>
                      Upload documents that will be used for generating AI-powered assignments.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...uploadForm}>
                    <form onSubmit={uploadForm.handleSubmit(onUploadSubmit)} className="space-y-4">
                      <FormField
                        control={uploadForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter a title for your material" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={uploadForm.control}
                        name="file"
                        render={({ field: { onChange, value, ...rest } }) => (
                          <FormItem>
                            <FormLabel>Document</FormLabel>
                            <FormControl>
                              <Input 
                                type="file" 
                                onChange={(e) => onChange(e.target.files)}
                                {...rest}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button 
                          type="submit" 
                          disabled={uploadMutation.isPending}
                        >
                          {uploadMutation.isPending ? "Uploading..." : "Upload"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
            {materialsQuery.isLoading ? (
              <div className="text-center py-10">Loading materials...</div>
            ) : materialsQuery.isError ? (
              <div className="text-center py-10 text-red-500">
                Error loading materials: {materialsQuery.error.message}
              </div>
            ) : materialsQuery.data?.length === 0 ? (
              <Card className="bg-slate-50 border-dashed border-2 border-slate-200">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-slate-100 p-3 mb-4">
                    <i className="ri-file-list-line text-3xl text-slate-400"></i>
                  </div>
                  <h3 className="text-lg font-medium text-slate-700 mb-1">No materials yet</h3>
                  <p className="text-slate-500 text-center mb-4 max-w-md">
                    Upload your first teaching material to start generating AI assignments
                  </p>
                  <Button onClick={() => setUploadDialogOpen(true)}>
                    <i className="ri-add-line mr-2"></i>
                    Upload Material
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {materialsQuery.data.map((material: any) => (
                  <Card key={material.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="truncate">{material.title}</CardTitle>
                      <CardDescription>
                        Uploaded on {new Date(material.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="rounded bg-slate-50 p-3 mb-3 min-h-20 max-h-32 overflow-hidden">
                        <p className="text-sm text-slate-600 line-clamp-5">
                          {material.content.substring(0, 300)}...
                        </p>
                      </div>
                      <div className="flex items-center text-sm text-slate-500">
                        <i className="ri-file-text-line mr-1"></i>
                        <span>{material.fileType.toUpperCase()} Document</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Dialog open={generateDialogOpen && selectedMaterial?.id === material.id} onOpenChange={(open) => {
                        setGenerateDialogOpen(open);
                        if (!open) setSelectedMaterial(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full"
                            onClick={() => setSelectedMaterial(material)}
                          >
                            <i className="ri-magic-line mr-2"></i>
                            Generate Assignment
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Generate Assignment</DialogTitle>
                            <DialogDescription>
                              Create an AI-generated assignment based on "{material.title}"
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Form {...generateForm}>
                            <form onSubmit={generateForm.handleSubmit(onGenerateSubmit)} className="space-y-4">
                              <FormField
                                control={generateForm.control}
                                name="title"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Assignment Title</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter a title for your assignment" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={generateForm.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Instructions for students..."
                                        className="resize-none min-h-32"
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={generateForm.control}
                                name="questionCount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Number of Questions</FormLabel>
                                    <FormControl>
                                      <Input type="number" min={1} max={20} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <DialogFooter>
                                <Button 
                                  type="submit" 
                                  disabled={generateMutation.isPending}
                                >
                                  {generateMutation.isPending ? "Generating..." : "Generate Assignment"}
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="assignments">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800">My Assignments</h2>
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
                  <h3 className="text-lg font-medium text-slate-700 mb-1">No assignments yet</h3>
                  <p className="text-slate-500 text-center mb-4 max-w-md">
                    Generate your first assignment from your teaching materials
                  </p>
                  <Button onClick={() => setLocation("#materials")}>
                    <i className="ri-file-list-line mr-2"></i>
                    Go to Materials
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Table>
                <TableCaption>List of your assignments</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Date Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignmentsQuery.data.map((assignment: any) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {assignment.title}
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{assignment.description}</p>
                      </TableCell>
                      <TableCell>{(assignment.questions as any[]).length} questions</TableCell>
                      <TableCell>{new Date(assignment.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          <i className="ri-eye-line mr-1"></i>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeacherDashboard;