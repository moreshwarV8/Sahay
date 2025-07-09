import os
import sys
import datetime
from pathlib import Path
import PyPDF2
import docx
import google.generativeai as genai

# Configure Gemini API
GEMINI_API_KEY = "AIzaSyBDQfBKivNhofiw4_rqgQ46wMaf99XB6fM"  # Replace with your actual API key
genai.configure(api_key=GEMINI_API_KEY)

def extract_text_from_pdf(file_path):
    text = ""
    with open(file_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page in pdf_reader.pages:
            text += page.extract_text()
    return text

def extract_text_from_docx(file_path):
    doc = docx.Document(file_path)
    text = ""
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text

def extract_text_from_file(file_path):
    file_extension = Path(file_path).suffix.lower()[1:]
    if file_extension == 'pdf':
        return extract_text_from_pdf(file_path)
    elif file_extension == 'docx':
        return extract_text_from_docx(file_path)
    elif file_extension == 'txt':
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
            return file.read()
    return ""

def evaluate_resume_with_gemini(resume_text):
    model = genai.GenerativeModel('gemini-1.5-pro')
    prompt = """
    Please analyze the following resume and provide:
    1. An overall score out of 100.
    2. Scores for different categories (format, content, relevance, clarity, impact statements, skills presentation) out of 100.
    3. Specific feedback for improvement in each category.
    4. Recommendations to achieve a better score.
    
    Return the results as a valid JSON object with the following structure:
    {
        "overall_score": 85,
        "category_scores": {
            "format": 80,
            "content": 85,
            "relevance": 90,
            "clarity": 75,
            "impact_statements": 70,
            "skills_presentation": 85
        },
        "feedback": {
            "format": "Feedback on format...",
            "content": "Feedback on content...",
            "relevance": "Feedback on relevance...",
            "clarity": "Feedback on clarity...",
            "impact_statements": "Feedback on impact statements...",
            "skills_presentation": "Feedback on skills presentation..."
        },
        "recommendations": [
            "Recommendation 1",
            "Recommendation 2",
            "Recommendation 3",
            "Recommendation 4",
            "Recommendation 5"
        ]
    }
    
    The resume is as follows:
    
    """ + resume_text

    sys.stderr.write("Sending resume to Gemini for evaluation...\n")
    
    try:
        response = model.generate_content(prompt)
        response_text = response.text
        # Extract JSON part (if wrapped in markdown) or use entire text
        if "```json" in response_text:
            json_str = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            json_str = response_text.split("```")[1].strip()
        else:
            json_str = response_text
        
        import json
        result = json.loads(json_str)
    except Exception as e:
        sys.stderr.write(f"Error with Gemini API: {e}\n")
        result = {
            "overall_score": 0,
            "category_scores": {
                "format": 0,
                "content": 0,
                "relevance": 0,
                "clarity": 0,
                "impact_statements": 0,
                "skills_presentation": 0
            },
            "feedback": {"error": f"Failed to analyze resume: {str(e)}"},
            "recommendations": ["Try a different file format or check API key."]
        }
    
    return result

def generate_html_report(result, resume_filename):
    def get_color(score):
        if score >= 80:
            return "green"
        elif score >= 60:
            return "orange"
        else:
            return "red"
    
    def generate_progress_bar(score):
        color_class = "success" if score >= 80 else "warning" if score >= 60 else "danger"
        return f"""
        <div class="progress">
            <div class="progress-bar bg-{color_class}" role="progressbar" 
                 style="width: {score}%;" aria-valuenow="{score}" 
                 aria-valuemin="0" aria-valuemax="100">{score}%</div>
        </div>
        """
    
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resume Evaluation Results</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body {{
                background-color: #f8f9fa;
                padding: 2rem;
            }}
            .results-container {{
                max-width: 800px;
                margin: 0 auto;
                background-color: #fff;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
                padding: 2rem;
            }}
            .header {{
                text-align: center;
                margin-bottom: 2rem;
            }}
            .score-circle {{
                width: 120px;
                height: 120px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2rem;
                font-weight: bold;
                color: white;
                margin: 0 auto 1.5rem;
            }}
            .feedback-card {{
                margin-bottom: 1rem;
                border-left: 5px solid #007bff;
            }}
            .recommendation-item {{
                background-color: #f8f9fa;
                border-left: 4px solid #28a745;
                padding: 1rem;
                margin-bottom: 0.5rem;
                border-radius: 0 4px 4px 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="results-container">
                <div class="header">
                    <h1>Resume Evaluation Results</h1>
                    <p class="text-muted">File: {resume_filename}</p>
                    <p class="text-muted">Evaluated on: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
                </div>
                <div class="text-center mb-4">
                    <div class="score-circle" style="background-color: {get_color(result['overall_score'])};">
                        {result['overall_score']}/100
                    </div>
                    <h3>Overall Score</h3>
                </div>
                <div class="card mb-4">
                    <div class="card-header bg-primary text-white">
                        <h4 class="mb-0">Category Scores</h4>
                    </div>
                    <div class="card-body">
    """
    for category, score in result["category_scores"].items():
        category_display = category.replace('_', ' ').title()
        html += f"""
        <div class="mb-3">
            <div class="d-flex justify-content-between">
                <label>{category_display}</label>
                <span>{score}/100</span>
            </div>
            {generate_progress_bar(score)}
        </div>
        """
    html += """
                    </div>
                </div>
                <div class="card mb-4">
                    <div class="card-header bg-info text-white">
                        <h4 class="mb-0">Detailed Feedback</h4>
                    </div>
                    <div class="card-body">
    """
    for category, feedback in result["feedback"].items():
        if category == "error":
            html += f"""
            <div class="alert alert-danger" role="alert">
                {feedback}
            </div>
            """
        else:
            category_display = category.replace('_', ' ').title()
            html += f"""
            <div class="card feedback-card mb-3">
                <div class="card-body">
                    <h5 class="card-title">{category_display}</h5>
                    <p class="card-text">{feedback}</p>
                </div>
            </div>
            """
    html += """
                    </div>
                </div>
                <div class="card">
                    <div class="card-header bg-success text-white">
                        <h4 class="mb-0">Recommendations for Improvement</h4>
                    </div>
                    <div class="card-body">
    """
    for recommendation in result["recommendations"]:
        html += f"""
        <div class="recommendation-item">
            {recommendation}
        </div>
        """
    html += """
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return html

def main():
    # Use file path argument if provided; otherwise, use file dialog.
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        file_path = filedialog.askopenfilename(
            title="Select Resume File",
            filetypes=[("Resume Files", "*.pdf;*.docx;*.txt"), ("All Files", "*.*")]
        )
        if not file_path:
            sys.stderr.write("No file selected.\n")
            print("No file selected.", file=sys.stdout)
            return

    file_name = os.path.basename(file_path)
    sys.stderr.write(f"Analyzing: {file_name}\n")
    resume_text = extract_text_from_file(file_path)
    if not resume_text:
        sys.stderr.write("Could not extract text from the file.\n")
        print("Could not extract text from the file.", file=sys.stdout)
        return

    sys.stderr.write(f"Extracted {len(resume_text)} characters from the resume.\n")
    result = evaluate_resume_with_gemini(resume_text)
    
    # If '--json' flag is provided, output only JSON.
    if '--json' in sys.argv:
        import json
        print(json.dumps(result))
    else:
        html_report = generate_html_report(result, file_name)
        print(html_report)

if __name__ == "__main__":
    main()
