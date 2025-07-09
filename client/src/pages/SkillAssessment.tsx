import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import axios from "axios";

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
}

interface AssessmentResult {
  report: string;
  accuracy: number;
  download_url?: string;
}

const SkillAssessmentPage: React.FC = () => {
  const [technical, setTechnical] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [skillAssessments, setSkillAssessments] = useState<{ [key: string]: number }>({});
  const [activeAssessment, setActiveAssessment] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [index: string]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [assessmentReport, setAssessmentReport] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [submissionAttempted, setSubmissionAttempted] = useState(false);

  const API_BASE_URL = 'http://localhost:5001';

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/skills`);
      
      if (response.data.status === 'success') {
        setTechnical(response.data.technical || []);
        setLanguages(response.data.languages || []);
      } else {
        setError(response.data.message || "Failed to load skills.");
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
      setError("Failed to load skills. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableAssessments = () => {
    return [...technical, ...languages];
  };

  const startAssessment = async (skill: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/assess`, {
        action: 'start',
        skill
      });
      
      if (response.data.status === 'success') {
        setQuestions(response.data.questions);
        setActiveAssessment(skill);
        setAnswers({});
        setIsSubmitted(false);
        setCurrentQuestionIndex(0);
        setAssessmentReport(null);
        setDownloadUrl(null);
        setSubmissionAttempted(false);
      } else {
        setError(response.data.error || 'Failed to fetch questions');
      }
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      setError(error.response?.data?.error || 'Failed to start assessment. Please try again.');
    }
    setLoading(false);
  };

  const handleAnswerChange = (index: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [index.toString()]: answer }));
  };

  const submitAssessment = async () => {
    setLoading(true);
    setError(null);
    setSubmissionAttempted(true);
    
    try {
      // Validate we have all required answers
      if (Object.keys(answers).length < questions.length) {
        setError('Please answer all questions before submitting');
        setLoading(false);
        return;
      }
      
      console.log("Submitting assessment data:", {
        skill: activeAssessment,
        questionsCount: questions.length,
        answersCount: Object.keys(answers).length
      });
      
      const response = await axios.post(`${API_BASE_URL}/api/assess`, {
        action: 'submit',
        skill: activeAssessment,
        questions,
        answers
      });

      if (response.data.status === 'success') {
        setSkillAssessments(prev => ({ 
          ...prev, 
          [activeAssessment!]: response.data.accuracy 
        }));
        setAssessmentReport(response.data.report);
        setDownloadUrl(response.data.download_url || null);
        setIsSubmitted(true);
      } else {
        setError(response.data.error || 'Failed to submit assessment');
      }
    } catch (error: any) {
      console.error('Error submitting assessment:', error);
      setError(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to submit assessment. Please try again.'
      );
    }
    setLoading(false);
  };

  const availableAssessments = getAvailableAssessments();

  const retrySubmission = () => {
    setError(null);
    submitAssessment();
  };

  if (loading && !activeAssessment) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-2xl font-semibold text-blue-600 animate-pulse">Loading, please wait</p>
      </div>
    );
  }

  if (error && !activeAssessment) return <p className="text-red-600 p-6">{error}</p>;
  if (!technical.length && !languages.length) return <p className="p-6">No skills found.</p>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Skill Assessment Dashboard</h1>
        {activeAssessment && <Button onClick={() => setActiveAssessment(null)}>Back to Dashboard</Button>}
      </header>

      {activeAssessment ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{activeAssessment} - {isSubmitted ? 'Assessment Results' : `Question ${currentQuestionIndex + 1} of ${questions.length}`}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <p className="text-lg font-semibold text-blue-600 animate-pulse">Processing...</p>
                </div>
              ) : error && submissionAttempted ? (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                  <Button onClick={retrySubmission}>Retry Submission</Button>
                </div>
              ) : !isSubmitted ? (
                <>
                  <p className="text-xl font-medium mb-4">{questions[currentQuestionIndex]?.question}</p>
                  <RadioGroup 
                    value={answers[currentQuestionIndex.toString()] || ""} 
                    onValueChange={value => handleAnswerChange(currentQuestionIndex, value)}
                  >
                    {questions[currentQuestionIndex]?.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={option[0]} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <div className="flex justify-between mt-6">
                    <Button 
                      variant="outline" 
                      disabled={currentQuestionIndex === 0} 
                      onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    >
                      Previous
                    </Button>
                    <Button 
                      onClick={currentQuestionIndex === questions.length - 1 ? submitAssessment : () => setCurrentQuestionIndex(prev => prev + 1)}
                      disabled={!answers[currentQuestionIndex.toString()]}
                    >
                      {currentQuestionIndex === questions.length - 1 ? 'Submit' : 'Next'}
                    </Button>
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="mt-6">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{Object.keys(answers).length} of {questions.length} answered</span>
                    </div>
                    <Progress value={(Object.keys(answers).length / questions.length) * 100} className="h-2" />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div 
                    className="prose max-w-none" 
                    dangerouslySetInnerHTML={{ __html: assessmentReport || '' }} 
                  />
                  {downloadUrl && (
                    <div className="pt-4 border-t">
                      <Button 
                        as="a" 
                        href={`${API_BASE_URL}${downloadUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        Download Report
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Your Skills</CardTitle></CardHeader>
            <CardContent>
              {availableAssessments.length > 0 ? (
                availableAssessments.map(skill => (
                  <div key={skill} className="mb-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{skill}</span>
                      <span>{skillAssessments[skill]?.toFixed(1) || '0.0'}%</span>
                    </div>
                    <Progress value={skillAssessments[skill] || 0} className="h-2" />
                  </div>
                ))
              ) : (
                <p>No skills available yet. Please contact your instructor.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Available Assessments</CardTitle></CardHeader>
            <CardContent>
              {availableAssessments.length > 0 ? (
                availableAssessments.map(skill => (
                  <div key={skill} className="border rounded-lg p-4 hover:shadow-md mb-4 transition-shadow">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-semibold">{skill}</h4>
                      <Badge>{skillAssessments[skill] ? 'Completed' : 'Available'}</Badge>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => startAssessment(skill)}
                      variant={skillAssessments[skill] ? "outline" : "default"}
                    >
                      {skillAssessments[skill] ? 'Retake Assessment' : 'Start Assessment'}
                    </Button>
                  </div>
                ))
              ) : (
                <p>No assessments available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SkillAssessmentPage;