import os
import json
import requests

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

🔴 IMPORTANT:
- EVERY question must have EXACTLY 4 options.
- For Fill in the Blank: the correct answer must be one of the 4 options.

📋 OUTPUT — Return a JSON array:
[
  {{
    "question_type": "MCQ",
    "question_text": "Question text",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "A"
  }}
]

Return ONLY valid JSON. No extra text.
"""
        return self._call_openrouter(prompt, num_questions)

    def _generate_coding_quiz(self, subject, difficulty, num_questions, prompt_topic):
        prompt = f"""
Generate {num_questions} coding problems on "{subject}" with difficulty {difficulty}.
Focus: {prompt_topic if prompt_topic else 'General'}.

Each problem must have:
- Problem statement
- Constraints
- Sample Input
- Sample Output
- Expected Answer (solution approach)

Output JSON array:
[
  {{
    "question_type": "Coding",
    "question_text": "Problem statement with constraints and sample I/O",
    "options": [],
    "correct_answer": "Expected solution"
  }}
]

Return ONLY valid JSON.
"""
        return self._call_openrouter(prompt, num_questions)

    def _call_openrouter(self, prompt, num_questions):
        models_to_try = [
            "openai/gpt-3.5-turbo",
            "anthropic/claude-3-haiku",
            "mistralai/mistral-7b-instruct",
            "google/gemini-2.0-flash-001"
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
                    print(f"✅ AI generation successful with model: {model}")
                    data = response.json()
                    raw_text = data['choices'][0]['message']['content'].strip()
                    
                    
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
                        correct = q.get('correct_answer', '')
                        
                        if q_type in ['MCQ', 'True/False', 'Fill in the Blank']:
                          
                            if len(options) == 4 and correct in ['A', 'B', 'C', 'D']:
                                label_to_index = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
                                index = label_to_index.get(correct, 0)
                                if index < len(options):
                                    q['correct_answer'] = options[index]
                                    print(f"  🔄 Mapped label '{correct}' to text: '{options[index]}'")
                            
                            elif correct not in options:
                                try:
                                    index = int(correct) - 1
                                    if 0 <= index < len(options):
                                        q['correct_answer'] = options[index]
                                        print(f"  🔄 Mapped index '{correct}' to text: '{options[index]}'")
                                except ValueError:
                                    # If still not found, use first option as fallback
                                    if options:
                                        q['correct_answer'] = options[0]
                                        print(f"  ⚠️ Fallback: set correct_answer to first option: '{options[0]}'")
                                    else:
                                        q['correct_answer'] = ""
                        
                    return questions
                else:
                    last_error = f"{model} failed with status {response.status_code}: {response.text}"
                    print(f"⚠️ {last_error}, trying next model...")
                    
            except requests.exceptions.RequestException as e:
                last_error = f"{model} request error: {str(e)}"
                print(f"⚠️ {last_error}, trying next model...")
            except json.JSONDecodeError as e:
                last_error = f"{model} JSON decode error: {str(e)}"
                print(f"⚠️ {last_error}, trying next model...")
            except Exception as e:
                last_error = f"{model} error: {str(e)}"
                print(f"⚠️ {last_error}, trying next model...")
        
        raise ValueError(f"All AI models failed. Last error: {last_error}")