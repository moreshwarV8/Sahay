from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import google.generativeai as genai
import json
import datetime
import re
import markdown
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import io
import base64
import matplotlib.pyplot as plt
import seaborn as sns
import os
import traceback
import logging
import PyPDF2
from openai import OpenAI
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import dotenv
from pathlib import Path
from werkzeug.utils import secure_filename
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
import random
from linkedinscrap import TimesJobsScraper
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import json


# Set SSL verification to False to fix certificate errors
os.environ['HF_HUB_DISABLE_SSL_VERIFICATION'] = '1'
os.environ['REQUESTS_CA_BUNDLE'] = ''  # Additional safety measure
os.environ['SSL_CERT_FILE'] = ''  # Additional safety measure

# Try to load environment variables from .env file
dotenv.load_dotenv()

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app)

# -----------------------------------------------------------
# Configuration for Gemini (Google Generative AI)
# -----------------------------------------------------------
# Using environment variables or fallback to the hardcoded values
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', )
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel('gemini-1.5-pro')


# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-pro')

def create_prompt(query):
    context = """You are Sahay Assistant, the smart guide for the Sahay-Personalized Learning Pathway Generator,
    You help user with information about the website features:
    1. Personalized Learning Paths
    - AI-driven tailored learning pathways based on a 20-question dynamic assessment.
    - Adapts to learning styles (Visual, Auditory, Kinesthetic) and knowledge levels.
    - Recommends structured courses, difficulty levels, and study formats.
    2. AI Skill Assessment & Progress Tracking
    - Evaluates students' current skills and knowledge gaps.
    - Tracks progress with real-time analytics and feedback.
    - Helps students stay on course with adaptive recommendations.
    3. Gamified Learning & Engagement
    - Uses badges, rewards, leaderboards, and challenges to keep students motivated.
    - Incorporates interactive learning experiences to enhance engagement.
    4. 24/7 AI Guidance & Support
    - Provides round-the-clock AI assistance for academic and career-related queries.
    - Offers instant doubt resolution and learning recommendations.
    5. Career Matching & Job Readiness
    - Aligns learning paths with industry trends and job market demands.
    - Features AI-driven job matching, resume building, and mock interview preparation.
    - Helps students identify internships and job opportunities based on their skills.
    6. Inclusive & Scalable Learning
    - Supports multimedia content (videos, articles, quizzes) for diverse learning preferences.
    - Offers local language support for a broader reach.
    - Works for students from various backgrounds with personalized recommendations.
    
    Your responses should be clear, precise, and directly aligned with helping users achieve career success
    Please provide accurate, helpful responses based on the available information. and just answer to what is asked"""
    
    return f"{context}\n\nUser Query: {query}"



# -----------------------------------------------------------
# Report storage configuration
# -----------------------------------------------------------
REPORTS_DIR = 'reports'
os.makedirs(REPORTS_DIR, exist_ok=True)

# -----------------------------------------------------------
# In-Memory Data Storage and Assessment Classes
# -----------------------------------------------------------
class InMemoryDatabase:
    def __init__(self):
        self.skills_data = {
            "technical": ["Python", "React", "Data Analysis"],
            "languages": ["JavaScript", "SQL"]
        }
        self.assessment_results = []

memory_db = InMemoryDatabase()

@dataclass
class AssessmentResult:
    skill: str
    accuracy: float
    report: str
    questions: List[Dict]
    answers: Dict[str, str]

class AssessmentManager:
    def __init__(self):
        pass
        
    def get_student_skills(self) -> Tuple[List[str], List[str], Optional[str]]:
        try:
            technical_skills = memory_db.skills_data.get('technical', [])
            languages = memory_db.skills_data.get('languages', [])
            return technical_skills, languages, None
        except Exception as e:
            return [], [], str(e)

    def save_assessment_result(self, result: AssessmentResult) -> Tuple[bool, Optional[str]]:
        try:
            memory_db.assessment_results.append({
                "id": len(memory_db.assessment_results) + 1,
                "skill": result.skill,
                "accuracy": result.accuracy,
                "report": result.report,
                "questions": result.questions,
                "answers": result.answers,
                "created_at": datetime.datetime.now().isoformat()
            })
            return True, None
        except Exception as e:
            return False, str(e)

