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
import { PDFExtract } from 'pdf.js-extract';

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

// Advanced AI functions to analyze text and generate highly relevant questions
async function generateQuestionsFromText(text: string, count: number = 5): Promise<Question[]> {
  // Process and analyze the text content
  const textContent = preprocessText(text);
  const questions: Question[] = [];
  
  // Extract key topics and concepts from the text
  const topics = extractTopics(textContent);
  const definitions = extractDefinitions(textContent);
  const processes = extractProcesses(textContent);
  const comparisons = extractComparisons(textContent);
  
  // Determine question distribution based on content analysis
  const mcqCount = Math.max(1, Math.ceil(count * 0.4)); // At least 1 MCQ
  const shortAnswerCount = Math.max(1, Math.ceil(count * 0.4)); // At least 1 short answer
  const essayCount = Math.max(1, count - mcqCount - shortAnswerCount); // At least 1 essay if possible
  
  // Generate Multiple Choice Questions - focus on facts and definitions
  const mcQuestions = generateMultipleChoiceQuestions(
    textContent, 
    topics, 
    definitions,
    mcqCount
  );
  questions.push(...mcQuestions);
  
  // Generate Short Answer Questions - focus on processes and explanations
  const shortAnswerQuestions = generateShortAnswerQuestions(
    textContent,
    processes,
    definitions,
    shortAnswerCount
  );
  questions.push(...shortAnswerQuestions);
  
  // Generate Essay Questions - focus on analysis and synthesis
  const essayQuestions = generateEssayQuestions(
    textContent,
    topics,
    comparisons,
    essayCount
  );
  questions.push(...essayQuestions);
  
  // Ensure unique IDs for all questions
  questions.forEach((q, index) => {
    q.id = index + 1;
  });
  
  return questions;
}

// Text preprocessing - clean and structure the text
function preprocessText(text: string): any {
  // Remove extra whitespace and split into sensible units
  const cleanedText = text.replace(/\s+/g, ' ').trim();
  
  // Split into paragraphs
  const paragraphs = cleanedText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 20);
  
  // Extract sentences from each paragraph
  const allSentences: string[] = [];
  paragraphs.forEach(para => {
    const sentences = para.match(/[^.!?]+[.!?]+/g) || [];
    sentences.forEach(s => {
      const cleanSentence = s.trim();
      if (cleanSentence.length > 15) { // Only substantial sentences
        allSentences.push(cleanSentence);
      }
    });
  });
  
  // Identify potential section headings
  const potentialHeadings = text.split('\n')
    .map(line => line.trim())
    .filter(line => 
      line.length > 0 && 
      line.length < 100 && 
      !line.endsWith('.') && 
      (line === line.toUpperCase() || /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(line))
    );
  
  return {
    fullText: cleanedText,
    paragraphs,
    sentences: allSentences,
    potentialHeadings
  };
}

// Extract key topics from the text
function extractTopics(textContent: any): string[] {
  const { paragraphs, potentialHeadings, sentences } = textContent;
  const topics: string[] = [...potentialHeadings];
  
  // Extract nouns and noun phrases as potential topics
  const nounPhrasePattern = /\b[A-Z][a-z]*((\s+(of|in|for|to|with|by|and|or)\s+|\s+)[A-Za-z][a-z]*){0,2}\b/g;
  
  // Get first sentences from paragraphs (often contain topic statements)
  const firstSentences = paragraphs.map(p => {
    const match = p.match(/^[^.!?]+[.!?]+/) || [];
    return match[0] || '';
  }).filter(s => s.length > 0);
  
  // Find repeated terms (frequency analysis for important concepts)
  const wordCounts: Record<string, number> = {};
  const words = textContent.fullText.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  words.forEach((word: string) => {
    if (!/^(and|the|that|this|with|from|have|for|are|not|but|were|when|what|they|their|these|those|then|than)$/.test(word)) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });
  
  // Get top repeated terms
  const topTerms = Object.entries(wordCounts)
    .filter(([_, count]) => (count as number) > 2) // Only terms that appear multiple times
    .sort((a, b) => (b[1] as number) - (a[1] as number)) // Sort by frequency
    .slice(0, 10) // Top 10
    .map(([term, _]) => term);
  
  // Extract noun phrases from first sentences and headings
  const relevantText = [...firstSentences, ...potentialHeadings].join(' ');
  let match;
  while ((match = nounPhrasePattern.exec(relevantText)) !== null) {
    if (match[0].length > 5 && !topics.includes(match[0])) {
      topics.push(match[0]);
    }
  }
  
  // Combine with top terms to create comprehensive topic list
  return [...new Set([...topics, ...topTerms])].slice(0, 15); // Limit to 15 topics
}

