import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Users, BookOpen, Award, CheckCircle, Calendar, Target, Star, Plus, Edit, Trash2, Eye, Play, Brain, TrendingUp, X } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';
import { 
  COMPETENCY_DEFINITIONS, 
  SALES_QUESTION_BANK, 
  generateRandomQuestionSet, 
  QUESTION_SET_SIZE, 
  TOTAL_QUESTION_SETS,
  TEST_TIME_LIMIT 
} from '../../../data/competencyDefinitions';
import { useAuthContext } from '../../../contexts/AuthContext';

interface TestQuestion {
  id: string;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false';
  options: string[];
  correctAnswer: number;
  points: number;
  explanation?: string;
  order: number;
}

interface CompetencyTest {
  id: string;
  title: string;
  description: string;
  category: string;
  timeLimit: number;
  passingScore: number;
  questions: TestQuestion[];
  status: 'draft' | 'active' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  totalPoints: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

interface TestAttempt {
  id: string;
  testId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  startTime: string;
  endTime?: string;
  timeSpent: number;
  answers: {
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
    points: number;
    competencyId: string;
  }[];
  totalScore: number;
  percentage: number;
  passed: boolean;
  status: 'in_progress' | 'completed' | 'abandoned';
  submittedAt?: string;
  competencyScores?: {
    [competencyId: string]: {
      score: number;
      maxScore: number;
      percentage: number;
      level: 'Needs Development' | 'Developing' | 'Proficient' | 'Advanced';
    };
  };
  questionSetNumber: number;
}

interface CompetencyTestState extends CompetencyTest {
  isPreGenerated: boolean;
  questionSetNumber?: number;
}

interface TestResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  testScore: {
    score: number;
    percentage: number;
    passed: boolean;
    competencyScores?: {
      [competencyId: string]: {
        score: number;
        maxScore: number;
        percentage: number;
        level: 'Needs Development' | 'Developing' | 'Proficient' | 'Advanced';
      };
    };
  } | null;
  test: CompetencyTestState;
}

