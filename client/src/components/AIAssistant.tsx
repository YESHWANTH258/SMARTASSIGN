import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AIAssistantProps {
  mode: 'assignment' | 'performance';
  context?: any;
  placeholder?: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ mode, context, placeholder }) => {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast({
        title: "Empty question",
        description: "Please enter your question",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          mode,
          context
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get AI assistance');
      }

      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI assistance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {mode === 'assignment' ? 'Assignment Help Bot' : 'Performance Analysis Assistant'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder={placeholder || (mode === 'assignment' 
            ? "Ask me anything about this assignment..."
            : "Ask me about your performance...")}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="min-h-[100px]"
        />
        <Button 
          onClick={handleAskQuestion} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Thinking...
            </>
          ) : (
            "Ask AI Assistant"
          )}
        </Button>
        {response && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <p className="whitespace-pre-wrap">{response}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 