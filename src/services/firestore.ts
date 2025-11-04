import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  WhereFilterOp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Interface for query conditions
interface QueryCondition {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

// Generic Firestore service functions
export class FirestoreService {
  // Create a new document
  static async create(collectionName: string, data: any) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { success: true, id: docRef.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Update an existing document
  static async update(collectionName: string, docId: string, data: any) {
    try {
      await updateDoc(doc(db, collectionName, docId), {
        ...data,
        updatedAt: Timestamp.now()
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Delete a document
  static async delete(collectionName: string, docId: string) {
    try {
      await deleteDoc(doc(db, collectionName, docId));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get a single document
  static async getById(collectionName: string, docId: string) {
    try {
      const docSnap = await getDoc(doc(db, collectionName, docId));
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'Document not found' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get all documents from a collection
  static async getAll(collectionName: string) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: documents };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get documents with a query
  static async getWithQuery(collectionName: string, conditions: QueryCondition[] = [], orderByField?: string, limitCount?: number) {
    try {
      let q = query(collection(db, collectionName));
      
      // Apply where conditions
      conditions.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });

      // Apply ordering
      if (orderByField) {
        q = query(q, orderBy(orderByField));
      }

      // Apply limit
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, data: documents };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Create or update a document with a specific ID
  static async createOrUpdate(collectionName: string, docId: string, data: any) {
    try {
      await setDoc(doc(db, collectionName, docId), {
        ...data,
        updatedAt: Timestamp.now()
      }, { merge: true });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get available intakes (application deadline hasn't passed)
  static async getAvailableIntakes(programId?: string) {
    try {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Set to start of today
      
      let conditions: QueryCondition[] = [
        { field: 'applicationDeadline', operator: '>=' as WhereFilterOp, value: Timestamp.fromDate(currentDate) }
      ];
      
      // Add program filter if specified
      if (programId) {
        conditions.push({ field: 'programId', operator: '==' as WhereFilterOp, value: programId });
      }
      
      const result = await this.getWithQuery('intakes', conditions, 'startDate');
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Specific service functions for different entities
export class StudentService extends FirestoreService {
  static async createStudent(studentData: any) {
    return this.create('students', studentData);
  }

  static async getStudentsByProgram(programId: string) {
    return this.getWithQuery('students', [
      { field: 'programId', operator: '==', value: programId }
    ]);
  }
}

export class StaffService extends FirestoreService {
  static async createStaff(staffData: any) {
    return this.create('staff', staffData);
  }

  static async getStaffByDepartment(department: string) {
    return this.getWithQuery('staff', [
      { field: 'department', operator: '==', value: department }
    ]);
  }
}

export class ProgramService extends FirestoreService {
  static async createProgram(programData: any) {
    return this.create('programs', programData);
  }

  static async getActivePrograms() {
    return this.getWithQuery('programs', [
      { field: 'status', operator: '==', value: 'active' }
    ]);
  }

  static async getProgramsByInstitution(institutionId: string) {
    return this.getWithQuery('programs', [
      { field: 'institutionId', operator: '==', value: institutionId }
    ]);
  }

  static async updateProgramStatus(programId: string, status: 'draft' | 'active' | 'archived') {
    return this.update('programs', programId, { status });
  }

  static async getBySlug(slug: string) {
    const result = await this.getWithQuery('programs', [
      { field: 'slug', operator: '==', value: slug }
    ]);
    
    if (result.success && result.data && result.data.length > 0) {
      return {
        success: true,
        data: result.data[0]
      };
    }
    
    return {
      success: false,
      error: 'Program not found'
    };
  }
}

export class EventService extends FirestoreService {
  static async createEvent(eventData: any) {
    return this.create('events', eventData);
  }

  static async getUpcomingEvents() {
    return this.getWithQuery('events', [
      { field: 'date', operator: '>=', value: Timestamp.now() }
    ], 'date');
  }

  static async getBySlug(slug: string) {
    const result = await this.getWithQuery('events', [
      { field: 'slug', operator: '==', value: slug }
    ]);
    
    if (result.success && result.data && result.data.length > 0) {
      return {
        success: true,
        data: result.data[0]
      };
    }
    
    return {
      success: false,
      error: 'Event not found'
    };
  }

  static async getPublicEvents() {
    return this.getWithQuery('events', [
      { field: 'isPublic', operator: '==', value: true }
    ]);
  }
}

export class CustomerService extends FirestoreService {
  static async createCustomer(customerData: any) {
    return this.create('customers', customerData);
  }

  static async getCustomersByStatus(status: string) {
    return this.getWithQuery('customers', [
      { field: 'status', operator: '==', value: status }
    ], 'submittedDate');
  }

  static async getCustomersByPriority(priority: string) {
    return this.getWithQuery('customers', [
      { field: 'priority', operator: '==', value: priority }
    ], 'submittedDate');
  }

  static async getCustomersByProgram(programId: string) {
    return this.getWithQuery('customers', [
      { field: 'programId', operator: '==', value: programId }
    ], 'submittedDate');
  }

  static async getCustomersBySource(source: string) {
    return this.getWithQuery('customers', [
      { field: 'source', operator: '==', value: source }
    ], 'submittedDate');
  }

  static async getCustomersByAssignedTo(assignedTo: string) {
    return this.getWithQuery('customers', [
      { field: 'assignedTo', operator: '==', value: assignedTo }
    ], 'submittedDate');
  }

  static async getRecentCustomers(limitCount: number = 10) {
    return this.getWithQuery('customers', [], 'submittedDate', limitCount);
  }

  static async updateCustomerStatus(customerId: string, status: string) {
    return this.update('customers', customerId, { 
      status,
      lastContactDate: Timestamp.now()
    });
  }

  static async updateCustomerPriority(customerId: string, priority: string) {
    return this.update('customers', customerId, { priority });
  }

  static async assignCustomer(customerId: string, assignedTo: string, assignedToName: string) {
    return this.update('customers', customerId, { 
      assignedTo,
      assignedToName,
      lastContactDate: Timestamp.now()
    });
  }

  static async addCustomerNote(noteData: any) {
    return this.create('customerNotes', noteData);
  }

  static async getCustomerNotes(customerId: string) {
    return this.getWithQuery('customerNotes', [
      { field: 'customerId', operator: '==', value: customerId }
    ], 'createdAt');
  }

  static async convertToApplication(customerId: string, applicationData: any) {
    // First create the application
    const applicationResult = await this.create('applicants', applicationData);
    
    if (applicationResult.success) {
      // Update customer status to converted
      await this.update('customers', customerId, {
        status: 'converted',
        conversionDate: Timestamp.now(),
        conversionType: 'application'
      });
    }
    
    return applicationResult;
  }
}