// Extract definitions from text
function extractDefinitions(textContent: any): Array<{term: string, definition: string}> {
  const { sentences } = textContent;
  const definitions: Array<{term: string, definition: string}> = [];
  
  // Pattern 1: "X is/are defined as Y", "X is/are Y", "X refers to Y"
  const definitionPatterns = [
    /\b([A-Za-z][A-Za-z\s-]{2,})\s+is\s+defined\s+as\s+([^.]+)/i,
    /\b([A-Za-z][A-Za-z\s-]{2,})\s+refers\s+to\s+([^.]+)/i,
    /\b([A-Za-z][A-Za-z\s-]{2,})\s+means\s+([^.]+)/i,
    /\b([A-Za-z][A-Za-z\s-]{2,})\s+is\s+a\s+([^.]+)/i,
    /\b([A-Za-z][A-Za-z\s-]{2,})\s+is\s+an\s+([^.]+)/i,
    /\b([A-Za-z][A-Za-z\s-]{2,})\s+are\s+([^.]+that)/i
  ];
  
  sentences.forEach(sentence => {
    for (const pattern of definitionPatterns) {
      const match = sentence.match(pattern);
      if (match && match[1] && match[2]) {
        const term = match[1].trim();
        const definition = match[2].trim();
        
        // Only add if term is reasonable length and not a common word
        if (term.length > 3 && !/^(this|that|those|these|they|them|their|there|where|when|what|who|why|how)$/i.test(term)) {
          definitions.push({ term, definition: sentence });
        }
      }
    }
  });
  
  // Pattern 2: Look for sentences with colon definitions
  sentences.forEach(sentence => {
    if (sentence.includes(':')) {
      const parts = sentence.split(':');
      if (parts.length === 2 && parts[0].length < 50) {
        const term = parts[0].trim();
        const definition = parts[1].trim();
        
        // Only add if term is reasonable length and definition is substantial
        if (term.length > 3 && definition.length > 15) {
          definitions.push({ term, definition: sentence });
        }
      }
    }
  });
  
  return definitions;
}

// Extract processes or sequential explanations from text
function extractProcesses(textContent: any): Array<{topic: string, steps: string}> {
  const { paragraphs } = textContent;
  const processes: Array<{topic: string, steps: string}> = [];
  
  // Look for numbered or sequential paragraphs
  const sequentialIndicators = [
    /first.*then.*finally/i,
    /step\s+\d+/i,
    /^\s*\d+\.\s+/m,
    /first.*second.*third/i,
    /initially.*subsequently.*finally/i,
    /begin.*then.*finally/i
  ];
  
  paragraphs.forEach(paragraph => {
    for (const pattern of sequentialIndicators) {
      if (pattern.test(paragraph)) {
        // Extract a likely topic from the first line
        const firstLine = paragraph.split('\n')[0];
        const topic = firstLine.length < 60 ? firstLine : firstLine.substring(0, 50) + '...';
        
        processes.push({
          topic,
          steps: paragraph
        });
        break;
      }
    }
  });
  
  // Also look for paragraphs that contain transition words indicating sequence
  const sequenceWords = ['first', 'second', 'third', 'next', 'then', 'finally', 'lastly', 'subsequently'];
  paragraphs.forEach(paragraph => {
    let sequenceWordCount = 0;
    sequenceWords.forEach(word => {
      if (paragraph.toLowerCase().includes(` ${word} `)) {
        sequenceWordCount++;
      }
    });
    
    if (sequenceWordCount >= 2 && !processes.some(p => p.steps === paragraph)) {
      const firstSentence = paragraph.match(/^[^.!?]+[.!?]+/);
      const topic = firstSentence ? firstSentence[0] : paragraph.substring(0, 50) + '...';
      
      processes.push({
        topic,
        steps: paragraph
      });
    }
  });
  
  return processes;
}

// Extract comparisons and contrasts from text
function extractComparisons(textContent: any): Array<{elements: string[], context: string}> {
  const { paragraphs, sentences } = textContent;
  const comparisons: Array<{elements: string[], context: string}> = [];
  
  // Look for comparison indicators
  const comparisonPatterns = [
    /\b(compared to|in comparison|in contrast|versus|vs\.?|difference between|similarities between|both|while|whereas|unlike)\b/i,
    /\b(advantage|disadvantage|benefit|drawback|pro|con)\b/i,
    /\b(better|worse|more|less|greater|lesser|higher|lower|stronger|weaker)\b.*\b(than)\b/i
  ];
  
  // Check paragraphs for comparison content
  paragraphs.forEach(paragraph => {
    for (const pattern of comparisonPatterns) {
      if (pattern.test(paragraph)) {
        // Try to extract the elements being compared
        const elements: string[] = [];
        
        // Look for "X and Y" or "X vs Y" patterns
        const andPattern = /\b([A-Za-z][A-Za-z\s]{2,})\s+and\s+([A-Za-z][A-Za-z\s]{2,})\b/g;
        const vsPattern = /\b([A-Za-z][A-Za-z\s]{2,})\s+(?:versus|vs\.?)\s+([A-Za-z][A-Za-z\s]{2,})\b/g;
        
        let match;
        while ((match = andPattern.exec(paragraph)) !== null) {
          if (match[1] && match[2]) {
            elements.push(match[1].trim(), match[2].trim());
          }
        }
        
        while ((match = vsPattern.exec(paragraph)) !== null) {
          if (match[1] && match[2]) {
            elements.push(match[1].trim(), match[2].trim());
          }
        }
        
        // If we found elements, add the comparison
        if (elements.length > 0 || paragraph.length < 500) {
          comparisons.push({
            elements: [...new Set(elements)], // Remove duplicates
            context: paragraph
          });
          break; // Found a comparison, move to next paragraph
        }
      }
    }
  });
  
  // Also check individual sentences for shorter comparisons
  sentences.forEach(sentence => {
    for (const pattern of comparisonPatterns) {
      if (pattern.test(sentence) && !comparisons.some(c => c.context.includes(sentence))) {
        const elements: string[] = [];
        
        // Extract potential comparison elements
        const betweenPattern = /\bbetween\s+([A-Za-z][A-Za-z\s]{2,})\s+and\s+([A-Za-z][A-Za-z\s]{2,})\b/i;
        const thanPattern = /\b([A-Za-z][A-Za-z\s]{2,})\s+than\s+([A-Za-z][A-Za-z\s]{2,})\b/i;
        
        let match = sentence.match(betweenPattern);
        if (match && match[1] && match[2]) {
          elements.push(match[1].trim(), match[2].trim());
        }
        
        match = sentence.match(thanPattern);
        if (match && match[1] && match[2]) {
          elements.push(match[1].trim(), match[2].trim());
        }
        
        if (elements.length > 0) {
          comparisons.push({
            elements: [...new Set(elements)],
            context: sentence
          });
        }
      }
    }
  });
  
  return comparisons;
}

