import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { FirestoreService } from './firestore';
import { 
  Instructor, 
  InstructorAssignment, 
  InstructorScheduleRequest, 
  InstructorAvailabilityCheck 
} from '../types/instructor';

const COLLECTION_NAME = 'instructors';
const ASSIGNMENTS_COLLECTION = 'instructor_assignments';

export class InstructorService {
  // Create a new instructor
  static async createInstructor(instructor: Instructor): Promise<string> {
    try {
      const instructorData = {
        ...instructor,
        currentLoad: 0,
        status: instructor.status || 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // First, create the instructor record
      const docRef = await addDoc(collection(db, COLLECTION_NAME), instructorData);
      console.log('✅ Instructor created with ID:', docRef.id);
      
      // Then, create a user account for the instructor
      try {
        const displayName = `${instructor.firstName} ${instructor.lastName}`;
        
        // Check if user already exists with this email
        const existingUserResult = await FirestoreService.getWithQuery('users', [
          { field: 'email', operator: '==', value: instructor.email }
        ]);
        
        if (!existingUserResult.data || existingUserResult.data.length === 0) {
          // Create new user record for the instructor
          const userDoc = {
            email: instructor.email,
            displayName: displayName,
            role: 'instructor',
            status: 'active',
            phoneNumber: instructor.phoneNumber || '',
            hasFirebaseAuth: false, // They will create Firebase auth on first login
            instructorId: docRef.id, // Link to instructor record
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          };
          
          const userResult = await FirestoreService.create('users', userDoc);
          
          if (userResult.success) {
            console.log('✅ User account created for instructor:', userResult.id);
            
            // Update instructor record with user ID
            await updateDoc(doc(db, COLLECTION_NAME, docRef.id), {
              userId: userResult.id
            });
          } else {
            console.warn('⚠️ Failed to create user account for instructor');
          }
        } else {
          console.log('ℹ️ User with this email already exists, linking to instructor record');
          const existingUser = existingUserResult.data[0];
          
          // Update existing user to have instructor role
          await FirestoreService.update('users', existingUser.id, {
            role: 'instructor',
            instructorId: docRef.id,
            updatedAt: new Date().toISOString()
          });
          
          // Update instructor record with user ID
          await updateDoc(doc(db, COLLECTION_NAME, docRef.id), {
            userId: existingUser.id
          });
        }
      } catch (userError) {
        console.error('❌ Error creating user account for instructor:', userError);
        // Don't throw - instructor was created successfully, just user account failed
      }
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating instructor:', error);
      throw error;
    }
  }

  // Get all instructors
  static async getAllInstructors(): Promise<Instructor[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('firstName', 'asc')
      );
      const snapshot = await getDocs(q);
      
      const instructors: Instructor[] = [];
      snapshot.forEach(doc => {
        instructors.push({ id: doc.id, ...doc.data() } as Instructor);
      });

      console.log(`✅ Fetched ${instructors.length} instructors`);
      return instructors;
    } catch (error) {
      console.error('❌ Error fetching instructors:', error);
      throw error;
    }
  }

  // Get active instructors only
  static async getActiveInstructors(): Promise<Instructor[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'active'),
        orderBy('firstName', 'asc')
      );
      const snapshot = await getDocs(q);
      
      const instructors: Instructor[] = [];
      snapshot.forEach(doc => {
        instructors.push({ id: doc.id, ...doc.data() } as Instructor);
      });

      console.log(`✅ Fetched ${instructors.length} active instructors`);
      return instructors;
    } catch (error) {
      console.error('❌ Error fetching active instructors:', error);
      throw error;
    }
  }

  // Get instructor by ID
  static async getInstructorById(instructorId: string): Promise<Instructor | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, instructorId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Instructor;
      } else {
        console.log('No instructor found with ID:', instructorId);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching instructor:', error);
      throw error;
    }
  }

  // Get instructors by subject/specialization
  static async getInstructorsBySubject(subject: string): Promise<Instructor[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('subjects', 'array-contains', subject),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      
      const instructors: Instructor[] = [];
      snapshot.forEach(doc => {
        instructors.push({ id: doc.id, ...doc.data() } as Instructor);
      });

      console.log(`✅ Found ${instructors.length} instructors for subject: ${subject}`);
      return instructors;
    } catch (error) {
      console.error('❌ Error fetching instructors by subject:', error);
      throw error;
    }
  }

  // Check instructor availability for a specific time slot
  static async checkInstructorAvailability(
    instructorId: string, 
    date: string, 
    startTime: string, 
    endTime: string
  ): Promise<InstructorAvailabilityCheck> {
    try {
      // Get instructor details
      const instructor = await this.getInstructorById(instructorId);
      if (!instructor) {
        return {
          instructorId,
          date,
          startTime,
          endTime,
          isAvailable: false,
          conflicts: ['Instructor not found']
        };
      }

      // Check if instructor is active
      if (instructor.status !== 'active') {
        return {
          instructorId,
          date,
          startTime,
          endTime,
          isAvailable: false,
          conflicts: ['Instructor is not active']
        };
      }

      // Check day of week availability
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      const dayAvailability = instructor.availability?.find(
        slot => slot.dayOfWeek === dayOfWeek && slot.isAvailable
      );

      if (!dayAvailability) {
        return {
          instructorId,
          date,
          startTime,
          endTime,
          isAvailable: false,
          conflicts: [`Instructor not available on ${dayOfWeek}`]
        };
      }

      // Check time slot availability
      if (startTime < dayAvailability.startTime || endTime > dayAvailability.endTime) {
        return {
          instructorId,
          date,
          startTime,
          endTime,
          isAvailable: false,
          conflicts: [`Outside instructor's available hours (${dayAvailability.startTime} - ${dayAvailability.endTime})`]
        };
      }

      // Check for conflicts with existing assignments
      const q = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where('instructorId', '==', instructorId),
        where('sessionDate', '==', date),
        where('status', '==', 'confirmed')
      );
      const snapshot = await getDocs(q);
      
      const conflicts: string[] = [];
      snapshot.forEach(doc => {
        const assignment = doc.data() as InstructorAssignment;
        // Check for time overlap
        if (assignment.sessionTime) {
          const [assignedStart] = assignment.sessionTime.split(' - ');
          const [, assignedEnd] = assignment.sessionTime.split(' - ');
          
          if (
            (startTime >= assignedStart && startTime < assignedEnd) ||
            (endTime > assignedStart && endTime <= assignedEnd) ||
            (startTime <= assignedStart && endTime >= assignedEnd)
          ) {
            conflicts.push(assignment.sessionId || 'Unknown session');
          }
        }
      });

      return {
        instructorId,
        date,
        startTime,
        endTime,
        isAvailable: conflicts.length === 0,
        conflicts
      };
    } catch (error) {
      console.error('❌ Error checking instructor availability:', error);
      throw error;
    }
  }

  // Get available instructors for a specific schedule request
  static async getAvailableInstructors(request: InstructorScheduleRequest): Promise<Instructor[]> {
    try {
      // First, get instructors who can teach the subject
      const qualifiedInstructors = await this.getInstructorsBySubject(request.subject);
      
      // Check availability for each instructor
      const availableInstructors: Instructor[] = [];
      
      for (const instructor of qualifiedInstructors) {
        if (instructor.id) {
          const endTime = this.calculateEndTime(request.requiredTime, request.duration);
          const availability = await this.checkInstructorAvailability(
            instructor.id,
            request.requiredDate,
            request.requiredTime,
            endTime
          );
          
          if (availability.isAvailable) {
            availableInstructors.push(instructor);
          }
        }
      }

      console.log(`✅ Found ${availableInstructors.length} available instructors for the request`);
      return availableInstructors;
    } catch (error) {
      console.error('❌ Error getting available instructors:', error);
      throw error;
    }
  }

  // Assign instructor to a session
  static async assignInstructorToSession(assignment: InstructorAssignment): Promise<string> {
    try {
      const assignmentData = {
        ...assignment,
        status: assignment.status || 'confirmed',
        assignedDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create assignment record
      const docRef = await addDoc(collection(db, ASSIGNMENTS_COLLECTION), assignmentData);
      
      // Update instructor's current load and assigned sessions
      const instructorRef = doc(db, COLLECTION_NAME, assignment.instructorId);
      const instructor = await this.getInstructorById(assignment.instructorId);
      
      if (instructor) {
        const assignedSessions = instructor.assignedSessions || [];
        const assignedIntakes = instructor.assignedIntakes || [];
        
        if (assignment.sessionId && !assignedSessions.includes(assignment.sessionId)) {
          assignedSessions.push(assignment.sessionId);
        }
        
        if (!assignedIntakes.includes(assignment.intakeId)) {
          assignedIntakes.push(assignment.intakeId);
        }
        
        await updateDoc(instructorRef, {
          assignedSessions,
          assignedIntakes,
          currentLoad: assignedSessions.length,
          updatedAt: new Date().toISOString()
        });
      }

      console.log('✅ Instructor assigned successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error assigning instructor:', error);
      throw error;
    }
  }

  // Get assignments for an instructor
  static async getInstructorAssignments(instructorId: string): Promise<InstructorAssignment[]> {
    try {
      const q = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where('instructorId', '==', instructorId),
        orderBy('sessionDate', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const assignments: InstructorAssignment[] = [];
      snapshot.forEach(doc => {
        assignments.push({ id: doc.id, ...doc.data() } as InstructorAssignment);
      });

      console.log(`✅ Fetched ${assignments.length} assignments for instructor`);
      return assignments;
    } catch (error) {
      console.error('❌ Error fetching instructor assignments:', error);
      throw error;
    }
  }

  // Get assignments for an intake
  static async getIntakeAssignments(intakeId: string): Promise<InstructorAssignment[]> {
    try {
      const q = query(
        collection(db, ASSIGNMENTS_COLLECTION),
        where('intakeId', '==', intakeId),
        where('status', '==', 'confirmed'),
        orderBy('sessionDate', 'asc')
      );
      const snapshot = await getDocs(q);
      
      const assignments: InstructorAssignment[] = [];
      snapshot.forEach(doc => {
        assignments.push({ id: doc.id, ...doc.data() } as InstructorAssignment);
      });

      console.log(`✅ Fetched ${assignments.length} assignments for intake`);
      return assignments;
    } catch (error) {
      console.error('❌ Error fetching intake assignments:', error);
      throw error;
    }
  }

  // Update instructor details
  static async updateInstructor(instructorId: string, updates: Partial<Instructor>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, instructorId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Instructor updated successfully');
      
      // Also update the user record if email or name changed
      if (updates.email || updates.firstName || updates.lastName || updates.phoneNumber) {
        try {
          // Get the instructor to find the linked user
          const instructorDoc = await getDoc(docRef);
          if (instructorDoc.exists()) {
            const instructorData = instructorDoc.data();
            
            // If there's a userId, update the user record
            if (instructorData.userId) {
              const userUpdates: any = {
                updatedAt: new Date().toISOString()
              };
              
              if (updates.email) userUpdates.email = updates.email;
              if (updates.phoneNumber) userUpdates.phoneNumber = updates.phoneNumber;
              if (updates.firstName || updates.lastName) {
                const firstName = updates.firstName || instructorData.firstName;
                const lastName = updates.lastName || instructorData.lastName;
                userUpdates.displayName = `${firstName} ${lastName}`;
              }
              
              await FirestoreService.update('users', instructorData.userId, userUpdates);
              console.log('✅ User record updated for instructor');
            } else {
              // If no userId, try to find user by email and link
              const currentEmail = updates.email || instructorData.email;
              if (currentEmail) {
                const userResult = await FirestoreService.getWithQuery('users', [
                  { field: 'email', operator: '==', value: currentEmail }
                ]);
                
                if (userResult.data && userResult.data.length > 0) {
                  const user = userResult.data[0];
                  await FirestoreService.update('users', user.id, {
                    role: 'instructor',
                    instructorId: instructorId,
                    updatedAt: new Date().toISOString()
                  });
                  
                  // Link the user to the instructor
                  await updateDoc(docRef, {
                    userId: user.id
                  });
                  console.log('✅ Linked existing user to instructor');
                }
              }
            }
          }
        } catch (userError) {
          console.error('⚠️ Error updating user record for instructor:', userError);
          // Don't throw - instructor update was successful
        }
      }
    } catch (error) {
      console.error('❌ Error updating instructor:', error);
      throw error;
    }
  }

  // Cancel an assignment
  static async cancelAssignment(assignmentId: string): Promise<void> {
    try {
      const docRef = doc(db, ASSIGNMENTS_COLLECTION, assignmentId);
      await updateDoc(docRef, {
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Assignment cancelled successfully');
    } catch (error) {
      console.error('❌ Error cancelling assignment:', error);
      throw error;
    }
  }

  // Helper function to calculate end time
  private static calculateEndTime(startTime: string, duration: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  // Delete instructor (soft delete by setting status to inactive)
  static async deleteInstructor(instructorId: string): Promise<void> {
    try {
      await this.updateInstructor(instructorId, { status: 'inactive' });
      console.log('✅ Instructor marked as inactive');
    } catch (error) {
      console.error('❌ Error deleting instructor:', error);
      throw error;
    }
  }
}