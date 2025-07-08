import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Users, BookOpen, Award, CheckCircle, Calendar, Target, Star, Plus, Edit, Trash2, Eye, Play } from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';

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
  }[];
  totalScore: number;
  percentage: number;
  passed: boolean;
  status: 'in_progress' | 'completed' | 'abandoned';
  submittedAt?: string;
}

const CompetencyTestPage: React.FC = () => {
  const { id, action } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<CompetencyTest | null>(null);
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
  const [testScore, setTestScore] = useState<{score: number, percentage: number, passed: boolean} | null>(null);

  useEffect(() => {
    if (id && id !== 'new') {
      loadTest();
      loadAttempts();
      
      // Check if this is a take test action
      if (action === 'take') {
        setIsTakingTest(false); // Start with instructions
      }
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
        tags: []
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

      return {
        questionId: question.id,
        selectedAnswer,
        isCorrect,
        points
      };
    });

    const percentage = Math.round((totalScore / test.totalPoints) * 100);
    const passed = percentage >= test.passingScore;
    const timeSpent = Math.round((new Date().getTime() - testStartTime.getTime()) / 1000 / 60); // minutes

    const testAttempt: Partial<TestAttempt> = {
      testId: test.id,
      applicantId: 'current-user', // This would come from auth context
      applicantName: 'Test User', // This would come from auth context
      applicantEmail: 'test@example.com', // This would come from auth context
      startTime: testStartTime.toISOString(),
      endTime: new Date().toISOString(),
      timeSpent,
      answers,
      totalScore,
      percentage,
      passed,
      status: 'completed',
      submittedAt: new Date().toISOString()
    };

    try {
      // Save the attempt to Firebase
      const attemptId = Date.now().toString();
      await FirestoreService.create('testAttempts', { ...testAttempt, id: attemptId });
    } catch (error) {
      console.error('Error saving test attempt:', error);
    }

    // Show results
    setTestScore({ score: totalScore, percentage, passed });
    setShowResults(true);
    setIsTakingTest(false);
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
                 action === 'take' ? `Taking: ${test.title}` : 
                 action === 'results' ? `Results: ${test.title}` : 
                 test.title}
              </h1>
              <p className="text-lg text-primary-100">
                {id === 'new' ? 'Create a new competency test to assess applicant skills' : 
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
              <BookOpen className="h-8 w-8 text-white" />
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
                    <h2 className="text-3xl font-bold text-secondary-800 mb-4">Ready to Take the Test?</h2>
                    <p className="text-lg text-secondary-600 mb-6">
                      Please read the instructions carefully before starting.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left max-w-2xl mx-auto">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">Test Instructions:</h3>
                    <ul className="space-y-2 text-blue-700">
                      <li>• You have <strong>{test.timeLimit} minutes</strong> to complete this test</li>
                      <li>• The test contains <strong>{test.questions.length} questions</strong></li>
                      <li>• You need <strong>{test.passingScore}%</strong> to pass</li>
                      <li>• Once started, the timer cannot be paused</li>
                      <li>• Make sure you have a stable internet connection</li>
                      <li>• You can navigate between questions but submit only once</li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={startTest}
                    className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors duration-200"
                  >
                    Start Test
                  </button>
                </div>
              ) : showResults ? (
                /* Test Results */
                <div className="text-center space-y-6">
                  <div className={`p-8 rounded-xl ${testScore?.passed ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${testScore?.passed ? 'bg-green-600' : 'bg-red-600'}`}>
                      {testScore?.passed ? (
                        <CheckCircle className="h-8 w-8 text-white" />
                      ) : (
                        <span className="text-white text-2xl">✗</span>
                      )}
                    </div>
                    <h2 className="text-3xl font-bold text-secondary-800 mb-2">
                      {testScore?.passed ? 'Congratulations!' : 'Test Complete'}
                    </h2>
                    <p className={`text-lg ${testScore?.passed ? 'text-green-700' : 'text-red-700'}`}>
                      You scored {testScore?.percentage}% ({testScore?.score}/{test.totalPoints} points)
                    </p>
                    <p className="text-secondary-600 mt-2">
                      {testScore?.passed ? 'You have passed this test!' : `You need ${test.passingScore}% to pass.`}
                    </p>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => navigate(`/portal/admissions/test/${test.id}`)}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200"
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
                        <span>Submit Test</span>
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
                    <div className="grid grid-cols-2 gap-4 mt-6">
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

              <div className="grid grid-cols-2 gap-4">
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
    </div>
  );
};

export default CompetencyTestPage; 