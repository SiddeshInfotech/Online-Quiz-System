import os
import json
import google.generativeai as genai

class GeminiService:
    def __init__(self):
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not configured")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro-latest')

    def generate_quiz(self, subject, difficulty, num_questions, prompt_topic="", quiz_mode="Theory"):
        if quiz_mode == "Coding":
            return self._generate_coding_quiz(subject, difficulty, num_questions, prompt_topic)
        else:
            return self._generate_theory_quiz(subject, difficulty, num_questions, prompt_topic)

    def _generate_theory_quiz(self, subject, difficulty, num_questions, prompt_topic):
        prompt = f"""
You are an expert quiz generator. Generate exactly {num_questions} theory questions on "{subject}".

🔹 Difficulty: {difficulty}
🔹 Focus: {prompt_topic if prompt_topic else 'General'}

🔸 QUESTION TYPES (mix them evenly):
1. MCQ (Multiple Choice) — 4 options, one correct.
2. True/False — 4 options (True, False, and 2 distractors), one correct.
3. Fill in the Blank — statement with a missing word, 4 options, one correct.

🔴 IMPORTANT RULES:
- EVERY question must have EXACTLY 4 options.
- For Fill in the Blank: the correct answer MUST be one of the 4 options.
- For True/False: options should be like ["True", "False", "Maybe", "Not Sure"] (or similar), with only one correct.

📋 OUTPUT FORMAT — Return a JSON array of objects, each must have:
- "question_type": "MCQ" or "True/False" or "Fill in the Blank"
- "question_text": "The question text"
- "options": [list of exactly 4 strings]
- "correct_answer": "The correct option text (must match one of the 4 options)"

Example:
[
  {{
    "question_type": "MCQ",
    "question_text": "What is the output of print(2**3)?",
    "options": ["4", "6", "8", "9"],
    "correct_answer": "8"
  }},
  {{
    "question_type": "True/False",
    "question_text": "Python is a compiled language.",
    "options": ["True", "False", "Maybe", "Sometimes"],
    "correct_answer": "False"
  }},
  {{
    "question_type": "Fill in the Blank",
    "question_text": "The keyword used to define a function in Python is ____.",
    "options": ["def", "func", "define", "function"],
    "correct_answer": "def"
  }}
]

Return ONLY valid JSON. No extra text.
"""
        return self._call_gemini_and_parse(prompt, num_questions)

    def _generate_coding_quiz(self, subject, difficulty, num_questions, prompt_topic):
        prompt = f"""
You are an expert coding problem generator. Generate exactly {num_questions} coding problems on "{subject}".

🔹 Difficulty: {difficulty}
🔹 Focus: {prompt_topic if prompt_topic else 'General'}

Each problem must include:
- Problem statement (description, what needs to be solved).
- Input format / constraints (e.g., "1 ≤ n ≤ 10^5").
- Sample input and sample output (one example each).
- Expected answer: a solution approach or pseudo-code (not full code, but clear explanation).

📋 OUTPUT FORMAT — Return a JSON array of objects, each with:
- "question_type": always "Coding"
- "question_text": the full problem description, including constraints, sample input, sample output, and expected answer (you can combine them all in one text block).
- "options": empty array []
- "correct_answer": the expected answer / solution explanation (can be same as expected answer in text).

Example:
[
  {{
    "question_type": "Coding",
    "question_text": "**Problem:** Given an array of integers, find the sum of all positive numbers.\n\n**Constraints:** 1 ≤ n ≤ 10^5, -10^9 ≤ arr[i] ≤ 10^9\n\n**Sample Input:** 3\n-1 2 -3\n\n**Sample Output:** 2\n\n**Expected Answer:** Iterate through array, if element > 0 add to sum.",
    "options": [],
    "correct_answer": "Iterate through array, if element > 0 add to sum."
  }}
]

Return ONLY valid JSON. No extra text.
"""
        return self._call_gemini_and_parse(prompt, num_questions)

    def _call_gemini_and_parse(self, prompt, num_questions):
        try:
            response = self.model.generate_content(prompt)
            raw_text = response.text.strip()

            if raw_text.startswith('```json'):
                raw_text = raw_text[7:]
            if raw_text.startswith('```'):
                raw_text = raw_text[3:]
            if raw_text.endswith('```'):
                raw_text = raw_text[:-3]
            raw_text = raw_text.strip()

            questions = json.loads(raw_text)
            if not isinstance(questions, list):
                raise ValueError("Response is not a list")

            for q in questions:
                q_type = q.get('question_type', '')
                options = q.get('options', [])
                if q_type in ['MCQ', 'True/False', 'Fill in the Blank']:
                    if len(options) != 4:
                        raise ValueError(f"Question '{q.get('question_text', '')}' does not have exactly 4 options (found {len(options)})")
                    correct = q.get('correct_answer', '')
                    if correct not in options:
                        raise ValueError(f"Correct answer '{correct}' not found in options for question: {q.get('question_text', '')}")
                elif q_type == 'Coding':
                    if options:
                        raise ValueError(f"Coding question '{q.get('question_text', '')}' should have empty options, but found {len(options)}")

            return questions

        except json.JSONDecodeError as e:
            raise ValueError(f"AI returned invalid JSON: {e}")
        except Exception as e:
            raise ValueError(f"AI generation failed: {str(e)}")
