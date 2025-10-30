# WaitlistWizard - Functional System Diagram
## AI-Powered Assignment Management System

---

## **🏗️ SYSTEM ARCHITECTURE OVERVIEW**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                WAITLIST WIZARD                                  │
│                        AI-Powered Assignment Management System                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │    BACKEND      │    │   DATABASE      │
│   (React)       │◄──►│   (Node.js)     │◄──►│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  User Interface │    │  AI Processing  │    │  Data Storage   │
│  Components     │    │  & APIs         │    │  & Schema       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## **🔄 DETAILED DATA FLOW DIAGRAM**

### **1. USER AUTHENTICATION FLOW**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │───►│  Frontend   │───►│   Backend   │───►│  Database   │
│  (Browser)  │    │  (Login)    │    │  (Auth)     │    │  (Users)    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Enter       │    │ Send Login  │    │ Validate    │    │ Store User  │
│ Credentials │    │ Request     │    │ Credentials │    │ Session     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       ▲                   ▲                   ▲                   ▲
       │                   │                   │                   │
       └───────────────────┼───────────────────┼───────────────────┘
                           │                   │
                    ┌─────────────┐    ┌─────────────┐
                    │ Dashboard   │    │ Session     │
                    │ Redirect    │    │ Created     │
                    └─────────────┘    └─────────────┘
```

### **2. AI ASSIGNMENT GENERATION FLOW**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Teacher   │───►│  Frontend   │───►│   Backend   │───►│  File       │
│  Uploads    │    │  (Upload)   │    │  (Process)  │    │  Storage    │
│   PDF       │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Select PDF  │    │ File Upload │    │ PDF Text    │    │ Store File  │
│ Material    │    │ Component   │    │ Extraction  │    │ Metadata    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │                   │                   │                   │
       └───────────────────┼───────────────────┼───────────────────┘
                           │                   │
                    ┌─────────────┐    ┌─────────────┐
                    │ AI Question │    │ Store       │
                    │ Generation  │    │ Assignment  │
                    └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐    ┌─────────────┐
                    │ Multiple    │    │ Database    │
                    │ Question    │    │ (Assignments│
                    │ Types       │    │  Table)     │
                    └─────────────┘    └─────────────┘
```

### **3. STUDENT ASSIGNMENT COMPLETION FLOW**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Student   │───►│  Frontend   │───►│   Backend   │───►│  Database   │
│  Completes  │    │  (Submit)   │    │  (Grade)    │    │  (Store)    │
│ Assignment  │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Answer      │    │ Submit      │    │ AI Grading  │    │ Store       │
│ Questions   │    │ Answers     │    │ Algorithm   │    │ Submission  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │                   │                   │                   │
       └───────────────────┼───────────────────┼───────────────────┘
                           │                   │
                    ┌─────────────┐    ┌─────────────┐
                    │ Generate    │    │ Update      │
                    │ Feedback    │    │ Performance │
                    └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐    ┌─────────────┐
                    │ Display     │    │ Analytics   │
                    │ Results     │    │ Dashboard   │
                    └─────────────┘    └─────────────┘
