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

    def _call_openrouter(self, prompt, num_questions):
        models_to_try = [
            "google/gemini-2.5-flash",
            "openai/gpt-4o-mini",
            "anthropic/claude-3-haiku",
            "openai/gpt-3.5-turbo"
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
                else:
                    raise ValueError(f"OpenRouter status {response.status_code}: {response.text}")

                # Clean and parse the raw output using multiple robust strategies
                parsed_data = None
                raw_text_clean = raw_text.strip()
                
                # Strategy 1: Direct loads
                try:
                    parsed_data = json.loads(raw_text_clean, strict=False)
                except Exception:
                    pass

                # Strategy 2: Extract from markdown code blocks
                if parsed_data is None:
                    code_block_match = re.search(r'```(?:json)?\s*(.*?)\s*```', raw_text_clean, re.DOTALL)
                    if code_block_match:
                        content = code_block_match.group(1).strip()
                        try:
                            parsed_data = json.loads(content, strict=False)
                        except Exception:
                            raw_text_clean = content

                # Strategy 3: Stack-based balanced brace/bracket extraction
                if parsed_data is None:
                    for start_char, end_char in [('{', '}'), ('[', ']')]:
                        pos = 0
                        while True:
                            start_idx = raw_text_clean.find(start_char, pos)
                            if start_idx == -1:
                                break
                            
                            in_string = False
                            escape = False
                            stack_count = 0
                            end_idx = -1
                            
                            for i in range(start_idx, len(raw_text_clean)):
                                char = raw_text_clean[i]
                                if escape:
                                    escape = False
                                    continue
                                if char == '\\':
                                    escape = True
                                    continue
                                if char == '"':
                                    in_string = not in_string
                                    continue
                                if not in_string:
                                    if char == start_char:
                                        stack_count += 1
                                    elif char == end_char:
                                        stack_count -= 1
                                        if stack_count == 0:
                                            end_idx = i
                                            break
                            
                            if end_idx != -1:
                                json_candidate = raw_text_clean[start_idx:end_idx+1]
                                try:
                                    cleaned_candidate = re.sub(r',\s*}', '}', json_candidate)
                                    cleaned_candidate = re.sub(r',\s*]', ']', cleaned_candidate)
                                    parsed_data = json.loads(cleaned_candidate, strict=False)
                                    break
                                except Exception:
                                    try:
                                        parsed_data = ast.literal_eval(json_candidate)
                                        break
                                    except Exception:
                                        pass
                                pos = start_idx + 1
                            else:
                                pos = start_idx + 1
                        if parsed_data is not None:
                            break

                # Strategy 4: Standard regex extraction
                if parsed_data is None:
                    raw_text_clean = ''.join(
                        ch for ch in raw_text_clean
                        if unicodedata.category(ch)[0] != 'C' or ch in '\n\r\t'
                    )
                    json_match = re.search(r'\{.*\}', raw_text_clean, re.DOTALL)
                    if not json_match:
                        json_match = re.search(r'\[.*\]', raw_text_clean, re.DOTALL)

                    if json_match:
                        json_str = json_match.group(0)
                    else:
                        json_str = raw_text_clean

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
            "google/gemini-2.5-flash",
            "openai/gpt-4o-mini",
            "anthropic/claude-3-haiku",
            "openai/gpt-3.5-turbo"
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
                else:
                    raise ValueError(f"{model} failed with status {response.status_code}")

                # Clean and parse JSON array
                raw_text_clean = raw_text.strip()
                explanations = None

                # Strategy 1: Direct load
                try:
                    explanations = json.loads(raw_text_clean, strict=False)
                except Exception:
                    pass

                # Strategy 2: Code block extraction
                if explanations is None:
                    code_block_match = re.search(r'```(?:json)?\s*(.*?)\s*```', raw_text_clean, re.DOTALL)
                    if code_block_match:
                        content = code_block_match.group(1).strip()
                        try:
                            explanations = json.loads(content, strict=False)
                        except Exception:
                            raw_text_clean = content

                # Strategy 3: Stack-based balanced brackets extraction
                if explanations is None:
                    pos = 0
                    while True:
                        start_idx = raw_text_clean.find('[', pos)
                        if start_idx == -1:
                            break
                        
                        in_string = False
                        escape = False
                        stack_count = 0
                        end_idx = -1
                        
                        for i in range(start_idx, len(raw_text_clean)):
                            char = raw_text_clean[i]
                            if escape:
                                escape = False
                                continue
                            if char == '\\':
                                escape = True
                                continue
                            if char == '"':
                                in_string = not in_string
                                continue
                            if not in_string:
                                if char == '[':
                                    stack_count += 1
                                elif char == ']':
                                    stack_count -= 1
                                    if stack_count == 0:
                                        end_idx = i
                                        break
                        
                        if end_idx != -1:
                            json_candidate = raw_text_clean[start_idx:end_idx+1]
                            try:
                                cleaned_candidate = re.sub(r',\s*]', ']', json_candidate)
                                explanations = json.loads(cleaned_candidate, strict=False)
                                break
                            except Exception:
                                try:
                                    explanations = ast.literal_eval(json_candidate)
                                    break
                                except Exception:
                                    pass
                            pos = start_idx + 1
                        else:
                            pos = start_idx + 1

                # Strategy 4: Fallback standard regex
                if explanations is None:
                    raw_text_clean = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', raw_text_clean)
                    json_match = re.search(r'\[\s*".*"\s*\]', raw_text_clean, re.DOTALL)
                    if json_match:
                        json_str = json_match.group(0)
                    else:
                        json_str = raw_text_clean

                    try:
                        explanations = json.loads(json_str, strict=False)
                    except Exception:
                        try:
                            explanations = ast.literal_eval(json_str)
                        except Exception:
                            raise ValueError("Failed to parse explanations JSON")

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