// Generate Multiple Choice Questions based on content analysis
function generateMultipleChoiceQuestions(
  textContent: any, 
  topics: string[], 
  definitions: Array<{term: string, definition: string}>,
  count: number
): Question[] {
  const questions: Question[] = [];
  
  // First prioritize definition-based questions (more precise)
  for (let i = 0; i < Math.min(definitions.length, Math.ceil(count * 0.6)); i++) {
    const def = definitions[i];
    
    // Create question text
    const questionPatterns = [
      `What is the definition of ${def.term}?`,
      `Which of the following best describes ${def.term}?`,
      `${def.term} is best defined as:`,
      `According to the material, what does the term ${def.term} mean?`
    ];
    
    const questionText = questionPatterns[i % questionPatterns.length];
    
    // Create correct answer from the definition
    const correctAnswer = def.definition.length > 60 ? 
      def.definition.substring(0, 60) + '...' : 
      def.definition;
    
    // Generate plausible distractors (incorrect options)
    const otherDefinitions = definitions
      .filter(d => d.term !== def.term)
      .map(d => d.definition.length > 60 ? d.definition.substring(0, 60) + '...' : d.definition)
      .slice(0, 3);
    
    // Fallback distractors if not enough other definitions
    const fallbackDistractors = [
      `A concept not related to ${def.term}.`,
      `The opposite of what ${def.term} actually means.`,
      `A different concept from another section of the material.`
    ];
    
    // Combine and limit options
    let options = [correctAnswer];
    
    // Add real distractors first
    options = [...options, ...otherDefinitions];
    
    // Add fallback distractors if needed
    while (options.length < 4) {
      options.push(fallbackDistractors[options.length - 1]);
    }
    
    // Limit to 4 options and shuffle
    options = options.slice(0, 4);
    for (let j = options.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [options[j], options[k]] = [options[k], options[j]];
    }
    
    questions.push({
      id: i + 1, // Will be updated later
      type: "multiple_choice",
      text: questionText,
      options: options,
      correctAnswer: correctAnswer,
      points: 2 // Standard points for definition questions
    });
  }
  
  // Add topic-based questions if needed
  const remainingCount = count - questions.length;
  
  if (remainingCount > 0 && topics.length > 0) {
    const { sentences } = textContent;
    
    // Find sentences containing each topic
    const topicSentences: Record<string, string[]> = {};
    
    topics.forEach(topic => {
      topicSentences[topic] = sentences.filter(s => 
        s.toLowerCase().includes(topic.toLowerCase())
      );
    });
    
    // Generate questions for topics with sufficient context
    const viableTopics = topics.filter(t => topicSentences[t].length > 0);
    
    for (let i = 0; i < Math.min(viableTopics.length, remainingCount); i++) {
      const topic = viableTopics[i];
      const relevantSentences = topicSentences[topic];
      
      // Select a sentence with good content
      const sentence = relevantSentences.find(s => s.length > 30 && s.length < 200) || relevantSentences[0];
      
      // Create question text
      const questionPatterns = [
        `Which of the following statements about ${topic} is correct?`,
        `According to the material, which statement accurately describes ${topic}?`,
        `What does the material state about ${topic}?`,
        `Which of these is true about ${topic} based on the text?`
      ];
      
      const questionText = questionPatterns[i % questionPatterns.length];
      
      // Correct answer is from the text
      const correctAnswer = sentence.length > 60 ? 
        sentence.substring(0, 60) + '...' : 
        sentence;
      
      // Generate incorrect options
      const oppositeStatement = `${topic} is not significant in this context.`;
      const unrelatedStatement = `${topic} is unrelated to the main themes of the material.`;
      const misleadingStatement = `${topic} can only be understood in relation to external factors not covered in the material.`;
      
      const options = [
        correctAnswer,
        oppositeStatement,
        unrelatedStatement,
        misleadingStatement
      ];
      
      // Shuffle options
      for (let j = options.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [options[j], options[k]] = [options[k], options[j]];
      }
      
      questions.push({
        id: questions.length + 1, // Will be updated later
        type: "multiple_choice",
        text: questionText,
        options: options,
        correctAnswer: correctAnswer,
        points: 2 // Standard points for topic questions
      });
    }
  }
  
  return questions.slice(0, count);
}

