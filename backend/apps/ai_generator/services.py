import os
import json
import re
import requests
import traceback
import unicodedata
import ast


class AIService:
    def __init__(self):
        self.api_key = os.environ.get('OPENROUTER_API_KEY')
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY is not configured")

        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def generate_quiz(self, subject, difficulty, num_questions, prompt_topic="", quiz_mode="Theory"):
        try:
            if quiz_mode == "Coding":
                return self._generate_coding_quiz(subject, difficulty, num_questions, prompt_topic)
            else:
                return self._generate_theory_quiz(subject, difficulty, num_questions, prompt_topic)
        except Exception as e:
            print(f"[WARNING] AI OpenRouter models failed ({e}), generating bulletproof fallback quiz...")
            return self._generate_fallback_quiz(subject, difficulty, num_questions, prompt_topic, quiz_mode)

    def _generate_fallback_quiz(self, subject, difficulty, num_questions, prompt_topic, quiz_mode):
        topic_title = prompt_topic.strip() if prompt_topic else "Core Principles"
        quiz_title = f"{subject}: {topic_title} Mastery"

        coding_pools = {
            "typescript": [
                {
                    "q": "What is the output of the following TypeScript snippet?\n\n```typescript\nlet num: number = 10;\nlet val: any = num;\nconsole.log(typeof val);\n```",
                    "opts": ["\"number\"", "\"any\"", "\"object\"", "\"undefined\""],
                    "ans": "\"number\""
                },
                {
                    "q": "What will the following TypeScript interface snippet output?\n\n```typescript\ninterface User { name: string; age?: number; }\nconst u: User = { name: \"Alice\" };\nconsole.log(u.age);\n```",
                    "opts": ["undefined", "null", "0", "Compilation Error"],
                    "ans": "undefined"
                }
            ],
            "rust": [
                {
                    "q": "What will be the output of this Rust code snippet?\n\n```rust\nfn main() {\n    let mut x = 5;\n    x += 1;\n    println!(\"{}\", x);\n}\n```",
                    "opts": ["6", "5", "Compilation Error", "Garbage Value"],
                    "ans": "6"
                },
                {
                    "q": "What happens when compiling this Rust snippet?\n\n```rust\nfn main() {\n    let s1 = String::from(\"hello\");\n    let s2 = s1;\n    println!(\"{}\", s2.len());\n}\n```",
                    "opts": ["5", "Compilation Error", "Undefined Behavior", "0"],
                    "ans": "5"
                }
            ],
            "nodejs": [
                {
                    "q": "What will the following Node.js async code snippet log?\n\n```javascript\nconsole.log(1);\nsetImmediate(() => console.log(2));\nconsole.log(3);\n```",
                    "opts": ["1 3 2", "1 2 3", "3 1 2", "2 1 3"],
                    "ans": "1 3 2"
                }
            ],
            "flask": [
                {
                    "q": "What will the following Flask route function return?\n\n```python\nfrom flask import Flask\napp = Flask(__name__)\n@app.route('/')\ndef home():\n    return 'Hello Flask'\n```",
                    "opts": ["'Hello Flask'", "HTML 500", "None", "JSON"],
                    "ans": "'Hello Flask'"
                }
            ],
            "django": [
                {
                    "q": "What SQL query logic does this Django ORM line execute?\n\n```python\nUser.objects.filter(is_active=True).count()\n```",
                    "opts": ["SELECT COUNT(*) FROM users_user WHERE is_active = True", "DELETE FROM users_user", "UPDATE users_user SET is_active=True", "SELECT * FROM users_user"],
                    "ans": "SELECT COUNT(*) FROM users_user WHERE is_active = True"
                }
            ],
            "react": [
                {
                    "q": "What will the following React JSX component render?\n\n```jsx\nfunction Component() {\n  const [count] = useState(0);\n  return <button>{count}</button>;\n}\n```",
                    "opts": ["A button displaying 0", "A button displaying null", "Syntax Error", "A button displaying 1"],
                    "ans": "A button displaying 0"
                }
            ],
            "csharp": [
                {
                    "q": "What will be the output of the following C# code?\n\n```csharp\nusing System;\nclass Program {\n    static void Main() {\n        int x = 5;\n        Console.WriteLine(x++);\n    }\n}\n```",
                    "opts": ["5", "6", "4", "Compilation Error"],
                    "ans": "5"
                },
                {
                    "q": "What is the output of this C# code snippet?\n\n```csharp\nusing System;\nclass Program {\n    static void Main() {\n        string text = \"C# .NET\";\n        Console.WriteLine(text.Length);\n    }\n}\n```",
                    "opts": ["7", "6", "8", "0"],
                    "ans": "7"
                }
            ],
            "c": [
                {
                    "q": "What will be the output of the following C code?\n\n```c\n#include <stdio.h>\nint main() {\n    int a = 5;\n    printf(\"%d\", a++);\n    return 0;\n}\n```",
                    "opts": ["5", "6", "4", "Compilation Error"],
                    "ans": "5"
                },
                {
                    "q": "What will the following C snippet print?\n\n```c\n#include <stdio.h>\nint main() {\n    int arr[3] = {10, 20, 30};\n    printf(\"%d\", *(arr + 1));\n    return 0;\n}\n```",
                    "opts": ["20", "10", "30", "Garbage Value"],
                    "ans": "20"
                }
            ],
            "cpp": [
                {
                    "q": "What is the output of the following C++ code?\n\n```cpp\n#include <iostream>\nusing namespace std;\nint main() {\n    int a = 10;\n    int &b = a;\n    b = 20;\n    cout << a;\n    return 0;\n}\n```",
                    "opts": ["20", "10", "Garbage Value", "Compilation Error"],
                    "ans": "20"
                }
            ],
            "python": [
                {
                    "q": "What will be the output of the following Python code?\n\n```python\nitems = [1, 0, True, False, 2]\nresult = [x for x in items if x]\nprint(len(result))\n```",
                    "opts": ["3", "5", "2", "Error"],
                    "ans": "3"
                }
            ],
            "javascript": [
                {
                    "q": "What will the following JavaScript code output?\n\n```javascript\nconsole.log(1 + '2' + 3);\n```",
                    "opts": ["'123'", "6", "'15'", "NaN"],
                    "ans": "'123'"
                }
            ],
            "java": [
                {
                    "q": "What is the output of the following Java code?\n\n```java\npublic class Main {\n    public static void main(String[] args) {\n        String str = \"Java\";\n        str.concat(\" SE\");\n        System.out.println(str);\n    }\n}\n```",
                    "opts": ["Java", "Java SE", "NullPointerException", "Compilation Error"],
                    "ans": "Java"
                }
            ]
        }

        theory_pools = {
            "typescript": [
                {
                    "q": "What is the primary benefit of TypeScript over plain JavaScript?",
                    "opts": ["Static type checking at compile time", "Faster runtime execution in V8", "Built-in database drivers", "Automatic CSS compilation"],
                    "ans": "Static type checking at compile time"
                }
            ],
            "rust": [
                {
                    "q": "How does Rust achieve memory safety without a Garbage Collector?",
                    "opts": ["Through Ownership, Borrowing, and Lifetimes", "Using automatic reference counting only", "By compiling to JVM bytecode", "Using manual free() calls"],
                    "ans": "Through Ownership, Borrowing, and Lifetimes"
                }
            ],
            "nodejs": [
                {
                    "q": "What architecture allows Node.js to handle thousands of concurrent requests efficiently?",
                    "opts": ["Single-threaded Event Loop with Non-blocking I/O", "Multi-threaded process per request", "Synchronous blocking threads", "Kernel panic isolation"],
                    "ans": "Single-threaded Event Loop with Non-blocking I/O"
                }
            ],
            "react": [
                {
                    "q": "What is Virtual DOM in React?",
                    "opts": ["In-memory lightweight representation of the real DOM", "A physical browser window", "A server-side database", "A WebGL rendering canvas"],
                    "ans": "In-memory lightweight representation of the real DOM"
                }
            ],
            "csharp": [
                {
                    "q": "Which keyword is used to define a class that cannot be inherited in C#?",
                    "opts": ["sealed", "static", "final", "abstract"],
                    "ans": "sealed"
                }
            ],
            "c": [
                {
                    "q": "Which standard library function is used for dynamic memory allocation in C?",
                    "opts": ["malloc()", "new()", "alloc()", "create()"],
                    "ans": "malloc()"
                }
            ],
            "cpp": [
                {
                    "q": "Which feature of C++ allows multiple functions to share the same name with different parameters?",
                    "opts": ["Function Overloading", "Function Overriding", "Virtual Functions", "Templates"],
                    "ans": "Function Overloading"
                }
            ],
            "python": [
                {
                    "q": "What is the primary difference between a List and a Tuple in Python?",
                    "opts": ["Lists are mutable while Tuples are immutable", "Tuples are mutable while Lists are immutable", "Lists cannot store strings", "Tuples cannot be indexed"],
                    "ans": "Lists are mutable while Tuples are immutable"
                }
            ],
            "javascript": [
                {
                    "q": "What is the difference between '==' and '===' in JavaScript?",
                    "opts": ["'===' checks both value and type, while '==' performs type coercion", "'==' checks value and type, while '===' performs coercion", "They are identical in ES6", "'===' only works on numbers"],
                    "ans": "'===' checks both value and type, while '==' performs type coercion"
                }
            ],
            "java": [
                {
                    "q": "Which keyword prevents a Java class from being subclassed?",
                    "opts": ["final", "static", "private", "abstract"],
                    "ans": "final"
                }
            ]
        }

        # ✅ Comprehensive Subject Classifier (Handles all 11+ frontend choice subjects)
        subj_lower = subject.lower().strip()
        if "c#" in subj_lower or "csharp" in subj_lower or "c sharp" in subj_lower or subj_lower == "cs":
            subj_key = "csharp"
        elif "typescript" in subj_lower or "ts" in subj_lower:
            subj_key = "typescript"
        elif "node" in subj_lower:
            subj_key = "nodejs"
        elif "react" in subj_lower:
            subj_key = "react"
        elif "flask" in subj_lower:
            subj_key = "flask"
        elif "django" in subj_lower:
            subj_key = "django"
        elif "rust" in subj_lower:
            subj_key = "rust"
        elif "c++" in subj_lower or "cpp" in subj_lower:
            subj_key = "cpp"
        elif subj_lower in ["c", "c programming", "c language"] or (subj_lower.startswith("c ") and "++" not in subj_lower and "#" not in subj_lower):
            subj_key = "c"
        elif "java" in subj_lower and "script" not in subj_lower:
            subj_key = "java"
        elif "script" in subj_lower or "js" in subj_lower:
            subj_key = "javascript"
        elif "python" in subj_lower or "py" in subj_lower:
            subj_key = "python"
        else:
            subj_key = subj_lower

        target_pools = coding_pools if quiz_mode == "Coding" else theory_pools
        pool = target_pools.get(subj_key, [])

        questions = []
        seen_texts = set()
        idx = 0

        while len(questions) < num_questions:
            if idx < len(pool):
                item = pool[idx]
            else:
                var_num = idx + 1
                if quiz_mode == "Coding":
                    if subj_key == "typescript":
                        item = {
                            "q": f"What is the output of the following {subject} snippet (Example #{var_num})?\n\n```typescript\nconst count{var_num}: number = {var_num * 10};\nconsole.log(count{var_num} + 5);\n```",
                            "opts": [str(var_num * 10 + 5), str(var_num * 10), str(var_num * 10 - 5), "Error"],
                            "ans": str(var_num * 10 + 5)
                        }
                    elif subj_key == "rust":
                        item = {
                            "q": f"What will be the output of the following {subject} code (Example #{var_num})?\n\n```rust\nfn main() {{\n    let val{var_num}: i32 = {var_num * 5};\n    println!(\"{{}}\", val{var_num} + 2);\n}}\n```",
                            "opts": [str(var_num * 5 + 2), str(var_num * 5), str(var_num * 5 - 2), "Compilation Error"],
                            "ans": str(var_num * 5 + 2)
                        }
                    elif subj_key == "react":
                        item = {
                            "q": f"What will the following {subject} component render (Component #{var_num})?\n\n```jsx\nfunction Card() {{\n  const [val] = useState({var_num * 3});\n  return <span>{{val + 1}}</span>;\n}}\n```",
                            "opts": [str(var_num * 3 + 1), str(var_num * 3), str(var_num * 3 - 1), "0"],
                            "ans": str(var_num * 3 + 1)
                        }
                    elif subj_key in ["django", "flask"]:
                        item = {
                            "q": f"What is the output of the following {subject} code (Snippet #{var_num})?\n\n```python\n# {subject} execution logic #{var_num}\nres = {var_num * 4} + 2\nprint(res)\n```",
                            "opts": [str(var_num * 4 + 2), str(var_num * 4), str(var_num * 4 - 2), "Error"],
                            "ans": str(var_num * 4 + 2)
                        }
                    elif subj_key == "csharp":
                        item = {
                            "q": f"What is the output of the following {subject} code (Example #{var_num})?\n\n```csharp\nusing System;\nclass Program {{\n    static void Main() {{\n        int num{var_num} = {var_num * 5};\n        Console.WriteLine(num{var_num} + 2);\n    }}\n}}\n```",
                            "opts": [str(var_num * 5 + 2), str(var_num * 5), str(var_num * 5 - 2), "Error"],
                            "ans": str(var_num * 5 + 2)
                        }
                    elif subj_key in ["c", "cpp"]:
                        lang_code = "cpp" if subj_key == "cpp" else "c"
                        item = {
                            "q": f"What will be the output of the following {subject} code (Variation #{var_num})?\n\n```{lang_code}\n#include <stdio.h>\nint main() {{\n    int val{var_num} = {var_num * 10};\n    printf(\"%d\", val{var_num} + 5);\n    return 0;\n}}\n```",
                            "opts": [str(var_num * 10 + 5), str(var_num * 10), str(var_num * 10 - 5), "Error"],
                            "ans": str(var_num * 10 + 5)
                        }
                    else:
                        item = {
                            "q": f"What is the output of the following {subject} snippet (Variation #{var_num})?\n\n```{subj_key}\n// {subject} execution logic #{var_num}\nint num = {var_num * 2};\nconsole.log(num);\n```",
                            "opts": [str(var_num * 2), str(var_num), str(var_num + 1), "0"],
                            "ans": str(var_num * 2)
                        }
                else:
                    base_item = pool[idx % len(pool)] if pool else {"q": f"Core concept in {subject}", "opts": ["Option 1", "Option 2", "Option 3", "Option 4"], "ans": "Option 1"}
                    item = {
                        "q": f"Regarding {subject} {topic_title} (Concept #{var_num}): {base_item['q']}",
                        "opts": list(base_item["opts"]),
                        "ans": base_item["ans"]
                    }

            idx += 1
            if item["q"] not in seen_texts:
                seen_texts.add(item["q"])
                questions.append({
                    "question_type": "Coding" if quiz_mode == "Coding" else "MCQ",
                    "question_text": item["q"],
                    "options": list(item["opts"]),
                    "correct_answer": item["ans"]
                })

        return {
            "quiz_title": quiz_title,
            "questions": questions
        }

    def _generate_theory_quiz(self, subject, difficulty, num_questions, prompt_topic):
        prompt = f"""
You are an expert quiz generator. Generate exactly {num_questions} 100% UNIQUE theory questions on "{subject}".

Difficulty: {difficulty}
Focus: {prompt_topic if prompt_topic else 'General'}

CRITICAL STRICT RULES:
1. SUBJECT MATCHING: All questions MUST be 100% focused on "{subject}". Do NOT generate questions about Python if the subject is "{subject}".
2. ZERO DUPLICATES (MANDATORY): Every single question in the returned array MUST be completely unique. Ensure each question tests a DISTINCT and DIFFERENT sub-topic or concept. If generating {num_questions} questions, they must cover {num_questions} completely DIFFERENT concepts. Do NOT repeat the same question or options.

TITLE GENERATION RULE:
Generate a short, catchy, and highly unique title for this quiz by combining the Subject ("{subject}") and the Focus/Topic ("{prompt_topic if prompt_topic else 'General'}").

QUESTION TYPES (mix them evenly):
1. MCQ (Multiple Choice) - 4 options, one correct.
2. True/False - exactly 4 options where Option A="True", Option B="False", C & D are meaningful alternatives.
3. Fill in the Blank - statement with a missing word.

OUTPUT - Return a JSON object with two fields: "quiz_title" and "questions" (array of exactly {num_questions} unique questions):
{{
  "quiz_title": "{subject}: {prompt_topic if prompt_topic else 'Core'} Combat",
  "questions": [
    {{
      "question_type": "MCQ",
      "question_text": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A"
    }}
  ]
}}

Return ONLY valid JSON. No extra text.
"""
        return self._call_openrouter(prompt, num_questions)

    def _generate_coding_quiz(self, subject, difficulty, num_questions, prompt_topic):
        prompt = f"""
You are an expert programming logic question generator. Generate exactly {num_questions} 100% UNIQUE programming questions specifically for "{subject}".

Difficulty: {difficulty}
Focus: {prompt_topic if prompt_topic else 'General'}

CRITICAL STRICT RULES:
1. SUBJECT LANGUAGE MATCHING: Every code snippet MUST be written in valid {subject} syntax inside a markdown code block tagged ```{subject.lower()}. NEVER output Python code when the subject is "{subject}".
2. ZERO DUPLICATES (MANDATORY): Every single question MUST be unique. Do not repeat code snippets or question text. Each snippet must test a completely DIFFERENT concept, function, or logic flaw.
3. OPTIONS MATCH CODE: The 4 options MUST be the exact outputs or values produced by running that specific code snippet.

TITLE GENERATION RULE:
Generate a short, catchy title combining Subject ("{subject}") and Topic ("{prompt_topic if prompt_topic else 'General'}").

OUTPUT FORMAT (JSON object with "quiz_title" and "questions"):
{{
  "quiz_title": "{subject} Logic Combat",
  "questions": [
    {{
      "question_type": "Coding",
      "question_text": "What is the output of the following {subject} code?\\n\\n```{subject.lower()}\\n// code snippet in {subject}\\n```",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": "Option 1"
    }}
  ]
}}

Return ONLY valid JSON.
"""
        return self._call_openrouter(prompt, num_questions)

    def _clean_json_strings(self, text):
        """Escapes raw unescaped newlines, carriage returns, and tabs inside JSON string values."""
        result = []
        in_string = False
        escaped = False
        for char in text:
            if char == '"' and not escaped:
                in_string = not in_string
                result.append(char)
            elif in_string:
                if char == '\n':
                    result.append('\\n')
                elif char == '\r':
                    result.append('\\r')
                elif char == '\t':
                    result.append('\\t')
                else:
                    result.append(char)
            else:
                result.append(char)
            escaped = (char == '\\' and not escaped)
        return "".join(result)

    def _fix_truncated_json(self, text):
        """Attempts to close unclosed JSON quotes, objects, and arrays if truncated."""
        if not text:
            return text
        
        # Balance quotes if odd number of unescaped quotes
        if text.count('"') % 2 != 0:
            text += '"'

        stack = []
        in_str = False
        escaped = False
        for char in text:
            if char == '"' and not escaped:
                in_str = not in_str
            elif not in_str:
                if char in '{[':
                    stack.append(char)
                elif char in '}]':
                    if stack and ((char == '}' and stack[-1] == '{') or (char == ']' and stack[-1] == '[')):
                        stack.pop()
            escaped = (char == '\\' and not escaped)

        while stack:
            opener = stack.pop()
            text += '}' if opener == '{' else ']'
            
        return text

    def _parse_json_robustly(self, raw_text):
        if not raw_text or not raw_text.strip():
            raise ValueError("Empty output from AI model")

        text = raw_text.strip()

        # 1. Remove markdown fences
        code_block = re.search(r'```(?:json)?\s*(.*?)\s*```', text, re.DOTALL)
        if code_block:
            text = code_block.group(1).strip()

        # 2. Try direct json.loads
        try:
            return json.loads(text, strict=False)
        except Exception:
            pass

        # 3. Clean raw unescaped string control characters & truncated JSON
        cleaned_text = self._clean_json_strings(text)
        try:
            return json.loads(cleaned_text, strict=False)
        except Exception:
            pass

        fixed_truncated = self._fix_truncated_json(cleaned_text)
        try:
            return json.loads(fixed_truncated, strict=False)
        except Exception:
            pass

        # 4. Extract JSON object or array bounds
        start_obj = text.find('{')
        end_obj = text.rfind('}')
        start_arr = text.find('[')
        end_arr = text.rfind(']')

        candidates = []
        if start_obj != -1 and end_obj != -1 and end_obj > start_obj:
            candidates.append(text[start_obj:end_obj + 1])
            candidates.append(self._clean_json_strings(text[start_obj:end_obj + 1]))
            candidates.append(self._fix_truncated_json(text[start_obj:end_obj + 1]))
        if start_arr != -1 and end_arr != -1 and end_arr > start_arr:
            candidates.append(text[start_arr:end_arr + 1])
            candidates.append(self._clean_json_strings(text[start_arr:end_arr + 1]))
            candidates.append(self._fix_truncated_json(text[start_arr:end_arr + 1]))
        candidates.append(text)
        candidates.append(cleaned_text)
        candidates.append(fixed_truncated)

        for candidate in candidates:
            # Try simple candidate load
            try:
                return json.loads(candidate, strict=False)
            except Exception:
                pass

            # Fix common JSON errors:
            # a) Trailing commas
            c1 = re.sub(r',\s*([\}\]])', r'\1', candidate)
            try:
                return json.loads(c1, strict=False)
            except Exception:
                pass

            # b) Unquoted keys: { quiz_title: "..." } -> { "quiz_title": "..." }
            c2 = re.sub(r'([{,]\s*)([a-zA-Z0-9_]+)\s*:', r'\1"\2":', c1)
            try:
                return json.loads(c2, strict=False)
            except Exception:
                pass

            # c) Single quotes for strings
            c3 = re.sub(r"(?<=[:\[,\{])\s*'([^'\\]*(?:\\.[^'\\]*)*)'\s*(?=[,\}\]])", r' "\1"', c2)
            try:
                return json.loads(c3, strict=False)
            except Exception:
                pass

            # d) ast.literal_eval
            try:
                return ast.literal_eval(candidate)
            except Exception:
                pass
            try:
                return ast.literal_eval(c3)
            except Exception:
                pass

        raise ValueError("Failed to parse valid JSON from model output")

    def _call_openrouter(self, prompt, num_questions):
        models_to_try = [
            "google/gemini-2.0-flash-001",
            "meta-llama/llama-3.3-70b-instruct:free",
            "google/gemini-2.0-flash-lite-001",
            "openai/gpt-4o-mini"
        ]

        last_error = None

        for model in models_to_try:
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an expert quiz generation engine. You MUST respond with 100% valid JSON only, with double quotes around all object property names and string values. DO NOT include choice letter prefixes like 'A.', 'B.', 'C.', 'D.' or '1.' inside the option text strings; output raw option text values only. Do not include any conversational response."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.9,
                    "max_tokens": 4000,
                }

                response = requests.post(
                    self.api_url,
                    headers=self.headers,
                    json=payload,
                    timeout=12,
                    stream=False
                )

                # Fallback if model doesn't support response_format
                if response.status_code == 400 and 'response_format' in response.text:
                    payload.pop('response_format', None)
                    response = requests.post(
                        self.api_url,
                        headers=self.headers,
                        json=payload,
                        timeout=12,
                        stream=False
                    )

                if response.status_code == 200:
                    data = response.json()
                    raw_text = data['choices'][0]['message']['content'].strip()
                else:
                    raise ValueError(f"OpenRouter status {response.status_code}: {response.text}")

                # Clean and parse the raw output using robust parsing strategies
                parsed_data = self._parse_json_robustly(raw_text)

                quiz_title = ""
                if isinstance(parsed_data, dict):
                    quiz_title = parsed_data.get('quiz_title', '').strip()
                    questions = parsed_data.get('questions', [])
                else:
                    questions = parsed_data

                if not isinstance(questions, list):
                    raise ValueError("Response is not a list")

                random_patterns = ['pizza', 'burger', 'cake', 'dog', 'cat', 'apple', 'banana', 'sandwich']
                sensible_alternatives = [
                    "True, but only under certain conditions",
                    "False, except in specific cases",
                    "Partially true",
                    "Not applicable in this context",
                    "Both A and B"
                ]

                for q in questions:
                    q_type = q.get('question_type', '')
                    options = q.get('options', [])
                    correct = q.get('correct_answer', '')

                    if q_type in ['MCQ', 'True/False', 'Fill in the Blank', 'Coding']:
                        if not isinstance(options, list):
                            options = []

                        # Gracefully ensure exactly 4 options
                        if len(options) < 4:
                            while len(options) < 4:
                                options.append(sensible_alternatives[len(options) - 2] if len(options) - 2 < len(sensible_alternatives) else f"Option {len(options) + 1}")
                        elif len(options) > 4:
                            options = options[:4]

                        if q_type == 'True/False':
                            if len(options) >= 2:
                                options[0] = "True"
                                options[1] = "False"

                            for i in range(2, len(options)):
                                opt_lower = options[i].lower()
                                if len(options[i]) < 3 or any(word in opt_lower for word in random_patterns):
                                    options[i] = sensible_alternatives[i - 2] if i - 2 < len(sensible_alternatives) else "None of the above"

                            if correct not in ["True", "False"]:
                                if correct in ["A", "True"]:
                                    q['correct_answer'] = "True"
                                elif correct in ["B", "False"]:
                                    q['correct_answer'] = "False"
                                else:
                                    q['correct_answer'] = "True"

                            q['options'] = options

                        correct = q.get('correct_answer', '')
                        if correct not in options:
                            if correct in ['A', 'B', 'C', 'D']:
                                label_map = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
                                idx = label_map.get(correct, 0)
                                if idx < len(options):
                                    q['correct_answer'] = options[idx]
                            else:
                                q['correct_answer'] = options[0] if options else ""

                return {
                    "quiz_title": quiz_title,
                    "questions": questions
                }

            except requests.exceptions.RequestException as e:
                last_error = f"{model} request error: {str(e)}"
            except json.JSONDecodeError as e:
                last_error = f"{model} JSON decode error: {str(e)}"
            except Exception as e:
                last_error = f"{model} error: {str(e)}"

        raise ValueError(f"All AI models failed. Last error: {last_error}")

    def call_openrouter(self, prompt, num_items):
        """Public wrapper for OpenRouter API calls."""
        return self._call_openrouter(prompt, num_items)

    def generate_explanations(self, prompt, num_items):
        """
        Generate AI explanations (list of strings) using OpenRouter.
        This is a simpler version that doesn't validate question structure.
        """
        models_to_try = [
            "google/gemini-2.0-flash-001",
            "meta-llama/llama-3.3-70b-instruct:free",
            "openai/gpt-4o-mini"
        ]

        last_error = None

        for model in models_to_try:
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an AI explanation engine. Respond with 100% valid JSON array of explanation strings only."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 800,
                }

                response = requests.post(
                    self.api_url,
                    headers=self.headers,
                    json=payload,
                    timeout=25,
                    stream=False
                )

                if response.status_code == 200:
                    data = response.json()
                    raw_text = data['choices'][0]['message']['content'].strip()
                else:
                    raise ValueError(f"{model} failed with status {response.status_code}")

                # Clean and parse JSON array
                explanations = self._parse_json_robustly(raw_text)

                # Normalize to expected length and list type
                if not isinstance(explanations, list):
                    explanations = []

                if len(explanations) < num_items:
                    while len(explanations) < num_items:
                        explanations.append("No explanation available.")
                elif len(explanations) > num_items:
                    explanations = explanations[:num_items]

                return explanations

            except Exception as e:
                last_error = f"{model} error: {str(e)}"
                print(f"Warning: {last_error}, trying next model...")

        raise ValueError(f"All AI models failed. Last error: {last_error}")