import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the form schema with validation
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  role: z.enum(["educator", "student", "administrator", "other"]),
});

type FormValues = z.infer<typeof formSchema>;

const WaitlistForm = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "educator",
    },
  });

  const waitlistMutation = useMutation({
    mutationFn: (data: FormValues) => {
      return apiRequest("POST", "/api/waitlist", data);
    },
    onSuccess: () => {
      setFormSubmitted(true);
      toast({
        title: "Success!",
        description: "You've been added to our waitlist.",
      });
    },
    onError: (error) => {
      toast({
        title: "Something went wrong",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    waitlistMutation.mutate(data);
  };

  return (
    <section id="waitlist" className="py-16 md:py-24 bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-1/2 p-8 md:p-12 bg-primary text-white">
              <h2 className="text-3xl font-bold">Join Our Waitlist</h2>
              <p className="mt-4 text-blue-100">Be among the first to experience the future of educational technology. We're launching soon and spaces are limited.</p>
              
              <div className="mt-8 space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <i className="ri-check-line text-white bg-emerald-500 rounded-full p-1"></i>
                  </div>
                  <p className="ml-3 text-blue-100">Early access to all premium features</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <i className="ri-check-line text-white bg-emerald-500 rounded-full p-1"></i>
                  </div>
                  <p className="ml-3 text-blue-100">Dedicated onboarding support</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <i className="ri-check-line text-white bg-emerald-500 rounded-full p-1"></i>
                  </div>
                  <p className="ml-3 text-blue-100">Special founding member pricing</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <i className="ri-check-line text-white bg-emerald-500 rounded-full p-1"></i>
                  </div>
                  <p className="ml-3 text-blue-100">Shape the future of the product with your feedback</p>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 p-8 md:p-12">
              {!formSubmitted ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Role</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="educator">Educator</SelectItem>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="administrator">School Administrator</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        className="w-full bg-emerald-500 hover:bg-emerald-600"
                        disabled={waitlistMutation.isPending}
                      >
                        {waitlistMutation.isPending ? "Submitting..." : "Join Waitlist"}
                      </Button>
                      <p className="mt-2 text-xs text-slate-500 text-center">
                        By joining, you agree to our <a href="#" className="text-primary hover:text-primary/80">Privacy Policy</a> and <a href="#" className="text-primary hover:text-primary/80">Terms of Service</a>.
                      </p>
                    </div>
                  </form>
                </Form>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-check-line text-3xl text-emerald-500"></i>
                  </div>
                  <h3 className="text-xl font-medium text-slate-800">Thank You for Joining!</h3>
                  <p className="mt-2 text-slate-600">You've been added to our waitlist. We'll notify you when EduAI launches.</p>
                  <p className="mt-4 text-sm text-slate-500">Check your email for a confirmation message.</p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WaitlistForm;
