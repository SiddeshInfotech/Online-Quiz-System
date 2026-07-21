// ─── Category Tabs ──────────────────────────────────────────────────────────
// Pinned (visible as chips): All, C, Java, Python, JavaScript, React
// Overflow (inside "More" dropdown): everything else
export const categories = [
  { id: "all",               label: "All Categories" },
  // ── Pinned ──────────────────────────────────────────────────────────────
  { id: "c",                 label: "C" },
  { id: "java",              label: "Java" },
  { id: "python",            label: "Python" },
  { id: "javascript",        label: "JavaScript" },
  { id: "react",             label: "React" },
  // ── Overflow (shown in "More" dropdown) ─────────────────────────────────
  { id: "cpp",               label: "C++" },
  { id: "csharp",            label: "C#" },
  { id: "typescript",        label: "TypeScript" },
  { id: "html",              label: "HTML" },
  { id: "css",               label: "CSS" },
  { id: "nodejs",            label: "Node.js" },
  { id: "expressjs",         label: "Express.js" },
  { id: "django",            label: "Django" },
  { id: "flask",             label: "Flask" },
  { id: "springboot",        label: "Spring Boot" },
  { id: "sql",               label: "SQL" },
  { id: "mongodb",           label: "MongoDB" },
  { id: "postgresql",        label: "PostgreSQL" },
  { id: "git",               label: "Git" },
  { id: "github",            label: "GitHub" },
  { id: "dsa",               label: "Data Structures" },
  { id: "algorithms",        label: "Algorithms" },
  { id: "oop",               label: "OOP" },
  { id: "dbms",              label: "DBMS" },
  { id: "os",                label: "Operating Systems" },
  { id: "cn",                label: "Computer Networks" },
  { id: "ai",                label: "AI" },
  { id: "ml",                label: "ML" },
  { id: "cybersecurity",     label: "Cyber Security" },
  { id: "cloud",             label: "Cloud Computing" },
];

// ─── Filter Options ──────────────────────────────────────────────────────────
export const subjectOptions = [
  "All Subjects",
  "C",
  "C++",
  "Java",
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Express.js",
  "HTML",
  "CSS",
  "SQL",
  "MongoDB",
  "PostgreSQL",
  "Django",
  "Flask",
  "Spring Boot",
  "Git",
  "GitHub",
  "Data Structures",
  "Algorithms",
  "OOP",
  "DBMS",
  "Operating Systems",
  "Computer Networks",
  "Software Engineering",
  "System Design",
  "AWS",
  "Docker",
  "Kubernetes",
  "GraphQL",
  "Next.js",
  "Tailwind CSS",
  "Ruby",
  "Go",
  "Rust",
  "Swift",
  "Kotlin",
  "PHP",
];

export const difficultyOptions = [
  "All Difficulty",
  "Easy",
  "Medium",
  "Hard",
];

export const statusOptions = [
  "All Status",
  "Not Started",
  "In Progress",
  "Completed",
];

export const quizModeOptions = [
  "All Modes",
  "Practice",
  "Timed",
  "Theory",
  "Coding",
];

// ─── AI Recommended Quizzes (horizontal carousel) ────────────────────────────
export const recommendedQuizzes = [
  {
    id: "r1",
    title: "The Solar System",
    subject: "Science",
    classLevel: "Class 8",
    questions: 20,
    duration: 15,
    progress: 65,
    thumbnail:
      "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&q=80",
  },
  {
    id: "r2",
    title: "Linear Equations",
    subject: "Mathematics",
    classLevel: "Class 9",
    questions: 15,
    duration: 12,
    progress: 40,
    thumbnail:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80",
  },
  {
    id: "r3",
    title: "Cell Structure",
    subject: "Biology",
    classLevel: "Class 9",
    questions: 18,
    duration: 14,
    progress: 20,
    thumbnail:
      "https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?w=400&q=80",
  },
  {
    id: "r4",
    title: "Indian Freedom Struggle",
    subject: "History",
    classLevel: "Class 10",
    questions: 25,
    duration: 18,
    progress: 0,
    thumbnail:
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&q=80",
  },
  {
    id: "r5",
    title: "Laws of Motion",
    subject: "Physics",
    classLevel: "Class 11",
    questions: 22,
    duration: 20,
    progress: 0,
    thumbnail:
      "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&q=80",
  },
];