// Generate Short Answer Questions based on content analysis
function generateShortAnswerQuestions(
  textContent: any,
  processes: Array<{topic: string, steps: string}>,
  definitions: Array<{term: string, definition: string}>,
  count: number
): Question[] {
  const questions: Question[] = [];
  const { sentences, paragraphs } = textContent;
  
  // Generate process-based questions (explain a process/steps)
  for (let i = 0; i < Math.min(processes.length, Math.ceil(count * 0.5)); i++) {
    const process = processes[i];
    
    // Create question text
    const questionPatterns = [
      `Briefly explain the process of ${process.topic}.`,
      `What are the main steps involved in ${process.topic}?`,
      `Describe how ${process.topic} works.`,
      `Summarize the key stages of ${process.topic}.`
    ];
    
    const questionText = questionPatterns[i % questionPatterns.length];
    
    // Extract key steps for expected answer
    const correctAnswer = process.steps.length > 80 ? 
      process.steps.substring(0, 80) + '...' : 
      process.steps;
    
    questions.push({
      id: i + 1, // Will be updated later
      type: "short_answer",
      text: questionText,
      correctAnswer: correctAnswer,
      points: 3 // Higher points for process questions (more complex)
    });
  }
  
  // Add definition explanation questions if needed
  const remainingCount = count - questions.length;
  
  if (remainingCount > 0 && definitions.length > 0) {
    // Use definitions not already used in MCQs
    const usedTerms = new Set(questions.map(q => 
      q.text.match(/of\s+([^.?]+)\./) || q.text.match(/in\s+([^.?]+)\?/)
    ).filter(Boolean).map(m => m![1]));
    
    const unusedDefinitions = definitions.filter(d => !usedTerms.has(d.term));
    
    for (let i = 0; i < Math.min(unusedDefinitions.length, remainingCount); i++) {
      const def = unusedDefinitions[i];
      
      // Create question text
      const questionPatterns = [
        `Explain the concept of ${def.term} in your own words.`,
        `What do we mean by ${def.term} in this context?`,
        `Define ${def.term} and provide a brief explanation.`,
        `Describe what ${def.term} means according to the material.`
      ];
      
      const questionText = questionPatterns[i % questionPatterns.length];
      
      // Expected answer comes from the definition
      const correctAnswer = def.definition;
      
      questions.push({
        id: questions.length + 1, // Will be updated later
        type: "short_answer",
        text: questionText,
        correctAnswer: correctAnswer,
        points: 2 // Standard points for definition explanations
      });
    }
  }
  
  // Add general explanation questions if still needed
  if (questions.length < count && paragraphs.length > 0) {
    const substantialParagraphs = paragraphs.filter(p => p.length > 50 && p.length < 300);
    
    for (let i = 0; i < Math.min(substantialParagraphs.length, count - questions.length); i++) {
      const paragraph = substantialParagraphs[i];
      const firstSentence = paragraph.match(/^[^.!?]+[.!?]+/);
      const topic = firstSentence ? 
        firstSentence[0].replace(/[.!?]+$/, '') : 
        paragraph.substring(0, 30) + '...';
      
      // Create question text
      const questionPatterns = [
        `Briefly explain: ${topic}.`,
        `Summarize what the material says about: ${topic}.`,
        `What information does the text provide about ${topic}?`,
        `Explain the significance of ${topic} according to the material.`
      ];
      
      const questionText = questionPatterns[i % questionPatterns.length];
      
      // Expected answer comes from the paragraph
      const correctAnswer = paragraph.length > 80 ? 
        paragraph.substring(0, 80) + '...' : 
        paragraph;
      
      questions.push({
        id: questions.length + 1, // Will be updated later
        type: "short_answer",
        text: questionText,
        correctAnswer: correctAnswer,
        points: 2 // Standard points
      });
    }
  }
  
  return questions.slice(0, count);
}

