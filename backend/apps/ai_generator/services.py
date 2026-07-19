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
            raise ValueError("OPENROUTER_API_KEY not configured")

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
            print(f"AI generation error: {e}")
            print(traceback.format_exc())
            raise

    def _generate_theory_quiz(self, subject, difficulty, num_questions, prompt_topic):
        prompt = f"""
You are an expert quiz generator. Generate exactly {num_questions} theory questions on "{subject}".

Difficulty: {difficulty}
Focus: {prompt_topic if prompt_topic else 'General'}

TITLE GENERATION RULE:
Generate a short, catchy, and highly unique title for this quiz by combining the Subject ("{subject}") and the Focus/Topic ("{prompt_topic if prompt_topic else 'General'}").
Ensure the title is unique and creative (e.g., "Python OOP Mastery: Class Combat", "Python Basics: Loop Ninja").

QUESTION TYPES (mix them evenly):
1. MCQ (Multiple Choice) - 4 options, one correct.
2. True/False - exactly 4 options where:
   - Option A MUST be "True"
   - Option B MUST be "False"
   - Option C and D MUST be contextually relevant, logical alternatives (e.g., "True, but only under certain conditions", "False, except in specific cases", "Partially true", etc.)
   - DO NOT use random words like "Pizza", "Burger", or unrelated fillers.
3. Fill in the Blank - statement with a missing word, 4 options, one correct.

IMPORTANT:
- EVERY question must have EXACTLY 4 options.
- For True/False: A and B are fixed; C and D must be meaningful and related to the statement.
- For Fill in the Blank: the correct answer must be one of the 4 options.

OUTPUT - Return a JSON object with two fields: "quiz_title" (the unique catchy title generated) and "questions" (the array of exactly {num_questions} questions):
{{
  "quiz_title": "Python Basics: Loop Ninja",
  "questions": [
    {{
      "question_type": "MCQ",
      "question_text": "Question text",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A"
    }},
    {{
      "question_type": "True/False",
      "question_text": "C# is used for web development.",
      "options": ["True", "False", "True, but only with ASP.NET", "False, it is mostly for desktop apps"],
      "correct_answer": "True"
    }}
  ]
}}

Return ONLY valid JSON. No extra text.
"""
        return self._call_openrouter(prompt, num_questions)

    def _generate_coding_quiz(self, subject, difficulty, num_questions, prompt_topic):
        prompt = f"""
You are an expert programming logic question generator. Generate {num_questions} programming MCQs on "{subject}".

Difficulty: {difficulty}
Focus: {prompt_topic if prompt_topic else 'General'}

TITLE GENERATION RULE:
Generate a short, catchy, and highly unique title for this quiz by combining the Subject ("{subject}") and the Focus/Topic ("{prompt_topic if prompt_topic else 'General'}").
Ensure the title is unique and creative (e.g., "Python OOP Mastery: Class Combat", "Python Basics: Loop Ninja").

QUESTION TYPES (mix them):
1. Predict the output - Show a code snippet, ask what it prints.
2. Find the error - Show code with a bug, ask what's wrong.
3. Complete the code - Show code with a blank, ask what goes there.
4. Choose the correct code - Ask which code snippet solves the problem.
5. Time Complexity - Ask about Big-O of given code.

FORMAT:
- Each question must have a short code snippet (2-10 lines).
- The code snippet MUST be inside a markdown code block with the language tag (e.g., ```python, ```cpp, ```java).
- Use actual newlines in the question_text to format the code block properly.
- Exactly 4 options, one correct.
- The correct_answer must be the actual text of the correct option.

OUTPUT - Return a JSON object with two fields: "quiz_title" (the unique catchy title generated) and "questions" (the array of exactly {num_questions} questions):
{{
  "quiz_title": "Python OOP Mastery: Class Combat",
  "questions": [
    {{
      "question_type": "Coding",
      "question_text": "What is the output of the following C++ code?\\n\\n```cpp\\n#include <iostream>\\n\\nint main() {{\\n    std::cout << 10 / 3;\\n    return 0;\\n}}\\n```",
      "options": ["3", "3.33", "3.0", "Error"],
      "correct_answer": "3"
    }}
  ]
}}

IMPORTANT:
- The question_text MUST contain a markdown code block with proper syntax highlighting.
- Use real newlines (\\n) in the question_text string for formatting.
- Return ONLY valid JSON. No extra text.
"""
        return self._call_openrouter(prompt, num_questions)

    def _call_openrouter(self, prompt, num_questions):
        models_to_try = [
            "openai/gpt-3.5-turbo",
            "anthropic/claude-3-haiku"
        ]

        last_error = None

        for model in models_to_try:
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 2000,
                }

                response = requests.post(
                    self.api_url,
                    headers=self.headers,
                    json=payload,
                    timeout=60
                )

                if response.status_code == 200:
                    data = response.json()
                    raw_text = data['choices'][0]['message']['content'].strip()

                    if raw_text.startswith('```json'):
                        raw_text = raw_text[7:]
                    if raw_text.startswith('```'):
                        raw_text = raw_text[3:]
                    if raw_text.endswith('```'):
                        raw_text = raw_text[:-3]
                    raw_text = raw_text.strip()

                    raw_text = ''.join(
                        ch for ch in raw_text
                        if unicodedata.category(ch)[0] != 'C' or ch in '\n\r\t'
                    )

                    json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
                    if not json_match:
                        json_match = re.search(r'\[.*\]', raw_text, re.DOTALL)

                    if json_match:
                        json_str = json_match.group(0)
                    else:
                        json_str = raw_text

                    json_str = re.sub(r',\s*}', '}', json_str)
                    json_str = re.sub(r',\s*]', ']', json_str)

                    try:
                        parsed_data = json.loads(json_str, strict=False)
                    except json.JSONDecodeError:
                        try:
                            parsed_data = ast.literal_eval(json_str)
                        except Exception:
                            cleaned = re.sub(r'^[^{[]*', '', json_str)
                            cleaned = re.sub(r'[^{[]*$', '', cleaned)
                            parsed_data = json.loads(cleaned, strict=False)

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

                        if q_type in ['MCQ', 'True/False', 'Fill in the Blank']:
                            if len(options) != 4:
                                raise ValueError(f"Question '{q.get('question_text', '')}' does not have exactly 4 options")

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
                else:
                    last_error = f"{model} failed with status {response.status_code}: {response.text}"

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
            "openai/gpt-3.5-turbo",
            "anthropic/claude-3-haiku"
        ]

        last_error = None

        for model in models_to_try:
            try:
                payload = {
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                    "max_tokens": 2000,
                }

                response = requests.post(
                    self.api_url,
                    headers=self.headers,
                    json=payload,
                    timeout=60
                )

                if response.status_code == 200:
                    data = response.json()
                    raw_text = data['choices'][0]['message']['content'].strip()

                    # Clean markdown
                    if raw_text.startswith('```json'):
                        raw_text = raw_text[7:]
                    if raw_text.startswith('```'):
                        raw_text = raw_text[3:]
                    if raw_text.endswith('```'):
                        raw_text = raw_text[:-3]
                    raw_text = raw_text.strip()

                    # Remove control characters
                    raw_text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', raw_text)

                    # Extract JSON array
                    json_match = re.search(r'\[\s*".*"\s*\]', raw_text, re.DOTALL)
                    if json_match:
                        json_str = json_match.group(0)
                    else:
                        json_str = raw_text

                    explanations = json.loads(json_str, strict=False)

                    if isinstance(explanations, list) and len(explanations) == num_items:
                        return explanations
                    else:
                        raise ValueError(f"Expected {num_items} explanations, got {len(explanations)}")

                else:
                    last_error = f"{model} failed with status {response.status_code}"

            except Exception as e:
                last_error = f"{model} error: {str(e)}"
                print(f"Warning: {last_error}, trying next model...")

        raise ValueError(f"All AI models failed. Last error: {last_error}")