// ─── AI Recommended (right panel compact list) ──────────────────────────────
export const aiRecommendedList = [
  {
    id: "ai1",
    title: "Motion and Force",
    subject: "Physics",
    classLevel: "Class 9",
    match: 85,
    gradient: "from-violet-500 to-indigo-600",
  },
  {
    id: "ai2",
    title: "Algebra Basics",
    subject: "Mathematics",
    classLevel: "Class 8",
    match: 80,
    gradient: "from-blue-500 to-sky-600",
  },
  {
    id: "ai3",
    title: "Chemical Bonding",
    subject: "Chemistry",
    classLevel: "Class 11",
    match: 78,
    gradient: "from-teal-500 to-emerald-600",
  },
  {
    id: "ai4",
    title: "Life Processes",
    subject: "Biology",
    classLevel: "Class 10",
    match: 75,
    gradient: "from-green-500 to-lime-600",
  },
];

// ─── All Quizzes Grid ────────────────────────────────────────────────────────
export const allQuizzes = [
  {
    id: "q1",
    title: "Electricity & Circuits",
    subject: "Physics",
    classLevel: "Class 10",
    questions: 20,
    duration: 15,
    difficulty: "Medium",
    progress: 75,
    subjectColor: "bg-violet-100 text-violet-700",
    thumbnail:
      "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&q=80",
  },
  {
    id: "q2",
    title: "Photosynthesis in Plants",
    subject: "Biology",
    classLevel: "Class 10",
    questions: 15,
    duration: 12,
    difficulty: "Easy",
    progress: 100,
    subjectColor: "bg-emerald-100 text-emerald-700",
    thumbnail:
      "https://images.unsplash.com/photo-1508349937151-22b68b72d5b4?w=400&q=80",
  },
  {
    id: "q3",
    title: "Quadratic Equations",
    subject: "Mathematics",
    classLevel: "Class 10",
    questions: 16,
    duration: 14,
    difficulty: "Medium",
    progress: 60,
    subjectColor: "bg-blue-100 text-blue-700",
    thumbnail:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80",
  },
  {
    id: "q4",
    title: "Ancient Civilizations",
    subject: "History",
    classLevel: "Class 6",
    questions: 20,
    duration: 16,
    difficulty: "Easy",
    progress: 30,
    subjectColor: "bg-amber-100 text-amber-700",
    thumbnail:
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&q=80",
  },
  {
    id: "q5",
    title: "Chemical Bonding",
    subject: "Chemistry",
    classLevel: "Class 11",
    questions: 18,
    duration: 15,
    difficulty: "Hard",
    progress: 0,
    subjectColor: "bg-red-100 text-red-700",
    thumbnail:
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&q=80",
  },
  {
    id: "q6",
    title: "The Solar System",
    subject: "Science",
    classLevel: "Class 8",
    questions: 20,
    duration: 15,
    difficulty: "Medium",
    progress: 65,
    subjectColor: "bg-indigo-100 text-indigo-700",
    thumbnail:
      "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&q=80",
  },
  {
    id: "q7",
    title: "Shakespearean Literature",
    subject: "English",
    classLevel: "Class 12",
    questions: 12,
    duration: 10,
    difficulty: "Hard",
    progress: 0,
    subjectColor: "bg-pink-100 text-pink-700",
    thumbnail:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80",
  },
  {
    id: "q8",
    title: "Data Structures Basics",
    subject: "Computer",
    classLevel: "Class 11",
    questions: 25,
    duration: 20,
    difficulty: "Medium",
    progress: 10,
    subjectColor: "bg-cyan-100 text-cyan-700",
    thumbnail:
      "https://images.unsplash.com/photo-1555066931-4365d14431b4?w=400&q=80",
  },
];

export const sortOptions = [
  "Newest",
  "Oldest",
  "Most Popular",
  "Difficulty: Easy",
  "Difficulty: Hard",
];

export const ITEMS_PER_PAGE = 8;
export const TOTAL_PAGES = 10;