```

---

## **🎯 COMPONENT INTERACTION DIAGRAM**

### **Frontend Components Structure**
```
┌─────────────────────────────────────────────────────────────────┐
│                        REACT APPLICATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │   Landing Page  │    │   Login Page    │    │   Dashboard │  │
│  │                 │    │                 │    │             │  │
│  │ • Hero Section  │    │ • Login Form    │    │ • Teacher   │  │
│  │ • Features      │    │ • Registration  │    │ • Student   │  │
│  │ • Waitlist Form │    │ • Auth State    │    │ • Analytics │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│           │                       │                       │     │
│           ▼                       ▼                       ▼     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    SHARED COMPONENTS                        │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │ │
│  │  │   Navbar    │  │   Footer    │  │   Forms     │         │ │
│  │  │             │  │             │  │             │         │ │
│  │  │ • Navigation│  │ • Links     │  │ • Inputs    │         │ │
│  │  │ • User Menu │  │ • Social    │  │ • Validation│         │ │
│  │  │ • Logo      │  │ • Copyright │  │ • Submit    │         │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### **Backend API Structure**
```
┌─────────────────────────────────────────────────────────────────┐
│                        EXPRESS SERVER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │ Authentication  │    │   Assignment    │    │   Analytics │  │
│  │     Routes      │    │     Routes      │    │    Routes   │  │
│  │                 │    │                 │    │             │  │
│  │ • /api/auth/*   │    │ • /api/assignments│  │ • /api/performance│
│  │ • Login/Logout  │    │ • /api/materials│  │ • /api/analytics│
│  │ • Registration  │    │ • /api/submissions│  │ • /api/reports│
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│           │                       │                       │     │
│           ▼                       ▼                       ▼     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    MIDDLEWARE LAYER                         │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │ │
│  │  │   Auth      │  │   File      │  │   Error     │         │ │
│  │  │ Middleware  │  │   Upload    │  │   Handler   │         │ │
│  │  │             │  │   (Multer)  │  │             │         │ │
│  │  │ • Session   │  │ • PDF       │  │ • Validation│         │ │
│  │  │ • Role Check│  │ • Validation│  │ • Logging   │         │ │
│  │  │ • Security  │  │ • Storage   │  │ • Response  │         │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## **🧠 AI PROCESSING FLOW**

### **Question Generation Algorithm**
```
┌─────────────────────────────────────────────────────────────────┐
│                    AI QUESTION GENERATION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   PDF Text  │───►│ Text        │───►│ Topic       │         │
│  │  Extraction │    │ Analysis    │    │ Extraction  │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│           │                   │                   │             │
│           ▼                   ▼                   ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Content     │    │ Definition  │    │ Process     │         │
│  │ Cleaning    │    │ Extraction  │    │ Analysis    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│           │                   │                   │             │
│           └───────────────────┼───────────────────┘             │
│                               │                                 │
│                               ▼                                 │
│                    ┌─────────────────────────┐                 │
│                    │   Question Generation   │                 │
│                    │                         │                 │
│                    │  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│                    │  │   MCQ   │ │  Short  │ │  Essay  │      │
│                    │  │Questions│ │ Answer  │ │Questions│      │
│                    │  │  40%    │ │  40%    │ │  20%    │      │
│                    │  └─────────┘ └─────────┘ └─────────┘      │
│                    └─────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Auto-Grading Algorithm**
```
┌─────────────────────────────────────────────────────────────────┐
│                      AUTO-GRADING SYSTEM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Student     │───►│ Answer      │───►│ Question    │         │
│  │ Submission  │    │ Processing  │    │ Analysis    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│           │                   │                   │             │
│           ▼                   ▼                   ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Text        │    │ Key Term    │    │ Similarity  │         │
│  │ Cleaning    │    │ Extraction  │    │ Calculation │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│           │                   │                   │             │
│           └───────────────────┼───────────────────┘             │
│                               │                                 │
│                               ▼                                 │
│                    ┌─────────────────────────┐                 │
│                    │     Scoring System      │                 │
│                    │                         │                 │
│                    │  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│                    │  │Accuracy │ │Content  │ │Structure│      │
│                    │  │Score    │ │Coverage │ │Score    │      │
│                    │  │  40%    │ │  40%    │ │  20%    │      │
│                    │  └─────────┘ └─────────┘ └─────────┘      │
│                    └─────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## **📊 DATABASE SCHEMA RELATIONSHIPS**

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE SCHEMA                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │    USERS    │    │  MATERIALS  │    │ASSIGNMENTS  │         │
│  │             │    │             │    │             │         │
│  │ • id (PK)   │    │ • id (PK)   │    │ • id (PK)   │         │
│  │ • username  │    │ • teacherId │    │ • teacherId │         │
│  │ • password  │    │ • title     │    │ • title     │         │
│  │ • name      │    │ • content   │    │ • description│        │
│  │ • email     │    │ • fileType  │    │ • questions │         │
│  │ • role      │    │ • createdAt │    │ • dueDate   │         │
│  │ • createdAt │    └─────────────┘    │ • materialId│         │
│  └─────────────┘            │          └─────────────┘         │
│           │                 │                  │               │
│           │                 │                  │               │
│           │                 ▼                  ▼               │
│           │          ┌─────────────┐    ┌─────────────┐        │
│           │          │  1:Many     │    │  1:Many     │        │
│           │          │ Relationship│    │ Relationship│        │
│           │          └─────────────┘    └─────────────┘        │
│           │                 │                  │               │
│           │                 │                  │               │
│           └─────────────────┼──────────────────┘               │
│                             │                                  │
│                             ▼                                  │
│                    ┌─────────────────────────┐                │
│                    │     SUBMISSIONS         │                │
│                    │                         │                │
│                    │ • id (PK)               │                │
│                    │ • assignmentId (FK)     │                │
│                    │ • studentId (FK)        │                │
│                    │ • answers (JSON)        │                │
│                    │ • feedback (JSON)       │                │
│                    │ • score                 │                │
│                    │ • submittedAt           │                │
│                    │ • evaluatedAt           │                │
│                    └─────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

---

## **🚀 DEPLOYMENT ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRODUCTION ENVIRONMENT                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Client    │    │   Load      │    │   Web       │         │
│  │  Browser    │───►│  Balancer   │───►│  Server     │         │
│  │             │    │             │    │  (Nginx)    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│           │                   │                   │             │
│           │                   │                   ▼             │
│           │                   │          ┌─────────────┐        │
│           │                   │          │   Node.js   │        │
│           │                   │          │ Application │        │
│           │                   │          │             │        │
│           │                   │          │ • Express   │        │
│           │                   │          │ • React     │        │
│           │                   │          │ • API       │        │
│           │                   │          └─────────────┘        │
│           │                   │                   │             │
│           │                   │                   ▼             │
│           │                   │          ┌─────────────┐        │
│           │                   │          │ PostgreSQL  │        │
│           │                   │          │ Database    │        │
│           │                   │          │             │        │
│           │                   │          │ • Users     │        │
│           │                   │          │ • Materials │        │
│           │                   │          │ • Assignments│       │
│           │                   │          │ • Submissions│       │
│           │                   │          └─────────────┘        │
│           │                   │                   │             │
│           │                   │                   ▼             │
│           │                   │          ┌─────────────┐        │
│           │                   │          │ File Storage│        │
│           │                   │          │             │        │
│           │                   │          │ • PDF Files │        │
│           │                   │          │ • Uploads   │        │
│           │                   │          │ • Assets    │        │
│           │                   │          └─────────────┘        │
│           │                   │                                 │
│           └───────────────────┼─────────────────────────────────┘
│                               │
│                               ▼
│                    ┌─────────────────────────┐
│                    │     CDN/Static Files    │
│                    │                         │
│                    │ • React Build           │
│                    │ • CSS/JS Assets         │
│                    │ • Images                │
│                    └─────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

---

## **📈 PERFORMANCE METRICS FLOW**

```
┌─────────────────────────────────────────────────────────────────┐
│                      ANALYTICS PIPELINE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ User        │    │ Event       │    │ Data        │         │
│  │ Actions     │───►│ Collection  │───►│ Processing  │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│           │                   │                   │             │
│           ▼                   ▼                   ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ • Login     │    │ • API Calls │    │ • Aggregation│        │
│  │ • Upload    │    │ • Page Views│    │ • Filtering  │        │
│  │ • Submit    │    │ • Clicks    │    │ • Calculation│        │
│  │ • Complete  │    │ • Time Spent│    │ • Ranking    │        │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│           │                   │                   │             │
│           └───────────────────┼───────────────────┘             │
│                               │                                 │
│                               ▼                                 │
│                    ┌─────────────────────────┐                 │
│                    │     Dashboard Display   │                 │
│                    │                         │                 │
│                    │  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│                    │  │Student  │ │Class    │ │System   │      │
│                    │  │Progress │ │Performance│ │Metrics │      │
│                    │  │Charts   │ │Reports  │ │Stats   │      │
│                    │  └─────────┘ └─────────┘ └─────────┘      │
│                    └─────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## **🔐 SECURITY FLOW**

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Client    │    │   Network   │    │ Application │         │
│  │  Security   │    │  Security   │    │  Security   │         │
│  │             │    │             │    │             │         │
│  │ • HTTPS     │    │ • Firewall  │    │ • Input     │         │
│  │ • CORS      │    │ • Rate Limit│    │   Validation│         │
│  │ • CSP       │    │ • DDoS      │    │ • SQL       │         │
│  │ • XSS       │    │   Protection│    │   Injection │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│           │                   │                   │             │
│           ▼                   ▼                   ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Session     │    │ File        │    │ Data        │         │
│  │ Management  │    │ Upload      │    │ Encryption  │         │
│  │             │    │ Security    │    │             │         │
│  │ • JWT Tokens│    │ • File Type │    │ • Password  │         │
│  │ • Expiry    │    │   Validation│    │   Hashing   │         │
│  │ • Refresh   │    │ • Size Limit│    │ • Sensitive │         │
│  │ • Logout    │    │ • Virus Scan│    │   Data Mask │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## **🎯 KEY INTERACTION POINTS**

