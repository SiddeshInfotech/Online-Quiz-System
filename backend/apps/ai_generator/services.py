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

        # 3. Clean raw unescaped string control characters
        cleaned_text = self._clean_json_strings(text)
        try:
            return json.loads(cleaned_text, strict=False)
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
        if start_arr != -1 and end_arr != -1 and end_arr > start_arr:
            candidates.append(text[start_arr:end_arr + 1])
            candidates.append(self._clean_json_strings(text[start_arr:end_arr + 1]))
        candidates.append(text)
        candidates.append(cleaned_text)

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
            "google/gemini-flash-1.5",
            "openai/gpt-4o-mini",
            "deepseek/deepseek-chat",
            "meta-llama/llama-3.3-70b-instruct"
        ]

        last_error = None

        for model in models_to_try:
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an expert quiz generation engine. You MUST respond with 100% valid JSON only, with double quotes around all object property names and string values. Do not include any conversational response."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.7,
                    "max_tokens": 3000,
                }

                response = requests.post(
                    self.api_url,
                    headers=self.headers,
                    json=payload,
                    timeout=25,
                    stream=False
                )

                # Fallback if model doesn't support response_format
                if response.status_code == 400 and 'response_format' in response.text:
                    payload.pop('response_format', None)
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
            "openai/gpt-4o-mini",
            "deepseek/deepseek-chat"
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
                    "max_tokens": 2000,
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