class QuestionGenerator:
    def __init__(self, model):
        self.model = model
        
    def create_quiz_prompt(self, skill: str) -> str:
        return f"""Generate exactly 12 multiple-choice questions to assess knowledge in: {skill}.
For each question:
1. Phrase it clearly and concisely.
2. Provide 4 plausible options (labeled A-D).
3. Mark the correct answer.
4. Ensure questions progress from basic to advanced concepts.
5. Cover different aspects of the skill.
6. Avoid ambiguous wording.

Format response as JSON:
{{
    "questions": [
        {{
            "question": "Question text",
            "options": ["A. Option1", "B. Option2", "C. Option3", "D. Option4"],
            "correct_answer": "A"
        }},
        ...
    ]
}}"""

    def validate_questions(self, data: Dict) -> bool:
        if not isinstance(data, dict) or 'questions' not in data:
            return False
        questions = data['questions']
        if not isinstance(questions, list) or len(questions) != 12:
            return False
        for q in questions:
            if not all(key in q for key in ['question', 'options', 'correct_answer']):
                return False
            if len(q['options']) != 4:
                return False
            if not any(q['correct_answer'] == opt[0] for opt in q['options']):
                return False
        return True

    def generate_questions(self, skill: str) -> Tuple[Optional[Dict], Optional[str]]:
        try:
            prompt = self.create_quiz_prompt(skill)
            response = self.model.generate_content(prompt)
            json_str = re.search(r'\{.*\}', response.text, re.DOTALL).group()
            questions = json.loads(json_str)
            
            if self.validate_questions(questions):
                return questions, None
            return None, "Generated questions failed validation"
            
        except Exception as e:
            logger.error(f"Error generating questions: {traceback.format_exc()}")
            return None, str(e)

