import os
import json
import google.generativeai as genai

class GeminiService:
    def __init__(self):
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not configured")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-3.5-flash')

    def generate_quiz(self, subject, difficulty, question_type, num_questions, prompt_topic=""):
        if question_type == "True/False":
            options_instruction = """
- Each question must have exactly 2 options: ["True", "False"].
- The correct_answer_index must be 0 (if answer is True) or 1 (if answer is False).
"""
            type_description = "True/False questions"
        else:
            options_instruction = """
- Each question must have exactly 4 options (A, B, C, D).
- One and only one option must be the correct answer.
- The correct_answer_index must be the 0-based index of the correct option (0, 1, 2, or 3).
"""
            type_description = "Multiple Choice Questions (MCQs)"

        prompt = f"""
You are an expert quiz generator. Generate {num_questions} {type_description} on "{subject}".

🔹 Difficulty: {difficulty}
🔹 Focus: {prompt_topic if prompt_topic else 'General'}

Instructions:
{options_instruction}

Output ONLY a JSON array:
[
  {{
    "question_text": "Question?",
    "options": ["A", "B", "C", "D"],
    "correct_answer_index": 0
  }}
]

Return ONLY valid JSON. No extra text.
"""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=2048,
                )
            )
            raw_text = response.text.strip()

            # Clean markdown
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

            
            if question_type == "True/False":
                for q in questions:
                    if q.get('options') != ["True", "False"]:
                        q['options'] = ["True", "False"]
                        if q.get('correct_answer_index', 0) not in [0, 1]:
                            q['correct_answer_index'] = 0

            return questions

        except json.JSONDecodeError as e:
            raise ValueError(f"AI returned invalid JSON: {e}")
        except Exception as e:
            raise ValueError(f"AI generation failed: {str(e)}")