// Generate Essay Questions based on content analysis
function generateEssayQuestions(
  textContent: any,
  topics: string[],
  comparisons: Array<{elements: string[], context: string}>,
  count: number
): Question[] {
  const questions: Question[] = [];
  
  // Generate comparison-based essay questions
  for (let i = 0; i < Math.min(comparisons.length, Math.ceil(count * 0.6)); i++) {
    const comparison = comparisons[i];
    let questionText = "";
    
    if (comparison.elements.length >= 2) {
      // Create question text based on explicit elements
      const element1 = comparison.elements[0];
      const element2 = comparison.elements[1];
      
      const questionPatterns = [
        `Compare and contrast ${element1} and ${element2} as presented in the material.`,
        `Analyze the similarities and differences between ${element1} and ${element2}.`,
        `Discuss how ${element1} and ${element2} are related and how they differ.`,
        `Evaluate the relative importance of ${element1} versus ${element2} based on the text.`
      ];
      
      questionText = questionPatterns[i % questionPatterns.length];
    } else {
      // Create question from the comparison context
      const contextTopic = comparison.context.substring(0, 50).replace(/[.!?]+$/, '') + '...';
      
      const questionPatterns = [
        `Analyze the comparison presented regarding ${contextTopic}`,
        `Discuss the contrasting elements in the following context: ${contextTopic}`,
        `Evaluate the relative merits of the different approaches related to ${contextTopic}`,
        `Compare and contrast the different perspectives on ${contextTopic}`
      ];
      
      questionText = questionPatterns[i % questionPatterns.length];
    }
    
    questions.push({
      id: i + 1, // Will be updated later
      type: "essay",
      text: questionText,
      points: 4 // Higher points for comparative analysis
    });
  }
  
  // Add broad topic-based essay questions if needed
  const remainingCount = count - questions.length;
  
  if (remainingCount > 0 && topics.length > 0) {
    const broadTopics = topics.filter(t => t.length > 5);
    
    for (let i = 0; i < Math.min(broadTopics.length, remainingCount); i++) {
      const topic = broadTopics[i];
      
      // Create question text
      const questionPatterns = [
        `Discuss the importance and implications of ${topic} as presented in the material.`,
        `Critically analyze the concept of ${topic} and its relevance to the subject matter.`,
        `Explain the key aspects of ${topic} and how they contribute to our understanding.`,
        `Evaluate how the material presents ${topic} and discuss its significance.`
      ];
      
      const questionText = questionPatterns[i % questionPatterns.length];
      
      questions.push({
        id: questions.length + 1, // Will be updated later
        type: "essay",
        text: questionText,
        points: 3 // Standard points for topic essays
      });
    }
  }
  
  // Add synthesis questions if still needed
  if (questions.length < count) {
    const { potentialHeadings } = textContent;
    const mainThemes = potentialHeadings.length > 1 ? 
      potentialHeadings.slice(0, 2).join(' and ') : 
      (topics.length > 0 ? topics[0] : 'the main themes');
    
    const synthesisPatterns = [
      `Synthesize the key concepts from the material and explain how they relate to ${mainThemes}.`,
      `Discuss how the various elements of ${mainThemes} presented in the material work together as a whole.`,
      `Analyze the relationship between the different components of ${mainThemes} discussed in the text.`,
      `Evaluate the overall significance of ${mainThemes} based on all the information presented.`
    ];
    
    for (let i = 0; i < count - questions.length; i++) {
      questions.push({
        id: questions.length + 1, // Will be updated later
        type: "essay",
        text: synthesisPatterns[i % synthesisPatterns.length],
        points: 5 // Highest points for synthesis
      });
    }
  }
  
  return questions.slice(0, count);
}