class AssessmentAnalyzer:
    def __init__(self, model):
        self.model = model
        
    def analyze_results(self, questions: List[Dict], answers: Dict[str, str]) -> Tuple[Optional[str], Optional[float], Optional[str]]:
        try:
            results = []
            correct_count = 0
            total_questions = len(questions)
            
            if not total_questions:
                return None, None, "No questions provided"
            
            processed_answers = {str(k): v for k, v in answers.items()}
            
            for i, q in enumerate(questions):
                user_answer = processed_answers.get(str(i))
                is_correct = user_answer == q['correct_answer']
                if is_correct:
                    correct_count += 1
                results.append({
                    'question': q['question'],
                    'user_answer': user_answer,
                    'correct_answer': q['correct_answer'],
                    'is_correct': is_correct
                })
            
            accuracy = (correct_count / total_questions) * 100
            
            # Generate visualization 1: Correct/Incorrect Pie Chart
            plt.figure(figsize=(6, 6))
            sns.set_style("whitegrid")
            labels = ['Correct', 'Incorrect']
            sizes = [correct_count, total_questions - correct_count]
            colors = ['#4CAF50', '#F44336']
            plt.pie(sizes, labels=labels, colors=colors, 
                   autopct='%1.1f%%', startangle=90,
                   wedgeprops={'edgecolor': 'white', 'linewidth': 2})
            plt.title('Performance Overview', fontweight='bold', pad=20)
            plt.axis('equal')
            
            pie_buffer = io.BytesIO()
            plt.savefig(pie_buffer, format='png', bbox_inches='tight')
            pie_buffer.seek(0)
            pie_base64 = base64.b64encode(pie_buffer.read()).decode('utf-8')
            plt.close()

            # Generate visualization 2: Question-wise Performance
            plt.figure(figsize=(12, 6))
            is_correct_labels = ['Correct' if res['is_correct'] else 'Incorrect' for res in results]
            correct_colors = ['#4CAF50' if res['is_correct'] else '#F44336' for res in results]
            sns.set_palette(correct_colors)
            ax = sns.barplot(x=list(range(1, total_questions+1)), 
                             y=[1]*total_questions,
                             hue=is_correct_labels,
                             dodge=False)
            plt.title('Question-wise Performance', fontweight='bold', pad=15)
            plt.xlabel('Question Number', fontweight='bold')
            plt.ylabel('')
            ax.get_yaxis().set_visible(False)
            plt.legend([], [], frameon=False)
            plt.xticks(fontweight='bold')
            
            for i, res in enumerate(results):
                plt.text(i, 0.5, 
                        f"Q{i+1}\n({res['user_answer'] or 'N/A'}/{res['correct_answer']})", 
                        ha='center', va='center',
                        color='white', fontweight='bold')

            bar_buffer = io.BytesIO()
            plt.savefig(bar_buffer, format='png', bbox_inches='tight')
            bar_buffer.seek(0)
            bar_base64 = base64.b64encode(bar_buffer.read()).decode('utf-8')
            plt.close()

            incorrect_questions = [i+1 for i, res in enumerate(results) if not res['is_correct']]
            
            report_prompt = f"""Create a detailed assessment report with:
- Brief introduction of the skill tested.
- Key strengths demonstrated.
- Main areas needing improvement.
- Recommended learning path.
- Resources for further study.

Results:
- Total questions: {total_questions}
- Correct answers: {correct_count}
- Accuracy: {accuracy:.2f}%
- Incorrect questions: {incorrect_questions}
"""
            response = self.model.generate_content(report_prompt)
            analysis_html = markdown.markdown(response.text)

            report_html = f"""
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                      max-width: 1000px; margin: 20px auto; padding: 30px;
                      background: #f8f9fa; border-radius: 10px;
                      box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h1 style="color: #2c3e50; border-bottom: 3px solid #3498db;
                         padding-bottom: 10px; margin-bottom: 30px;">
                    Skill Assessment Report
                </h1>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;
                          margin-bottom: 40px;">
                    <div style="background: white; padding: 20px; border-radius: 8px;
                             text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <h3 style="color: #3498db; margin-top: 0;">Accuracy Score</h3>
                        <div style="font-size: 2.5em; font-weight: bold; color: #2ecc71;">
                            {accuracy:.1f}%
                        </div>
                        <p><strong>Overall performance</strong>: {accuracy:.1f}%</p>
                        <img src="data:image/png;base64,{pie_base64}" 
                           style="max-width: 250px; margin: 20px auto;">
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 8px;
                             box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <h3 style="color: #3498db; margin-top: 0;">Performance Breakdown</h3>
                        <div style="margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between;
                                     margin-bottom: 8px;">
                                <span>Total Questions:</span>
                                <strong>{total_questions}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between;
                                     margin-bottom: 8px;">
                                <span>Correct Answers:</span>
                                <strong style="color: #2ecc71;">{correct_count}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Incorrect Answers:</span>
                                <strong style="color: #e74c3c;">{total_questions - correct_count}</strong>
                            </div>
                        </div>
                        <img src="data:image/png;base64,{bar_base64}" 
                           style="width: 100%; margin-top: 20px;">
                    </div>
                </div>
                <div style="background: white; padding: 25px; border-radius: 8px;
                          box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <h2 style="color: #2c3e50; margin-top: 0;">Detailed Analysis</h2>
                    <div style="line-height: 1.6; color: #34495e;">
                        {analysis_html}
                    </div>
                </div>
                <div style="margin-top: 30px; text-align: center; color: #7f8c8d;
                          font-size: 0.9em;">
                    Report generated on {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}
                </div>
            </div>
            """
            return report_html, accuracy, None
    
        except Exception as e:
            error_trace = traceback.format_exc()
            logger.error(f"Error analyzing results: {error_trace}")
            return None, None, f"Error analyzing results: {str(e)}"

# -----------------------------------------------------------
# Course Recommendation Function
# -----------------------------------------------------------
def validate_file(file) -> None:
    """Ensure the uploaded file is non-empty, HTML, and within size limits."""
    if file.filename == '':
        raise ValueError("No selected file")
    if not file.filename.endswith('.html'):
        raise ValueError("Only .html files are allowed")
    if file.content_length and file.content_length > 1024 * 1024:  # 1MB limit
        raise ValueError("File too large (max 1MB)")

