import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut, Unsubscribe } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserSession } from '../types/fee';

export function useAuthHandshake() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let activeProfileUnsub: Unsubscribe | null = null;

    // 1. Establish top-level Firebase Authentication observer
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous profile subscription if user changes
      if (activeProfileUnsub) {
        activeProfileUnsub();
        activeProfileUnsub = null;
      }

      if (!firebaseUser) {
        // Purge session tokens instantly if base auth state is revoked
        setSession(null);
        setLoading(false);
        return;
      }

      // 2. Attach real-time database listener to fetch role-based permissions (RBAC)
      const userDocRef = doc(db, 'users', firebaseUser.uid);

      activeProfileUnsub = onSnapshot(
        userDocRef,
        (docSnapshot) => {
          if (!docSnapshot.exists()) {
            // Check if user is verified system administrator bootstrap account
            const userEmail = (firebaseUser.email || '').toLowerCase();
            if (userEmail === 'kumaripallawi061@gmail.com' && firebaseUser.emailVerified) {
              setSession({
                role: 'admin',
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'System Administrator',
                emailOrPhone: firebaseUser.email || 'kumaripallawi061@gmail.com',
                staffDesignation: 'Institutional App & Systems Administrator',
                staffRole: 'App_Admin',
                isAppAdmin: true,
                profilePicture: firebaseUser.photoURL || undefined,
                canManageCertificateThemes: true,
              });
              setLoading(false);
              return;
            }

            // Fallback: If student or newly registered account is awaiting document creation
            setSession({
              role: 'student',
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Registered Student',
              emailOrPhone: firebaseUser.email || '',
              studentRefId: firebaseUser.uid,
              isAppAdmin: false,
            });
            setLoading(false);
            return;
          }

          const userData = docSnapshot.data();
          const userStatus = String(userData.status || '').trim().toLowerCase();

          // Terminate session instantly if status changes to suspended or inactive (case-insensitive)
          if (userStatus === 'suspended' || userStatus === 'inactive') {
            console.warn('Your access right has been revoked by administration. Terminating session.');
            signOut(auth).catch(() => {});
            setSession(null);
            setLoading(false);
            return;
          }

          // 3. Establish verified session handshake token
          setSession({
            role: userData.role === 'admin' ? 'admin' : 'student',
            id: firebaseUser.uid,
            name: userData.name || firebaseUser.displayName || 'Authorized User',
            emailOrPhone: userData.email || firebaseUser.email || '',
            rollNo: userData.rollNo,
            studentRefId: userData.studentRefId || firebaseUser.uid,
            staffDesignation: userData.designation,
            staffRole: userData.staffRole,
            isAppAdmin: userData.staffRole === 'App_Admin' || userData.role === 'admin',
            profilePicture: userData.profilePicture || firebaseUser.photoURL || undefined,
            canManageCertificateThemes: Boolean(userData.canManageCertificateThemes || userData.staffRole === 'App_Admin'),
          });
          setLoading(false);
        },
        (error) => {
          console.error('Security context tracking handshake exception: ', error);
          setSession(null);
          setLoading(false);
        }
      );
    });

    return () => {
      if (activeProfileUnsub) {
        activeProfileUnsub();
      }
      unsubscribeAuth();
    };
  }, []);

  return { session, setSession, loading };
}