async function evaluateSubmission(questions: Question[], answers: Record<string, string | string[]>): Promise<any> {
  // Advanced AI-powered submission evaluation
  let totalScore = 0;
  let maxScore = 0;
  const questionFeedback: Record<string, any> = {};
  
  for (const question of questions) {
    const questionId = question.id.toString();
    const userAnswer = answers[questionId];
    maxScore += question.points;
    
    // Handle unanswered questions
    if (!userAnswer) {
      questionFeedback[questionId] = {
        points: 0,
        feedback: "No answer was provided for this question.",
        isCorrect: false
      };
      continue;
    }
    
    let isCorrect = false;
    let earnedPoints = 0;
    let feedback = "";
    
    // Evaluation based on question type
    if (question.type === 'multiple_choice') {
      // For multiple choice, exact matching is required
      const correctAnswerText = typeof question.correctAnswer === 'string' ? question.correctAnswer : '';
      
      if (userAnswer === correctAnswerText) {
        isCorrect = true;
        earnedPoints = question.points;
        feedback = "Correct! Your answer perfectly matches what's described in the study materials.";
      } else {
        // Calculate partial credit based on textual similarity
        if (typeof userAnswer === 'string' && typeof correctAnswerText === 'string') {
          // Use string similarity for partial credit
          const similarity = calculateTextSimilarity(userAnswer, correctAnswerText);
          
          if (similarity > 0.7) {
            earnedPoints = Math.floor(question.points * 0.5); // 50% credit for very similar answers
            feedback = `Your answer is close, but not exactly correct. The correct answer from the material was: "${correctAnswerText}".`;
          } else if (similarity > 0.3) {
            earnedPoints = Math.floor(question.points * 0.2); // 20% credit for somewhat similar answers
            feedback = `Your answer contains some correct elements, but misses key points. The correct answer was: "${correctAnswerText}".`;
          } else {
            earnedPoints = 0;
            feedback = `Your answer differs from what's presented in the material. The correct answer was: "${correctAnswerText}".`;
          }
        }
      }
    } else if (question.type === 'short_answer') {
      // For short answers, semantic evaluation
      if (typeof userAnswer === 'string' && typeof question.correctAnswer === 'string') {
        const correctAnswerText = question.correctAnswer;
        
        // Calculate content match scores
        const exactMatch = userAnswer.toLowerCase().includes(correctAnswerText.toLowerCase()) || 
                         correctAnswerText.toLowerCase().includes(userAnswer.toLowerCase());
        
        // Extract key terms and concepts
        const keyTerms = extractKeyTerms(correctAnswerText);
        const userTerms = extractKeyTerms(userAnswer);
        
        // Calculate key term match percentage
        const termMatch = calculateTermMatch(keyTerms, userTerms);
        
        // Determine answer correctness and feedback
        if (exactMatch || termMatch > 0.8) {
          isCorrect = true;
          earnedPoints = question.points;
          feedback = "Excellent! Your answer fully captures the concepts from the study materials.";
        } else if (termMatch > 0.6) {
          earnedPoints = Math.floor(question.points * 0.8);
          feedback = "Good answer! You've captured most of the key concepts from the material.";
        } else if (termMatch > 0.4) {
          earnedPoints = Math.floor(question.points * 0.6);
          feedback = "Your answer contains several relevant concepts, but is missing some important points.";
        } else if (termMatch > 0.2) {
          earnedPoints = Math.floor(question.points * 0.3);
          feedback = "Your answer touches on a few relevant ideas, but misses most of the key concepts from the material.";
        } else {
          earnedPoints = Math.floor(question.points * 0.1);
          feedback = "Your answer appears to be off-topic or misses the key concepts from the material.";
        }
        
        // Add specific feedback about missing key terms
        if (termMatch < 1.0 && termMatch > 0.2) {
          const missingTerms = keyTerms.filter(term => 
            !userTerms.some(userTerm => 
              userTerm.includes(term) || term.includes(userTerm)
            )
          );
          
          if (missingTerms.length > 0 && missingTerms.length <= 3) {
            feedback += ` Consider including these concepts: ${missingTerms.join(", ")}.`;
          }
        }
      }
    } else if (question.type === 'essay') {
      // Essay evaluation considers content, depth, and organization
      if (typeof userAnswer === 'string') {
        const essayText = userAnswer;
        const wordCount = essayText.split(/\s+/).length;
        
        // Extract topic-related terms if the question text contains topics
        const questionTopics = extractTopicsFromQuestion(question.text);
        
        // Check if essay addresses the topics
        const topicCoverage = evaluateTopicCoverage(essayText, questionTopics);
        
        // Base points on length, structure, and topic coverage
        let pointsFromLength = 0;
        let depthFeedback = "";
        
        // Length assessment
        if (wordCount > 200) {
          pointsFromLength = question.points * 0.4; // 40% from sufficient length
          depthFeedback = "Your essay has good depth. ";
        } else if (wordCount > 100) {
          pointsFromLength = question.points * 0.3; // 30% from moderate length
          depthFeedback = "Your essay has moderate depth. ";
        } else if (wordCount > 50) {
          pointsFromLength = question.points * 0.15; // 15% from minimal length
          depthFeedback = "Your essay could benefit from more depth. ";
        } else {
          pointsFromLength = question.points * 0.05; // 5% from insufficient length
          depthFeedback = "Your essay is too brief to fully address the topic. ";
        }
        
        // Structure and organization assessment
        const hasIntroduction = evaluateHasIntroduction(essayText);
        const hasConclusion = evaluateHasConclusion(essayText);
        const hasParagraphStructure = evaluateHasParagraphs(essayText);
        
        let structurePoints = 0;
        let structureFeedback = "";
        
        if (hasIntroduction && hasConclusion && hasParagraphStructure) {
          structurePoints = question.points * 0.3; // 30% from good structure
          structureFeedback = "Your essay is well-structured with clear introduction, body, and conclusion. ";
        } else if ((hasIntroduction || hasConclusion) && hasParagraphStructure) {
          structurePoints = question.points * 0.2; // 20% from decent structure
          structureFeedback = "Your essay shows good organization but could be improved with a stronger " + 
                             (hasIntroduction ? "conclusion." : "introduction.");
        } else if (hasParagraphStructure) {
          structurePoints = question.points * 0.1; // 10% from basic structure
          structureFeedback = "Your essay uses paragraphs effectively but needs clearer introduction and conclusion. ";
        } else {
          structureFeedback = "Consider organizing your essay with clear paragraphs, introduction, and conclusion. ";
        }
        
        // Content relevance
        let contentPoints = 0;
        let contentFeedback = "";
        
        if (topicCoverage > 0.8) {
          contentPoints = question.points * 0.3; // 30% from excellent topic coverage
          contentFeedback = "Your essay thoroughly addresses all key aspects of the topic. ";
        } else if (topicCoverage > 0.5) {
          contentPoints = question.points * 0.2; // 20% from good topic coverage
          contentFeedback = "Your essay addresses most aspects of the topic. ";
        } else if (topicCoverage > 0.3) {
          contentPoints = question.points * 0.1; // 10% from partial topic coverage
          contentFeedback = "Your essay addresses some aspects of the topic but misses others. ";
        } else {
          contentFeedback = "Your essay doesn't adequately address the key aspects of the topic. ";
        }
        
        // Combine scores and feedback
        earnedPoints = Math.floor(pointsFromLength + structurePoints + contentPoints);
        feedback = depthFeedback + structureFeedback + contentFeedback;
        
        // Cap at maximum points
        if (earnedPoints > question.points) earnedPoints = question.points;
      } else {
        earnedPoints = 0;
        feedback = "Invalid essay format.";
      }
    }
    
    // Add to total score
    totalScore += earnedPoints;
    questionFeedback[questionId] = {
      points: earnedPoints,
      feedback,
      isCorrect
    };
  }
  
  // Calculate percentage and generate comprehensive overall feedback
  const percentage = Math.round((totalScore / maxScore) * 100);
  let overallFeedback = `You scored ${totalScore} out of ${maxScore} points (${percentage}%). `;
  
  // Categorized feedback based on score
  if (percentage >= 90) {
    overallFeedback += "Outstanding work! You've demonstrated excellent understanding of the material. " +
      "Your answers show comprehensive knowledge of the key concepts and their relationships.";
  } else if (percentage >= 80) {
    overallFeedback += "Great job! You have a strong grasp of most concepts in the material. " +
      "Continue to focus on making connections between related ideas for even deeper understanding.";
  } else if (percentage >= 70) {
    overallFeedback += "Good work. You understand the core concepts but there's room for improvement. " +
      "Try to focus on the details and relationships between different topics in the material.";
  } else if (percentage >= 60) {
    overallFeedback += "You've grasped some of the important concepts, but should review the material more carefully. " +
      "Pay particular attention to definitions and key processes described in the text.";
  } else {
    overallFeedback += "You should revisit the material and focus on understanding the key concepts. " +
      "Take notes on important definitions, processes, and relationships between topics.";
  }
  
  return {
    overallFeedback,
    score: percentage, // Return percentage score
    questionFeedback
  };
}