def parse_performance(content: str) -> float:
    """Extract the overall performance score from the report content."""
    match = re.search(r'Overall performance\s*:\s*([\d\.]+)%', content, re.IGNORECASE)
    if not match:
        logger.warning("No performance score found in report")
        return 0.0
    try:
        return float(match.group(1))
    except ValueError:
        logger.error(f"Invalid performance score format: {match.group(1)}")
        return 0.0

def generate_prompt(content: str, performance: float) -> str:
    """Create the Gemini prompt to generate course recommendations."""
    return f"""Analyze this student report and generate personalized course recommendations:

Report Content:
{content}

Performance Score: {performance}% 

Generate detailed course recommendations in this exact JSON format:
{{
  "recommended": [
    {{
      "topic": "Category Name",
      "courses": [
        {{
          "id": "unique-id",
          "title": "Course Title",
          "platform": "Platform Name",
          "level": "Difficulty Level",
          "duration": "Course Duration",
          "progress": 0,
          "xp": 100,
          "outcomes": ["Learning Outcome 1", "Outcome 2"],
          "prerequisites": ["Prerequisite 1", "Prerequisite 2"]
        }}
      ]
    }}
  ],
  "trending": [],
  "new": []
}}

Rules:
1. Focus on areas where the student needs improvement
2. Recommend real, available courses from known platforms (Coursera, edX, Udemy)
3. Include 2-3 topics with 2-3 courses each
4. Ensure valid JSON format without any markdown
5. Return ONLY the JSON object
"""

# -----------------------------------------------------------
# Job Search Functions
# -----------------------------------------------------------


def clean_and_deduplicate_jobs(df, keyword):
    """Clean and deduplicate job listings."""
    try:
        if not df.empty:
            df['title'] = df['title'].str.lower()
            df['description'] = df['description'].str.lower()

            if keyword:
                keyword = keyword.lower()
                mask = df['title'].str.contains(keyword, na=False) | \
                       df['description'].str.contains(keyword, na=False)
                df = df[mask]

            df = df.drop_duplicates(subset=['title', 'company'], keep='first')
            df['title'] = df['title'].str.title()

        return df
    except Exception as e:
        print(f"Error cleaning jobs: {e}")
        return pd.DataFrame()


# -----------------------------------------------------------
# Initialize OpenAI client (for auto-fill resume)
# -----------------------------------------------------------
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Initialize SentenceTransformer with proper error handling
def initialize_embedder():
    try:
        logger.info("Initializing SentenceTransformer...")
        return SentenceTransformer("all-MiniLM-L6-v2")
    except Exception as e:
        logger.error(f"Error initializing SentenceTransformer: {str(e)}")
        logger.info("Falling back to simpler embedding method...")
        # Return a fallback embedder or None
        return None

embedder = initialize_embedder()

# Fallback embedding function if SentenceTransformer fails
def simple_embedding(text):
    """Very simple embedding function as a fallback"""
    import hashlib
    hash_values = []
    for i in range(0, len(text), 10):
        chunk = text[i:i+10]
        hash_obj = hashlib.md5(chunk.encode())
        hash_hex = hash_obj.hexdigest()
        # Convert first 8 chars of hex to float between -1 and 1
        val = (int(hash_hex[:8], 16) / 0xffffffff) * 2 - 1
        hash_values.append(val)
    
    # Ensure we have a consistent embedding size (384 for all-MiniLM-L6-v2)
    embedding = hash_values[:384] if len(hash_values) >= 384 else hash_values + [0] * (384 - len(hash_values))
    return np.array(embedding, dtype=np.float32)

def extract_text_from_pdf(pdf_file):
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file.read()))
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise Exception("Failed to extract text from PDF")

def split_text_into_chunks(text, chunk_size=500, overlap=50):
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        chunk = " ".join(words[start:start+chunk_size])
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks

def compute_embeddings(chunks, embedder):
    if embedder is None:
        # Use fallback embedding method
        return np.array([simple_embedding(chunk) for chunk in chunks], dtype=np.float32)
    try:
        embeddings = embedder.encode(chunks)
        return np.array(embeddings, dtype=np.float32)
    except Exception as e:
        logger.error(f"Error computing embeddings: {str(e)}")
        # Fallback to simple embedding
        return np.array([simple_embedding(chunk) for chunk in chunks], dtype=np.float32)