### **Teacher Workflow:**
1. **Login** → Teacher Dashboard
2. **Upload PDF** → AI Processing → Question Generation
3. **Review Questions** → Edit/Approve → Publish Assignment
4. **Monitor Submissions** → View Analytics → Generate Reports

### **Student Workflow:**
1. **Login** → Student Dashboard
2. **View Assignments** → Select Assignment → Complete Questions
3. **Submit Answers** → AI Grading → Receive Feedback
4. **View Progress** → Track Performance → Review Analytics

### **System Workflow:**
1. **User Registration** → Role Assignment → Access Control
2. **File Processing** → Content Analysis → AI Generation
3. **Data Collection** → Analytics Processing → Performance Metrics
4. **Feedback Loop** → Continuous Improvement → System Optimization

---

## **📋 TECHNICAL SPECIFICATIONS**

### **Performance Requirements:**
- **Response Time**: < 2 seconds for API calls
- **File Upload**: Support up to 50MB PDF files
- **Concurrent Users**: 100+ simultaneous users
- **AI Processing**: < 30 seconds for question generation
- **Database**: < 100ms query response time

### **Scalability Features:**
- **Horizontal Scaling**: Load balancer ready
- **Database**: Connection pooling and indexing
- **Caching**: React Query for API responses
- **CDN**: Static asset delivery optimization
- **Microservices**: Modular architecture for easy scaling

### **Monitoring & Logging:**
- **API Logging**: Request/response tracking
- **Error Tracking**: Comprehensive error handling
- **Performance Monitoring**: Response time metrics
- **User Analytics**: Behavior tracking and insights
- **System Health**: Database and server monitoring 