// Helper functions for evaluating submissions

// Calculate text similarity ratio
function calculateTextSimilarity(text1: string, text2: string): number {
  const t1 = text1.toLowerCase();
  const t2 = text2.toLowerCase();
  
  if (t1 === t2) return 1.0;
  if (t1.length === 0 || t2.length === 0) return 0.0;
  
  // Simple Jaccard similarity of word sets
  const words1 = new Set(t1.split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(t2.split(/\s+/).filter(w => w.length > 3));
  
  if (words1.size === 0 || words2.size === 0) return 0.0;
  
  let intersection = 0;
  for (const word of words1) {
    if (words2.has(word)) intersection++;
  }
  
  return intersection / (words1.size + words2.size - intersection);
}

// Extract key terms from text
function extractKeyTerms(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  // Remove common stop words
  const stopWords = new Set([
    'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but', 
    'his', 'her', 'they', 'from', 'she', 'will', 'been', 'were', 'what', 'when',
    'where', 'how', 'all', 'any', 'both', 'each', 'more', 'some', 'such', 'than'
  ]);
  
  return words.filter(w => !stopWords.has(w));
}

// Calculate the match between term sets
function calculateTermMatch(keyTerms: string[], userTerms: string[]): number {
  if (keyTerms.length === 0) return 0;
  
  let matches = 0;
  for (const keyTerm of keyTerms) {
    if (userTerms.some(userTerm => 
      userTerm.includes(keyTerm) || keyTerm.includes(userTerm)
    )) {
      matches++;
    }
  }
  
  return matches / keyTerms.length;
}

// Extract topics from essay question
function extractTopicsFromQuestion(questionText: string): string[] {
  // Look for topics after certain phrases
  const topicPatterns = [
    /discuss\s+(?:the\s+)?([\w\s]+)(?:\s+and\s+)/i,
    /analyze\s+(?:the\s+)?([\w\s]+)(?:\s+and\s+)/i,
    /compare\s+(?:the\s+)?([\w\s]+)(?:\s+and\s+)/i,
    /evaluate\s+(?:the\s+)?([\w\s]+)(?:\s+as\s+)/i,
    /implications\s+of\s+([\w\s]+)(?:\s+as\s+)/i
  ];
  
  const topics: string[] = [];
  
  for (const pattern of topicPatterns) {
    const match = questionText.match(pattern);
    if (match && match[1]) {
      topics.push(match[1].trim());
    }
  }
  
  // If no topics found with patterns, try extracting nouns
  if (topics.length === 0) {
    const words = questionText.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (/^[A-Z][a-z]{3,}$/.test(word) && i > 0) {
        topics.push(word);
      }
    }
  }
  
  return topics;
}

// Evaluate how well the essay covers the expected topics
function evaluateTopicCoverage(essayText: string, topics: string[]): number {
  if (topics.length === 0) return 0.5; // Default middle value if no topics identified
  
  let matchCount = 0;
  for (const topic of topics) {
    const topicLower = topic.toLowerCase();
    if (essayText.toLowerCase().includes(topicLower)) {
      // For each occurrence, add to the match count
      const regex = new RegExp(topicLower, 'gi');
      const matches = essayText.match(regex);
      matchCount += matches ? matches.length : 0;
    }
  }
  
  // Normalize score between 0 and 1, with diminishing returns after 2 mentions per topic
  const expectedMentions = topics.length * 2;
  return Math.min(1, matchCount / expectedMentions);
}

// Check if the essay has an introduction
function evaluateHasIntroduction(essay: string): boolean {
  const firstParagraph = essay.split(/\n\s*\n/)[0] || '';
  return firstParagraph.length > 30 && 
         !/^(?:first|second|then|also|moreover|furthermore|however)/i.test(firstParagraph);
}

// Check if the essay has a conclusion
function evaluateHasConclusion(essay: string): boolean {
  const paragraphs = essay.split(/\n\s*\n/);
  const lastParagraph = paragraphs[paragraphs.length - 1] || '';
  
  return lastParagraph.length > 30 && 
         /(?:conclusion|in\s+summary|to\s+conclude|in\s+conclusion|therefore|thus|overall|in\s+short)/i.test(lastParagraph);
}