def retrieve_relevant_chunks(query, chunks, embeddings, embedder, k=5):
    if embedder is None:
        query_embedding = simple_embedding(query)
        query_embedding = query_embedding.reshape(1, -1)
    else:
        try:
            query_embedding = embedder.encode([query])
        except:
            query_embedding = np.array([simple_embedding(query)], dtype=np.float32)
    
    similarities = cosine_similarity(query_embedding, embeddings)[0]
    top_indices = similarities.argsort()[-k:][::-1]
    retrieved = [chunks[i] for i in top_indices if i < len(chunks)]
    return retrieved

def generate_json_from_resume(resume_text, context):
    prompt = f"""
You are an assistant that extracts resume details and outputs them in a strict JSON format.
Do not include any markdown formatting, triple backticks, or extra commentary.
Use the exact JSON template below. If a field is not found in the resume, leave it as an empty string.

JSON Template:
{{
    "personal_information": {{
        "name": "",
        "email": "",
        "phone": "",
        "location": ""
    }},
    "education": {{
        "current_level": "",
        "institution": "",
        "field": "",
        "graduation_year": "",
        "cgpa": ""
    }},
    "technical_skills": [
        {{"name": "", "level": ""}}
    ],
    "soft_skills": [
        {{"name": "", "level": ""}}
    ],
    "languages": [
        {{"name": "", "proficiency": ""}}
    ]
}}

Below is context extracted from the resume:
{context}

Based on the above, fill in the JSON template with the most likely information from the resume.
"""
    try:
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an assistant that strictly outputs valid JSON matching the provided template."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=700
        )
    except Exception as e:
        logger.error("Error using OpenAI chat completions API", exc_info=True)
        raise Exception("OpenAI API error: " + str(e))
    
    text = response.choices[0].message.content.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    
    try:
        data = json.loads(text)
        return data
    except Exception as e:
        logger.error(f"Error parsing JSON from OpenAI response: {str(e)}")
        raise Exception("Failed to parse JSON from OpenAI response")

# Initialize services for assessment functionality
assessment_manager = AssessmentManager()
question_generator = QuestionGenerator(gemini_model)
assessment_analyzer = AssessmentAnalyzer(gemini_model)

#-------------------------------------------------------

def get_improvement_suggestions(job_desc, resume_text):
    if len(resume_text.strip()) == 0:
        return "No resume text provided."
    prompt = (
        f"Job Description:\n{job_desc}\n\n"
        f"Resume Text:\n{resume_text}\n\n"
        "Provide three concrete suggestions to improve the match between the resume and the job description."
    )
    try:
        response = model.generate_content(prompt)
        suggestions = response.text.strip()
        return suggestions
    except Exception as e:
        print("Error generating suggestions:", e)
        return "Error generating suggestions."

@app.route('/api/match-jobs', methods=['POST'])
def match_jobs():
    data = request.get_json()
    jobs = data.get("jobs", [])
    resumes = data.get("resumes", [])

    updated_jobs = []
    for job in jobs:
        job_desc = job.get("description", "").strip()
        best_match = 0.0
        best_resume = None

        texts = [job_desc] + [resume.get("text", "").strip() or " " for resume in resumes]
        if len(texts) < 2:
            job["match_percentage"] = 0
            job["best_resume"] = None
        else:
            try:
                vectorizer = TfidfVectorizer(stop_words="english")
                tfidf_matrix = vectorizer.fit_transform(texts)
                sims = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
                best_index = int(np.argmax(sims))
                best_match = sims[best_index] * 100  # Convert to percentage
                best_resume = resumes[best_index]
            except Exception as e:
                print("Error computing similarity:", e)
                best_match = 0
                best_resume = None

            job["match_percentage"] = round(best_match, 2)  # Ensure it exists
            job["best_resume"] = {"id": best_resume.get("id"), "name": best_resume.get("name")} if best_resume else None

        updated_jobs.append(job)

    return jsonify(updated_jobs), 200


