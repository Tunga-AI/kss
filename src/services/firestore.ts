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
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

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
  static async getWithQuery(collectionName: string, conditions: any[] = [], orderByField?: string, limitCount?: number) {
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
}