// Check if the essay has reasonable paragraph structure
function evaluateHasParagraphs(essay: string): boolean {
  const paragraphs = essay.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  return paragraphs.length >= 3;
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
      
      // Read file content based on file type
      let fileContent: string;
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      const fileType = fileExtension.substring(1);
      
      // Initialize PDF extractor
      const pdfExtract = new PDFExtract();
      
      // Handle PDF files
      if (fileExtension === '.pdf') {
        try {
          const result = await pdfExtract.extract(req.file.path, {});
          // Combine all page content into a single text
          fileContent = result.pages
            .map(page => page.content.map(item => item.str).join(' '))
            .join('\n\n');
            
          console.log("Successfully extracted text from PDF");
        } catch (pdfError) {
          console.error('Error parsing PDF:', pdfError);
          return res.status(400).json({ 
            message: "Failed to parse PDF file. Please ensure it's a valid PDF with text content." 
          });
        }
      } else {
        // For other file types (text-based)
        try {
          fileContent = fs.readFileSync(req.file.path, 'utf8');
        } catch (readError) {
          console.error('Error reading file:', readError);
          return res.status(400).json({ 
            message: "Failed to read file. Please ensure it's a text-based file or PDF." 
          });
        }
      }
      
      // Check if we successfully extracted content
      if (!fileContent || fileContent.trim().length === 0) {
        return res.status(400).json({ 
          message: "Could not extract text content from the file. Please try a different file." 
        });
      }
      
      const material = await storage.createMaterial({
        teacherId: user.id,
        title,
        content: fileContent,
        fileType
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

  // AI assistance endpoint
  app.post("/api/ai-assist", authMiddleware, async (req, res) => {
    try {
      const { question, mode, context } = req.body;
      const userId = req.headers["x-user-id"];

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Here you would integrate with your preferred AI service (e.g., OpenAI)
      // For now, we'll return mock responses based on the mode
      let response = "";
      
      if (mode === "assignment") {
        response = `Here's how you can approach this ${context.title}:\n\n` +
          "1. First, carefully read through all the questions\n" +
          "2. Break down each question into smaller parts\n" +
          "3. Use the study materials to find relevant information\n" +
          "4. Take your time to formulate clear and complete answers";
      } else if (mode === "performance") {
        const performance = context;
        const overallScore = performance?.overallProgress || 0;
        
        response = `Based on your performance:\n\n` +
          `Your overall progress is ${overallScore}%.\n` +
          "Here are some recommendations:\n" +
          "1. Focus on completing assignments regularly\n" +
          "2. Review feedback from previous submissions\n" +
          "3. Participate in class discussions\n" +
          "4. Don't hesitate to ask for help when needed";
      }

      res.json({ response });
    } catch (error) {
      console.error("AI assist error:", error);
      res.status(500).json({ error: "Failed to get AI assistance" });
    }
  });

  // Student Performance endpoint
  app.get("/api/student/performance", authMiddleware, async (req, res) => {
    try {
      const userId = req.headers["x-user-id"];

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get student's submissions
      const submissions = await storage.getSubmissionsByStudent(Number(userId));
      const assignments = await storage.getAssignmentsForStudent();

      // Calculate performance metrics
      const completedAssignments = submissions.length;
      const totalAssignments = assignments.length;
      const overallProgress = Math.round((completedAssignments / totalAssignments) * 100);

      // Get recent assignments with class averages
      const recentAssignments = await Promise.all(
        submissions.slice(-5).map(async (submission) => {
          const assignment = assignments.find(a => a.id === submission.assignmentId);
          const allSubmissions = await storage.getSubmissionsByAssignment(submission.assignmentId);
          
          const classAverage = Math.round(
            allSubmissions.reduce((sum, s) => sum + s.score, 0) / allSubmissions.length
          );

          return {
            id: submission.id,
            title: assignment?.title || "Unknown Assignment",
            score: submission.score,
            classAverage
          };
        })
      );

      res.json({
        overallProgress,
        completedAssignments,
        totalAssignments,
        recentAssignments
      });
    } catch (error) {
      console.error("Performance fetch error:", error);
      res.status(500).json({ error: "Failed to fetch performance data" });
    }
  });

  // Class Performance endpoint
  app.get("/api/class/performance", authMiddleware, async (req, res) => {
    try {
      const userId = req.headers["x-user-id"];

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get all students and their submissions
      const allUsers = await storage.getAllUsers();
      const students = allUsers.filter(user => user.role === 'student');
      const assignments = await storage.getAssignmentsForStudent();

      const classPerformance = await Promise.all(
        students.map(async (student) => {
          const submissions = await storage.getSubmissionsByStudent(student.id);
          const completedAssignments = submissions.length;
          const totalAssignments = assignments.length;
          
          const overallScore = submissions.length > 0
            ? Math.round(submissions.reduce((sum, sub) => sum + sub.score, 0) / submissions.length)
            : 0;

          const progress = Math.round((completedAssignments / totalAssignments) * 100);

          return {
            id: student.id,
            name: student.name,
            overallScore,
            completedAssignments,
            progress
          };
        })
      );

      // Sort by overall score in descending order
      classPerformance.sort((a, b) => b.overallScore - a.overallScore);

      res.json(classPerformance);
    } catch (error) {
      console.error("Class performance fetch error:", error);
      res.status(500).json({ error: "Failed to fetch class performance data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
