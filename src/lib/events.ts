import { doc, setDoc, deleteDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import type { Event } from './event-types';

export const addEvent = async (firestore: any, eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
        const eventsRef = collection(firestore, 'events');
        const newEventRef = doc(eventsRef);
        const newEvent = {
            ...eventData,
            id: newEventRef.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        await setDoc(newEventRef, newEvent);
        console.log("Event successfully added");
        return newEventRef.id;
    } catch (error) {
        console.error("Error writing event: ", error);
        throw error;
    }
};

export const updateEvent = async (firestore: any, id: string, eventData: Partial<Event>) => {
    try {
        const eventRef = doc(firestore, 'events', id);
        await updateDoc(eventRef, {
            ...eventData,
            updatedAt: serverTimestamp(),
        });
        console.log("Event successfully updated");
    } catch (error) {
        console.error("Error updating event: ", error);
        throw error;
    }
};

export const deleteEvent = async (firestore: any, id: string) => {
    try {
        const eventRef = doc(firestore, 'events', id);
        await deleteDoc(eventRef);
        console.log("Event successfully deleted");
    } catch (error) {
        console.error("Error deleting event: ", error);
        throw error;
    }
};