const TestResultsModal: React.FC<TestResultsModalProps> = ({ isOpen, onClose, testScore, test }) => {
  if (!isOpen || !testScore) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-secondary-800">Assessment Results</h3>
            <p className="text-secondary-600">{test.title}</p>
          </div>
          <button onClick={onClose} className="p-1 text-secondary-400 hover:text-secondary-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Score Summary - Education Tab Style */}
            <div>
              <h2 className="text-2xl font-bold text-secondary-800 mb-6">Performance Overview</h2>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center ${testScore.passed ? 'bg-green-600' : 'bg-red-600'}`}>
                    {testScore.passed ? (
                      <CheckCircle className="h-8 w-8 text-white" />
                    ) : (
                      <span className="text-white text-2xl">✗</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-secondary-800 mb-1">
                      {testScore.passed ? 'Assessment Passed!' : 'Assessment Completed'}
                    </h3>
                    <p className={`text-lg ${testScore.passed ? 'text-green-700' : 'text-red-700'} mb-1`}>
                      Final Score: {testScore.percentage}% ({testScore.score}/{test.totalPoints} points)
                    </p>
                    <p className="text-secondary-600">
                      {testScore.passed 
                        ? 'Congratulations on passing the assessment!' 
                        : `Passing score required: ${test.passingScore}%`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Competency Analysis - Education Tab Style */}
            {test.isPreGenerated && testScore.competencyScores && (
              <div>
                <h2 className="text-2xl font-bold text-secondary-800 mb-6">Skills & Competencies</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(testScore.competencyScores)
                    .filter(([_, scores]) => scores.maxScore > 0)
                    .map(([competencyId, scores]) => {
                      const competency = COMPETENCY_DEFINITIONS.find(c => c.id === competencyId);
                      if (!competency) return null;
                      
                      const getLevelColor = (level: string) => {
                        switch (level) {
                          case 'Advanced': return 'bg-green-100 text-green-800';
                          case 'Proficient': return 'bg-blue-100 text-blue-800';
                          case 'Developing': return 'bg-yellow-100 text-yellow-800';
                          case 'Needs Development': return 'bg-red-100 text-red-800';
                          default: return 'bg-gray-100 text-gray-800';
                        }
                      };

                      const getProgressColor = (percentage: number) => {
                        if (percentage >= 90) return 'bg-green-600';
                        if (percentage >= 75) return 'bg-blue-600';
                        if (percentage >= 60) return 'bg-yellow-600';
                        return 'bg-red-600';
                      };

                      return (
                        <div key={competencyId} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-secondary-800">{competency.name}</h4>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(scores.level)}`}>
                              {scores.level}
                            </span>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-secondary-600">Performance</span>
                              <span className="text-sm font-medium text-secondary-800">
                                {scores.score}/{scores.maxScore} ({scores.percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(scores.percentage)}`}
                                style={{ width: `${Math.max(scores.percentage, 5)}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-secondary-600">{competency.description}</p>
                        </div>
                      );
                    })
                  }
                </div>

                {/* Development Recommendations - Education Tab Style */}
                <div className="mt-6">
                  {Object.entries(testScore.competencyScores).filter(([_, scores]) => scores.maxScore > 0 && scores.percentage < 75).length > 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                        <h3 className="text-lg font-semibold text-secondary-800">Development Recommendations</h3>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(testScore.competencyScores)
                          .filter(([_, scores]) => scores.maxScore > 0 && scores.percentage < 75)
                          .map(([competencyId, scores]) => {
                            const competency = COMPETENCY_DEFINITIONS.find(c => c.id === competencyId);
                            if (!competency) return null;
                            
                            return (
                              <div key={competencyId} className="bg-blue-50 p-3 rounded-lg">
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                  <div>
                                    <h4 className="font-medium text-blue-900">{competency.name}</h4>
                                    <p className="text-sm text-blue-800 mt-1">
                                      Focus on improving {competency.description.toLowerCase()}. 
                                      Consider additional practice and training in this area.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-2">
                        <Star className="h-6 w-6 text-yellow-500" />
                        <h3 className="text-lg font-semibold text-green-800">Outstanding Performance!</h3>
                      </div>
                      <p className="text-secondary-600">
                        You've demonstrated excellent competency across all assessed areas. 
                        Your skills are well-developed and you're ready to take on new challenges.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const CompetencyTestPage: React.FC = () => {
  const { id, action } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [test, setTest] = useState<CompetencyTestState | null>(null);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<TestQuestion | null>(null);
  
  // Test taking state
  const [isTakingTest, setIsTakingTest] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{[questionId: string]: number}>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStartTime, setTestStartTime] = useState<Date | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [testScore, setTestScore] = useState<{
    score: number, 
    percentage: number, 
    passed: boolean,
    competencyScores?: {[competencyId: string]: {score: number, maxScore: number, percentage: number, level: string}}
  } | null>(null);

  useEffect(() => {
    if (id && id !== 'new' && id !== 'competency-assessment') {
      loadTest();
      loadAttempts();
      
      // Check if this is a take test action
      if (action === 'take') {
        setIsTakingTest(false); // Start with instructions
      }
    } else if (id === 'competency-assessment') {
      // Generate a dynamic competency assessment
      generateCompetencyAssessment();
    } else if (id === 'new') {
      setTest({
        id: '',
        title: '',
        description: '',
        category: '',
        timeLimit: 30,
        passingScore: 70,
        questions: [],
        status: 'draft',
        createdBy: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalPoints: 0,
        difficulty: 'intermediate',
        tags: [],
        isPreGenerated: false
      });
      setIsEditing(true);
      setLoading(false);
    }
  }, [id, action]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTakingTest && timeRemaining > 0 && !showResults) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            submitTest(); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTakingTest, timeRemaining, showResults]);

  const loadTest = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getById('competencyTests', id!);
      if (result.success) {
        setTest(result.data as CompetencyTest);
      }
    } catch (error) {
      console.error('Error loading test:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttempts = async () => {
    try {
      const result = await FirestoreService.getAll('testAttempts');
      if (result.success && result.data) {
        const testAttempts = (result.data as TestAttempt[]).filter(attempt => attempt.testId === id);
        setAttempts(testAttempts);
      }
    } catch (error) {
      console.error('Error loading attempts:', error);
    }
  };

  const getStats = () => {
    const completedAttempts = attempts.filter(a => a.status === 'completed');
    const totalAttempts = completedAttempts.length;
    const averageScore = totalAttempts > 0 
      ? completedAttempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts 
      : 0;
    const passRate = totalAttempts > 0 
      ? (completedAttempts.filter(a => a.passed).length / totalAttempts) * 100 
      : 0;

    return {
      totalAttempts,
      averageScore: Math.round(averageScore * 10) / 10,
      passRate: Math.round(passRate * 10) / 10
    };
  };

  const generateCompetencyAssessment = () => {
    // Generate a random question set (1-10)
    const setNumber = Math.floor(Math.random() * TOTAL_QUESTION_SETS) + 1;
    const questions = generateRandomQuestionSet(setNumber);
    
    // Convert to TestQuestion format
    const testQuestions: TestQuestion[] = questions.map((q, index) => ({
      id: q.id,
      questionText: q.questionText,
      questionType: 'multiple_choice',
      options: q.options,
      correctAnswer: q.correctAnswer,
      points: q.points,
      explanation: q.explanation,
      order: index + 1
    }));

    const totalPoints = testQuestions.reduce((sum, q) => sum + q.points, 0);

    const competencyTest: CompetencyTestState = {
      id: 'competency-assessment',
      title: 'Sales Competency Assessment',
      description: `Comprehensive assessment covering key sales competencies including prospecting, presentation skills, objection handling, closing techniques, relationship building, and customer service. This assessment contains ${QUESTION_SET_SIZE} questions and must be completed within ${TEST_TIME_LIMIT} minutes.`,
      category: 'Sales Competencies',
      timeLimit: TEST_TIME_LIMIT,
      passingScore: 70,
      questions: testQuestions,
      status: 'active',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalPoints,
      difficulty: 'intermediate',
      tags: ['sales', 'competency', 'assessment'],
      isPreGenerated: true,
      questionSetNumber: setNumber
    };

    setTest(competencyTest);
    setLoading(false);
  };

  const calculateCompetencyScores = (answers: any[], questions: any[]) => {
    const competencyScores: {[competencyId: string]: {score: number, maxScore: number, percentage: number, level: string}} = {};
    
    // Initialize competency scores
    COMPETENCY_DEFINITIONS.forEach(comp => {
      competencyScores[comp.id] = {
        score: 0,
        maxScore: 0,
        percentage: 0,
        level: 'Needs Development'
      };
    });

    // Calculate scores for each competency
    answers.forEach(answer => {
      const question = SALES_QUESTION_BANK.find(q => q.id === answer.questionId);
      if (question) {
        const competencyId = question.competencyId;
        if (competencyScores[competencyId]) {
          competencyScores[competencyId].maxScore += question.points;
          if (answer.isCorrect) {
            competencyScores[competencyId].score += question.points;
          }
        }
      }
    });

    // Calculate percentages and levels
    Object.keys(competencyScores).forEach(competencyId => {
      const competency = competencyScores[competencyId];
      if (competency.maxScore > 0) {
        competency.percentage = Math.round((competency.score / competency.maxScore) * 100);
        
        // Assign proficiency level
        if (competency.percentage >= 90) {
          competency.level = 'Advanced';
        } else if (competency.percentage >= 75) {
          competency.level = 'Proficient';
        } else if (competency.percentage >= 60) {
          competency.level = 'Developing';
        } else {
          competency.level = 'Needs Development';
        }
      }
    });

    return competencyScores;
  };

  const getDifficultyColor = (difficulty: CompetencyTest['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600';
      case 'intermediate': return 'text-yellow-600';
      case 'advanced': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const saveTest = async () => {
    if (!test) return;

    try {
      const testData = {
        ...test,
        totalPoints: test.questions.reduce((sum, q) => sum + q.points, 0),
        updatedAt: new Date().toISOString()
      };

      if (test.id) {
        // Update existing test
        const result = await FirestoreService.update('competencyTests', test.id, testData);
        if (result.success) {
          setIsEditing(false);
          alert('Test updated successfully!');
        }
      } else {
        // Create new test
        const newId = Date.now().toString(); // Simple ID generation
        const result = await FirestoreService.create('competencyTests', { ...testData, id: newId });
        if (result.success) {
          setTest({ ...testData, id: newId });
          setIsEditing(false);
          navigate(`/portal/admissions/test/${newId}`);
          alert('Test created successfully!');
        }
      }
    } catch (error) {
      console.error('Error saving test:', error);
      alert('Error saving test. Please try again.');
    }
  };

  const addQuestion = () => {
    setEditingQuestion({
      id: Date.now().toString(),
      questionText: '',
      questionType: 'multiple_choice',
      options: ['', ''],
      correctAnswer: 0,
      points: 1,
      explanation: '',
      order: (test?.questions.length || 0) + 1
    });
    setShowQuestionModal(true);
  };

  const editQuestion = (question: TestQuestion) => {
    setEditingQuestion(question);
    setShowQuestionModal(true);
  };

  const saveQuestion = (question: TestQuestion) => {
    if (!test) return;

    const updatedQuestions = question.id === editingQuestion?.id && test.questions.find(q => q.id === question.id)
      ? test.questions.map(q => q.id === question.id ? question : q)
      : [...test.questions, question];

    setTest({
      ...test,
      questions: updatedQuestions
    });
    setShowQuestionModal(false);
    setEditingQuestion(null);
  };

  const deleteQuestion = (questionId: string) => {
    if (!test) return;
    if (confirm('Are you sure you want to delete this question?')) {
      setTest({
        ...test,
        questions: test.questions.filter(q => q.id !== questionId)
      });
    }
  };

  // Test taking functions
  const startTest = () => {
    if (!test || test.questions.length === 0) {
      alert('This test has no questions yet.');
      return;
    }
    
    setIsTakingTest(true);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setTimeRemaining(test.timeLimit * 60); // Convert minutes to seconds
    setTestStartTime(new Date());
    setShowResults(false);
    setTestScore(null);
  };

  const selectAnswer = (questionId: string, answerIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const nextQuestion = () => {
    if (test && currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitTest = async () => {
    if (!test || !testStartTime) return;

    // Calculate score
    let totalScore = 0;
    const answers = test.questions.map(question => {
      const selectedAnswer = userAnswers[question.id] ?? -1;
      const isCorrect = selectedAnswer === question.correctAnswer;
      const points = isCorrect ? question.points : 0;
      totalScore += points;

      // Find competency for this question
      const salesQuestion = SALES_QUESTION_BANK.find(q => q.id === question.id);
      const competencyId = salesQuestion?.competencyId || 'unknown';

      return {
        questionId: question.id,
        selectedAnswer,
        isCorrect,
        points,
        competencyId
      };
    });

    const percentage = Math.round((totalScore / test.totalPoints) * 100);
    const passed = percentage >= test.passingScore;
    const timeSpent = Math.round((new Date().getTime() - testStartTime.getTime()) / 1000 / 60); // minutes

    // Calculate competency scores if this is a pre-generated test
    const competencyScores = test.isPreGenerated ? calculateCompetencyScores(answers, test.questions) : undefined;

    const testAttempt: Partial<TestAttempt> = {
      testId: test.id,
      applicantId: user?.uid || 'current-user',
      applicantName: user?.displayName || 'Test User',
      applicantEmail: user?.email || 'test@example.com',
      startTime: testStartTime.toISOString(),
      endTime: new Date().toISOString(),
      timeSpent,
      answers,
      totalScore,
      percentage,
      passed,
      status: 'completed',
      submittedAt: new Date().toISOString(),
      competencyScores,
      questionSetNumber: test.questionSetNumber || 1
    };

    try {
      // Save the attempt to Firebase
      const attemptId = Date.now().toString();
      await FirestoreService.create('testAttempts', { ...testAttempt, id: attemptId });
    } catch (error) {
      console.error('Error saving test attempt:', error);
    }

    // Show results in modal
    setTestScore({ 
      score: totalScore, 
      percentage, 
      passed, 
      competencyScores 
    });
    setIsTakingTest(false);
    setShowResultsModal(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-secondary-800 mb-2">Test Not Found</h2>
          <p className="text-secondary-600 mb-6">The test you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/portal/admissions')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/portal/admissions')}
              className="bg-white bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30 transition-colors duration-200"
            >
              <ArrowLeft className="h-6 w-6 text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {id === 'new' ? 'New Competency Test' : 
                 id === 'competency-assessment' && action === 'take' ? 'Sales Competency Assessment' :
                 id === 'competency-assessment' && action === 'results' ? 'Competency Assessment Results' :
                 id === 'competency-assessment' ? 'Sales Competency Assessment' :
                 action === 'take' ? `Taking: ${test.title}` : 
                 action === 'results' ? `Results: ${test.title}` : 
                 test.title}
              </h1>
              <p className="text-lg text-primary-100">
                {id === 'new' ? 'Create a new competency test to assess applicant skills' : 
                 id === 'competency-assessment' && action === 'take' ? '15 randomized questions covering key sales competencies • 30 minutes • Detailed skills analysis' :
                 id === 'competency-assessment' && action === 'results' ? 'View detailed competency breakdown and development recommendations' :
                 id === 'competency-assessment' ? 'Comprehensive assessment of sales skills and competencies with personalized feedback' :
                 action === 'take' ? `${test.questions.length} questions • ${test.timeLimit} minutes • Pass at ${test.passingScore}%` :
                 action === 'results' ? `View test results and performance analytics` :
                 'Manage test details, questions, and view results'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isTakingTest && (
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-primary-200">Time Remaining</p>
                  <p className="text-2xl font-bold">{formatTime(timeRemaining)}</p>
                </div>
              </div>
            )}
            {!isTakingTest && action !== 'take' && action !== 'results' && (
              <>
                {id && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                )}
                {isEditing && (
                  <button
                    onClick={saveTest}
                    className="bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Star className="h-4 w-4" />
                    <span>Save Test</span>
                  </button>
                )}
              </>
            )}
            <div className="bg-white bg-opacity-20 p-4 rounded-xl">
              {id === 'competency-assessment' ? (
                <Brain className="h-8 w-8 text-white" />
              ) : (
                <BookOpen className="h-8 w-8 text-white" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="p-8">
          {action === 'take' || isTakingTest || showResults ? (
            /* Take Test View */
            <div className="space-y-6">
              {!isTakingTest && !showResults ? (
                /* Pre-test Instructions */
                <div className="text-center space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-secondary-800 mb-4">
                      {id === 'competency-assessment' ? 'Ready to Take the Sales Competency Assessment?' : 'Ready to Take the Test?'}
                    </h2>
                    <p className="text-lg text-secondary-600 mb-6">
                      {id === 'competency-assessment' 
                        ? 'This assessment will evaluate your sales skills across key competencies and provide personalized feedback.'
                        : 'Please read the instructions carefully before starting.'}
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left max-w-2xl mx-auto">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">
                      {id === 'competency-assessment' ? 'Assessment Instructions:' : 'Test Instructions:'}
                    </h3>
                    <ul className="space-y-2 text-blue-700">
                      <li>• You have <strong>{test.timeLimit} minutes</strong> to complete this {id === 'competency-assessment' ? 'assessment' : 'test'}</li>
                      <li>• {id === 'competency-assessment' 
                        ? `The assessment contains ${test.questions.length} questions covering sales competencies`
                        : `The test contains ${test.questions.length} questions`}</li>
                      {id === 'competency-assessment' ? (
                        <li>• You'll receive detailed feedback on your performance in each competency area</li>
                      ) : (
                        <li>• You need <strong>{test.passingScore}%</strong> to pass</li>
                      )}
                      <li>• Once started, the timer cannot be paused</li>
                      <li>• Make sure you have a stable internet connection</li>
                      <li>• You can navigate between questions but submit only once</li>
                      {id === 'competency-assessment' && (
                        <li>• Questions are randomly selected to ensure a comprehensive evaluation</li>
                      )}
                    </ul>
                  </div>
                  
                  <button
                    onClick={startTest}
                    className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors duration-200"
                  >
                    {id === 'competency-assessment' ? 'Start Assessment' : 'Start Test'}
                  </button>
                </div>
              ) : !isTakingTest && testScore ? (
                /* Test Completed - Simple message */
                <div className="text-center space-y-6">
                  <div className="bg-blue-50 border-2 border-blue-200 p-8 rounded-xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-secondary-800 mb-2">
                      Test Completed!
                    </h2>
                    <p className="text-lg text-blue-700 mb-4">
                      Your assessment has been submitted successfully.
                    </p>
                    <button
                      onClick={() => setShowResultsModal(true)}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200"
                    >
                      View Detailed Results
                    </button>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => navigate(`/portal/admissions/test/${test.id}`)}
                      className="border border-gray-300 text-secondary-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                    >
                      View Test Details
                    </button>
                    <button
                      onClick={() => navigate('/portal/admissions')}
                      className="border border-gray-300 text-secondary-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                    >
                      Back to Tests
                    </button>
                  </div>
                </div>
              ) : (
                /* Active Test Taking */
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-secondary-800">
                        Question {currentQuestionIndex + 1} of {test.questions.length}
                      </h2>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${((currentQuestionIndex + 1) / test.questions.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {test.questions[currentQuestionIndex] && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold text-secondary-800 mb-4">
                          {test.questions[currentQuestionIndex].questionText}
                        </h3>
                        <p className="text-sm text-secondary-600 mb-4">
                          Worth {test.questions[currentQuestionIndex].points} point{test.questions[currentQuestionIndex].points !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {test.questions[currentQuestionIndex].options.map((option, index) => (
                          <label key={index} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-white cursor-pointer transition-colors duration-200">
                            <input
                              type="radio"
                              name={`question-${test.questions[currentQuestionIndex].id}`}
                              checked={userAnswers[test.questions[currentQuestionIndex].id] === index}
                              onChange={() => selectAnswer(test.questions[currentQuestionIndex].id, index)}
                              className="w-4 h-4 text-primary-600 mr-3"
                            />
                            <span className="flex-1 text-secondary-800">
                              <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                              {option}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-6">
                    <button
                      onClick={previousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-secondary-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      {/* Question indicators */}
                      {test.questions.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentQuestionIndex(index)}
                          className={`w-8 h-8 rounded-full text-sm font-medium transition-colors duration-200 ${
                            index === currentQuestionIndex
                              ? 'bg-primary-600 text-white'
                              : userAnswers[test.questions[index].id] !== undefined
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : 'bg-gray-100 text-secondary-600 border border-gray-300'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>

                    {currentQuestionIndex === test.questions.length - 1 ? (
                      <button
                        onClick={submitTest}
                        className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                      >
                        <span>{id === 'competency-assessment' ? 'Submit Assessment' : 'Submit Test'}</span>
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={nextQuestion}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                      >
                        <span>Next</span>
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : action === 'results' ? (
            /* Results View */
            <div>
              <h2 className="text-3xl font-bold text-secondary-800 mb-6">Test Results</h2>
              <div className="space-y-4">
                {attempts.filter(a => a.status === 'completed').map((attempt) => (
                  <div key={attempt.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-secondary-800">{attempt.applicantName}</h3>
                        <p className="text-sm text-secondary-600">{attempt.applicantEmail}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {attempt.percentage}%
                        </p>
                        <p className="text-sm text-secondary-600">{attempt.timeSpent}m</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Default Edit/View */
            <div className="space-y-8">
              {/* Test Information */}
              <div>
                <h2 className="text-3xl font-bold text-secondary-800 mb-6 flex items-center space-x-3">
                  <BookOpen className="h-8 w-8 text-primary-600" />
                  <span>Test Information</span>
                </h2>
                {isEditing ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">Test Title</label>
                          <input
                            type="text"
                            value={test.title}
                            onChange={(e) => setTest({ ...test, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">Category</label>
                          <input
                            type="text"
                            value={test.category}
                            onChange={(e) => setTest({ ...test, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">Time Limit (minutes)</label>
                          <input
                            type="number"
                            min="5"
                            max="240"
                            value={test.timeLimit}
                            onChange={(e) => setTest({ ...test, timeLimit: parseInt(e.target.value) || 30 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">Passing Score (%)</label>
                          <input
                            type="number"
                            min="50"
                            max="100"
                            value={test.passingScore}
                            onChange={(e) => setTest({ ...test, passingScore: parseInt(e.target.value) || 70 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Description</label>
                      <textarea
                        value={test.description}
                        onChange={(e) => setTest({ ...test, description: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-lg text-secondary-600">
                    <p className="text-lg leading-relaxed">{test.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-secondary-600 mb-1">Difficulty</p>
                        <p className={`text-lg font-semibold ${getDifficultyColor(test.difficulty)}`}>
                          {test.difficulty.charAt(0).toUpperCase() + test.difficulty.slice(1)}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-secondary-600 mb-1">Total Points</p>
                        <p className="text-lg font-semibold text-secondary-800">{test.totalPoints}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Questions */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-secondary-800 flex items-center space-x-3">
                    <Target className="h-8 w-8 text-accent-600" />
                    <span>Questions ({test.questions.length})</span>
                  </h2>
                  {isEditing && (
                    <button
                      onClick={addQuestion}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Question</span>
                    </button>
                  )}
                </div>
                {test.questions.length > 0 ? (
                  <div className="space-y-4">
                    {test.questions.sort((a, b) => a.order - b.order).map((question, index) => (
                      <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start space-x-4">
                          <div className="bg-primary-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-secondary-800 mb-2">
                              {question.questionText}
                            </h3>
                            <div className="space-y-1">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className={`flex items-center space-x-2 ${
                                  optIndex === question.correctAnswer ? 'text-green-700 font-medium' : 'text-secondary-600'
                                }`}>
                                  <span className="w-4 text-center">{String.fromCharCode(65 + optIndex)}.</span>
                                  <span>{option}</span>
                                  {optIndex === question.correctAnswer && (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  )}
                                </div>
                              ))}
                            </div>
                            {question.explanation && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                <p className="text-sm text-blue-700"><strong>Explanation:</strong> {question.explanation}</p>
                              </div>
                            )}
                            <p className="text-sm text-secondary-500 mt-2">{question.points} points</p>
                          </div>
                          {isEditing && (
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() => editQuestion(question)}
                                className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                                title="Edit question"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteQuestion(question.id)}
                                className="p-2 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                title="Delete question"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-8 rounded-lg text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No questions added yet. Start building your test!</p>
                  </div>
                )}
              </div>

              {/* Statistics */}
              {!isEditing && test.id && (
                <div>
                  <h2 className="text-3xl font-bold text-secondary-800 mb-6">Test Statistics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Attempts</h3>
                      <p className="text-3xl font-bold text-blue-900">{stats.totalAttempts}</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">Average Score</h3>
                      <p className="text-3xl font-bold text-green-900">{stats.averageScore}%</p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-purple-800 mb-2">Pass Rate</h3>
                      <p className="text-3xl font-bold text-purple-900">{stats.passRate}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Question Modal */}
      {showQuestionModal && editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-secondary-800 mb-4">
              {test?.questions.find(q => q.id === editingQuestion.id) ? 'Edit Question' : 'Add Question'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Question Text</label>
                <textarea
                  value={editingQuestion.questionText}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Question Type</label>
                  <select
                    value={editingQuestion.questionType}
                    onChange={(e) => {
                      const newType = e.target.value as 'multiple_choice' | 'true_false';
                      setEditingQuestion({
                        ...editingQuestion,
                        questionType: newType,
                        options: newType === 'true_false' ? ['True', 'False'] : ['', '']
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Points</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingQuestion.points}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, points: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Options</label>
                {editingQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <span className="w-6 text-center">{String.fromCharCode(65 + index)}.</span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...editingQuestion.options];
                        newOptions[index] = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: newOptions });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={editingQuestion.correctAnswer === index}
                      onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: index })}
                      className="w-4 h-4 text-primary-600"
                    />
                    {editingQuestion.questionType === 'multiple_choice' && editingQuestion.options.length > 2 && (
                      <button
                        onClick={() => {
                          const newOptions = editingQuestion.options.filter((_, i) => i !== index);
                          setEditingQuestion({
                            ...editingQuestion,
                            options: newOptions,
                            correctAnswer: editingQuestion.correctAnswer >= index ? Math.max(0, editingQuestion.correctAnswer - 1) : editingQuestion.correctAnswer
                          });
                        }}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {editingQuestion.questionType === 'multiple_choice' && editingQuestion.options.length < 6 && (
                  <button
                    onClick={() => setEditingQuestion({
                      ...editingQuestion,
                      options: [...editingQuestion.options, '']
                    })}
                    className="text-primary-600 hover:text-primary-700 text-sm flex items-center space-x-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Option</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Explanation (Optional)</label>
                <textarea
                  value={editingQuestion.explanation || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowQuestionModal(false);
                  setEditingQuestion(null);
                }}
                className="px-4 py-2 border border-gray-300 text-secondary-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => saveQuestion(editingQuestion)}
                disabled={!editingQuestion.questionText.trim() || editingQuestion.options.some(opt => !opt.trim())}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Results Modal */}
      <TestResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        testScore={testScore}
        test={test!}
      />
    </div>
  );
};

export default CompetencyTestPage; 