# -----------------------------------------------------------
# Endpoints for Assessment
# -----------------------------------------------------------

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    query = data.get('message', '')
    
    try:
        prompt = create_prompt(query)
        response = model.generate_content(prompt)
        return jsonify({
            'response': response.text,
            'status': 'success'
        })
    except Exception as e:
        return jsonify({
            'response': 'Sorry, I encountered an error. Please try again.',
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/skills', methods=['GET'])
def get_student_skills():
    technical, languages, error = assessment_manager.get_student_skills()
    if error:
        return jsonify({'status': 'error', 'message': error}), 400
    if not technical and not languages:
        return jsonify({'status': 'error', 'message': 'No skills found for student'}), 404
    return jsonify({'status': 'success', 'technical': technical, 'languages': languages})

@app.route('/api/assess', methods=['POST'])
def handle_assessment():
    try:
        data = request.json
        action = data.get('action')
        if action == 'start':
            skill = data.get('skill')
            if not skill:
                return jsonify({'error': 'Missing skill'}), 400
            questions, error = question_generator.generate_questions(skill)
            if error:
                return jsonify({'error': error}), 500
            return jsonify({'status': 'success', 'questions': questions['questions']})
        elif action == 'submit':
            questions = data.get('questions')
            answers = data.get('answers')
            skill = data.get('skill')
            if not all([questions, answers, skill]):
                missing = []
                if not questions: missing.append("questions")
                if not answers: missing.append("answers")
                if not skill: missing.append("skill")
                return jsonify({'error': f'Missing required data: {", ".join(missing)}'}), 400
            logger.info(f"Processing submission for skill: {skill}")
            logger.info(f"Number of questions: {len(questions)}")
            logger.info(f"Number of answers: {len(answers)}")
            report, accuracy, error = assessment_analyzer.analyze_results(questions, answers)
            if error:
                return jsonify({'error': error}), 500
            timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            sanitized_skill = re.sub(r'\W+', '_', skill)
            filename = f"{sanitized_skill}_{timestamp}_report.html"
            filepath = os.path.join(REPORTS_DIR, filename)
            try:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(report)
                logger.info(f"Report saved successfully to {filepath}")
            except Exception as e:
                logger.error(f"Error saving report: {str(e)}")
                download_url = None
            else:
                download_url = f'/download/{filename}'
            result = AssessmentResult(skill=skill, accuracy=accuracy, report=report, questions=questions, answers=answers)
            success, error = assessment_manager.save_assessment_result(result)
            if not success:
                return jsonify({'error': error}), 500
            return jsonify({'status': 'success', 'report': report, 'accuracy': accuracy, 'download_url': download_url})
        else:
            return jsonify({'error': 'Invalid action'}), 400
    except Exception as e:
        error_trace = traceback.format_exc()
        logger.error(f"Error in handle_assessment: {error_trace}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/download/<filename>', methods=['GET'])
def download_report(filename):
    return send_from_directory(REPORTS_DIR, filename, as_attachment=True)

# -----------------------------------------------------------
# Endpoints for Resume Auto-fill
# -----------------------------------------------------------
@app.route('/api/auto-fill-resume', methods=['POST'])
def auto_fill_resume():
    try:
        if 'resume' not in request.files:
            return jsonify({'error': 'No resume file provided', 'details': 'Please upload a PDF file'}), 400
        
        resume_file = request.files['resume']
        if resume_file.filename == '':
            return jsonify({'error': 'No file selected', 'details': 'Please select a file to upload'}), 400
        
        if not resume_file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'Invalid file format', 'details': 'Please upload a PDF file'}), 400
        
        resume_text = extract_text_from_pdf(resume_file)
        if not resume_text:
            return jsonify({'error': 'Empty PDF', 'details': 'Could not extract text from the PDF'}), 400
        
        chunks = split_text_into_chunks(resume_text, chunk_size=500, overlap=50)
        
        # Handle potential embedding issues
        try:
            embeddings = compute_embeddings(chunks, embedder)
            query = "Extract resume details for auto-fill"
            relevant_chunks = retrieve_relevant_chunks(query, chunks, embeddings, embedder, k=5)
        except Exception as e:
            logger.error(f"Error with embeddings: {str(e)}")
            # Fallback: use the first few chunks directly
            relevant_chunks = chunks[:5]
        
        context = "\n\n".join(relevant_chunks)
        
        parsed_data = generate_json_from_resume(resume_text, context)
        
        return jsonify({'success': True, 'data': parsed_data})
    
    except Exception as e:
        logger.error(f"Error processing resume: {str(e)}")
        return jsonify({'error': 'Processing failed', 'details': str(e)}), 500

# -----------------------------------------------------------
# Endpoints for Course Recommendations
# -----------------------------------------------------------
@app.route('/api/upload', methods=['POST'])
def upload_file():
    """
    Endpoint to accept an HTML report file upload, analyze its performance, and return
    course recommendations in JSON format.
    """
    try:
        if 'reportfile' not in request.files:
            logger.error("No file part in request")
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files['reportfile']
        try:
            validate_file(file)
        except ValueError as e:
            logger.error(f"File validation failed: {str(e)}")
            return jsonify({"error": str(e)}), 400

        # Secure the filename and read the file content
        filename = secure_filename(file.filename)
        content = file.read().decode('utf-8')
        performance = parse_performance(content)

        prompt = generate_prompt(content, performance)
        logger.debug(f"Generated prompt (first 200 chars): {prompt[:200]}...")
        
        try:
            response = gemini_model.generate_content(prompt)
            json_str = response.text.strip()
            logger.debug(f"Raw Gemini response (first 200 chars): {json_str[:200]}...")
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            return jsonify({"error": "Failed to generate recommendations"}), 500

        # Clean up response by stripping any markdown formatting if needed
        json_str = re.sub(r'^```json|```$', '', json_str, flags=re.IGNORECASE).strip()
        try:
            recommendations = json.loads(json_str)
            if not all(key in recommendations for key in ['recommended', 'trending', 'new']):
                raise ValueError("Invalid JSON structure")
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"JSON parsing failed: {str(e)}")
            logger.error(f"Problematic JSON: {json_str[:500]}")
            return jsonify({"error": "Invalid recommendations format", "details": str(e)}), 500

        return jsonify(recommendations)

    except Exception as e:
        logger.exception("Unexpected error in upload_file")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


