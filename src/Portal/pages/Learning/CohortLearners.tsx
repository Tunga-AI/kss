import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  Search, 
  Phone,
  Calendar,
  BookOpen,
  TrendingUp,
  Plus,
  Download
} from 'lucide-react';
import { FirestoreService } from '../../../services/firestore';

interface Learner {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  enrollmentDate?: string;
  academicStatus: 'active' | 'inactive' | 'completed' | 'suspended' | 'withdrawn';
  cohortId?: string;
  cohortName?: string;
  programId?: string;
  currentGPA?: number;
  progress?: number;
  profileImage?: string;
  totalFees?: number;
  amountPaid?: number;
  outstandingBalance?: number;
}

interface Cohort {
  id: string;
  cohortId: string;
  name: string;
  startDate: string;
  maxStudents?: number;
}

const CohortLearners: React.FC = () => {
  const navigate = useNavigate();
  const { cohortId } = useParams<{ cohortId: string }>();
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cohortId) {
      loadCohortData();
      loadLearners();
    }
  }, [cohortId]);

  const loadCohortData = async () => {
    if (!cohortId) return;
    try {
      const result = await FirestoreService.getById('cohorts', cohortId);
      if (result.success && result.data) {
        setCohort(result.data as Cohort);
      }
    } catch (error) {
      console.error('Error loading cohort:', error);
    }
  };

  const loadLearners = async () => {
    setLoading(true);
    try {
      const result = await FirestoreService.getWithQuery('learners', [
        { field: 'cohortId', operator: '==', value: cohortId }
      ]);
      
      if (result.success && result.data) {
        setLearners(result.data as Learner[]);
      }
    } catch (error) {
      console.error('Error loading learners:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-primary-600 text-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/portal/learning')}
              className="p-2 text-primary-100 hover:text-white transition-colors duration-200 bg-white bg-opacity-20 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-4xl font-bold mb-2">Cohort Learners</h1>
              <p className="text-lg text-primary-100">
                {cohort ? `${cohort.name} (${cohort.cohortId})` : 'Manage learners in this cohort'}
              </p>
            </div>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <Users className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-secondary-800 mb-6">
          Learners ({learners.length})
        </h2>
        {learners.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Learners Enrolled</h3>
            <p className="text-secondary-600">No learners have been enrolled in this cohort yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learners.map((learner) => (
              <div key={learner.id} className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-secondary-800">
                  {learner.firstName} {learner.lastName}
                </h3>
                <p className="text-sm text-secondary-600">{learner.email}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CohortLearners;
