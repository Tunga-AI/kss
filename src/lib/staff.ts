'use client';
import { setDoc, doc, Firestore, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Staff } from './staff-types';

export async function createStaffProfile(db: Firestore, user: { name: string, email: string, avatar?: string, role: string }, jobTitle: string, forcedId: string) {
    try {
        const id = forcedId;
        const staffData: Staff = {
            id,
            name: user.name,
            email: user.email,
            avatar: user.avatar || '',
            role: user.role,
            jobTitle,
            status: 'Active',
            createdAt: serverTimestamp() as any,
        };

        await setDoc(doc(db, 'staff', id), staffData);
        return id;
    } catch (serverError: any) {
        const permissionError = new FirestorePermissionError({
            path: '/staff',
            operation: 'create',
            requestResourceData: { user, jobTitle },
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    }
}

export function updateStaff(db: Firestore, staffId: string, staff: Partial<Staff>) {
    const staffRef = doc(db, 'staff', staffId);
    return updateDoc(staffRef, { ...staff, updatedAt: serverTimestamp() })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: staffRef.path,
                operation: 'update',
                requestResourceData: staff,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw serverError;
        });
}

export function deleteStaff(db: Firestore, staffId: string) {
    const staffRef = doc(db, 'staff', staffId);
    return deleteDoc(staffRef)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: staffRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw serverError;
        });
}