@app.route('/api/jobs/search', methods=['POST'])
def search_jobs():
    try:
        data = request.json
        keyword = data.get('keyword', '')
        location = data.get('location', '')

        # Instantiate the scraper and call its scrape_jobs() method.
        scraper = TimesJobsScraper()
        scraped_jobs = scraper.scrape_jobs(keyword, location)
        
        # Check if the DataFrame is empty
        if scraped_jobs.empty:
            return jsonify({'error': 'No jobs found'}), 404

        jobs = []
        for _, row in scraped_jobs.iterrows():
            job_entry = {
                "title": row.get("title", "Untitled Position"),
                "company": row.get("company", "Unknown Company"),
                "location": row.get("location", "Remote"),
                "description": row.get("description", "No description available"),
                "skills_required": row.get("skills_required", ""),
                "experience_required": row.get("experience_required", "Not specified"),
                "job_type": row.get("job_type", "Full-time"),
                "salary_range": row.get("salary_range", "Not disclosed"),
                "date_posted": row.get("date_posted", ""),
                "url": row.get("url", "#"),
                "match_percentage": row.get("match_percentage", 0),
                "best_resume": row.get("best_resume", None),
                "improvement_suggestions": row.get("improvement_suggestions", None)
            }
            jobs.append(job_entry)

        return jsonify(jobs)
    
    except Exception as e:
        print(f"Error in search: {e}")
        return jsonify({'error': 'Search failed'}), 500


# -----------------------------------------------------------
# Global Error Handler
# -----------------------------------------------------------
@app.errorhandler(Exception)
def handle_error(error):
    response = {'status': 'error', 'message': str(error)}
    return jsonify(response), 500

# -----------------------------------------------------------
# Run the combined app on port 5001
# -----------------------------------------------------------
if __name__ == '__main__':
    app.run(debug=True, port=5001)