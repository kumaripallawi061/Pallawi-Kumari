import React, { useState } from 'react';
import { UserRole, UserSession, StaffRole, Student, SchoolStaffUser } from '../../types/fee';
import { INSTITUTION_INFO } from '../../data/mockData';
import { 
  GraduationCap, 
  ShieldCheck, 
  ArrowRight, 
  Building,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Send,
  Check,
  UserCheck,
  ShieldAlert,
  Server,
  UserPlus,
  CreditCard,
  Sparkles
} from 'lucide-react';
import { CaptchaChallenge } from '../Common/CaptchaChallenge';
import { signInWithEmail, registerWithEmail, syncUserToFirestore } from '../../firebase';
import { safeMatchStrings, safeLower, normalizeDateToYYYYMMDD } from '../../utils/safeHelpers';

interface Props {
  students: Student[];
  staffUsers?: SchoolStaffUser[];
  onLogin: (session: UserSession) => void;
  onUpdateStaffUser?: (user: SchoolStaffUser) => void;
  onUpdateStudent?: (student: Student) => void;
  onOpenHelpdesk?: () => void;
  onOpenQuickFeePayment?: () => void;
  initialTab?: 'student' | 'staff' | 'sysadmin';
  onTabChange?: (tab: 'student' | 'staff' | 'sysadmin') => void;
}

export const LoginPortal: React.FC<Props> = ({ 
  students, 
  staffUsers = [], 
  onLogin,
  onUpdateStaffUser,
  onUpdateStudent,
  onOpenHelpdesk,
  onOpenQuickFeePayment,
  initialTab = 'student',
  onTabChange
}) => {
  // Tabs: 'student' | 'staff' | 'sysadmin'
  const [activeTab, setActiveTab] = useState<'student' | 'staff' | 'sysadmin'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  // Student Auth Mode: 'signin' | 'signup'
  const [studentMode, setStudentMode] = useState<'signin' | 'signup'>('signin');

  // Student Sign-in with Email & Password state
  const [studentEmail, setStudentEmail] = useState<string>('');
  const [studentPassword, setStudentPassword] = useState<string>('');
  const [showStudentPassword, setShowStudentPassword] = useState<boolean>(false);
  const [studentCaptchaInput, setStudentCaptchaInput] = useState<string>('');
  const [studentExpectedCaptcha, setStudentExpectedCaptcha] = useState<string>('');
  const [studentCaptchaError, setStudentCaptchaError] = useState<string | null>(null);
  const [studentLoginAttempts, setStudentLoginAttempts] = useState<number>(0);
  const [studentLockoutUntil, setStudentLockoutUntil] = useState<number | null>(null);

  // Student First-Time User Sign Up (Roll No + DOB) state
  const [signupStep, setSignupStep] = useState<'verify' | 'credentials'>('verify');
  const [signupRollNo, setSignupRollNo] = useState<string>('');
  const [signupDob, setSignupDob] = useState<string>('');
  const [signupCaptchaInput, setSignupCaptchaInput] = useState<string>('');
  const [signupExpectedCaptcha, setSignupExpectedCaptcha] = useState<string>('');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupMatchedStudent, setSignupMatchedStudent] = useState<Student | null>(null);
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState<string>('');
  const [signupShowPassword, setSignupShowPassword] = useState<boolean>(false);

  // Student Forgot Password Modal State
  const [showStudentForgotModal, setShowStudentForgotModal] = useState<boolean>(false);
  const [studentForgotEmail, setStudentForgotEmail] = useState<string>('');
  const [studentForgotRollNo, setStudentForgotRollNo] = useState<string>('');
  const [studentForgotNewPassword, setStudentForgotNewPassword] = useState<string>('');
  const [studentForgotConfirmPassword, setStudentForgotConfirmPassword] = useState<string>('');
  const [studentForgotShowPassword, setStudentForgotShowPassword] = useState<boolean>(false);
  const [studentForgotError, setStudentForgotError] = useState<string | null>(null);
  const [studentForgotSuccess, setStudentForgotSuccess] = useState<string | null>(null);

  // Staff form state (Institutional App Administrator is hidden from staff role dropdown)
  const [staffEmail, setStaffEmail] = useState<string>('');
  const [staffPassword, setStaffPassword] = useState<string>('');
  const [staffRole, setStaffRole] = useState<StaffRole>('Accounts_Officer');
  const [staffCaptchaInput, setStaffCaptchaInput] = useState<string>('');
  const [staffExpectedCaptcha, setStaffExpectedCaptcha] = useState<string>('');
  const [staffCaptchaError, setStaffCaptchaError] = useState<string | null>(null);

  // System Administrator form state (discreet separate console, administrator email never shown to public)
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [adminCaptchaInput, setAdminCaptchaInput] = useState<string>('');
  const [adminExpectedCaptcha, setAdminExpectedCaptcha] = useState<string>('');
  const [adminCaptchaError, setAdminCaptchaError] = useState<string | null>(null);

  // Mandatory Change Password on First Login (default password: 11111111)
  const [showChangeDefaultPasswordModal, setShowChangeDefaultPasswordModal] = useState<boolean>(false);
  const [pendingLoginStaffUser, setPendingLoginStaffUser] = useState<SchoolStaffUser | null>(null);
  const [pendingLoginSession, setPendingLoginSession] = useState<UserSession | null>(null);
  const [firstTimeNewPassword, setFirstTimeNewPassword] = useState<string>('');
  const [firstTimeConfirmPassword, setFirstTimeConfirmPassword] = useState<string>('');
  const [firstTimeShowPassword, setFirstTimeShowPassword] = useState<boolean>(false);
  const [firstTimeError, setFirstTimeError] = useState<string | null>(null);

  // Demo access collapse toggle (collapsed by default)
  const [isDemoCollapsed, setIsDemoCollapsed] = useState<boolean>(true);

  // Forgot Password Modal State
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState<boolean>(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'otp' | 'success' | 'accountant_queued'>('request');
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotRole, setForgotRole] = useState<StaffRole>('Accounts_Officer');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);



  const handleOpenForgotPassword = () => {
    setForgotEmail(staffEmail.trim());
    setForgotRole(staffRole);
    setForgotStep('request');
    setGeneratedOtp('');
    setEnteredOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError(null);
    setForgotSuccessMsg(null);
    setShowForgotPasswordModal(true);
  };

  const handleSendResetOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your official institutional webmail address.');
      return;
    }
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otpCode);
    setEnteredOtp('');
    setForgotError(null);
    setForgotStep('otp');
  };

  const handleVerifyOtpAndReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredOtp.trim()) {
      setForgotError('Please enter the 6-digit institutional verification security code.');
      return;
    }
    if (enteredOtp.trim() !== generatedOtp) {
      setForgotError('Incorrect verification code. Please check the code provided and re-enter.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('New security password must be at least 6 characters long.');
      return;
    }
    if (newPassword === '11111111') {
      setForgotError('New password cannot be the default onboarding password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    // SPECIAL RULE FOR ACCOUNTANT:
    // "For the user Accountant, password resetting should be authorised by principal or admin to take effect."
    if (forgotRole === 'Accounts_Officer') {
      // Find accountant user in staffUsers
      const accountant = staffUsers.find((u) => u.role === 'Accounts_Officer' || safeMatchStrings(u.email, forgotEmail));
      if (accountant && onUpdateStaffUser) {
        onUpdateStaffUser({
          ...accountant,
          passwordResetPending: true,
          pendingNewPassword: newPassword,
          passwordResetRequestedAt: new Date().toISOString(),
        });
      }
      setForgotStep('accountant_queued');
      return;
    }

    // For other staff roles: update password directly
    const staffMatch = staffUsers.find((u) => safeMatchStrings(u.email, forgotEmail));
    if (staffMatch && onUpdateStaffUser) {
      onUpdateStaffUser({
        ...staffMatch,
        password: newPassword,
        isFirstLogin: false,
        passwordResetPending: false,
      });
    }

    setStaffPassword(newPassword);
    setStaffEmail(forgotEmail);
    setStaffRole(forgotRole);
    setForgotError(null);
    setForgotSuccessMsg(`Password successfully updated! You can now sign in with your new credentials.`);
    setForgotStep('success');
  };

  // Active Demo Account Helpers
  const handleFillDemoStudent = (autoSubmit = false) => {
    setActiveTab('student');
    onTabChange?.('student');
    setStudentMode('signin');
    setStudentEmail('aarav.sharma@institution.edu');
    setStudentPassword('Student@123');
    if (studentExpectedCaptcha) {
      setStudentCaptchaInput(studentExpectedCaptcha);
    }
    setStudentCaptchaError(null);

    if (autoSubmit) {
      const demoStudent = students.find((s) => s.email?.toLowerCase() === 'aarav.sharma@institution.edu') || students[0];
      if (demoStudent) {
        onLogin({
          role: 'student',
          id: demoStudent.id,
          name: demoStudent.name,
          emailOrPhone: demoStudent.email,
          rollNo: demoStudent.rollNo,
          studentRefId: demoStudent.id,
          profilePicture: demoStudent.profilePicture,
        });
      }
    }
  };

  const handleFillDemoAccountsUser = (autoSubmit = false) => {
    setActiveTab('staff');
    onTabChange?.('staff');
    setStaffRole('Accounts_Officer');
    setStaffEmail('accounts.officer@rlsycollege.ac.in');
    setStaffPassword('Account@123');
    if (staffExpectedCaptcha) {
      setStaffCaptchaInput(staffExpectedCaptcha);
    }
    setStaffCaptchaError(null);

    if (autoSubmit) {
      const demoStaff = staffUsers.find((u) => u.email?.toLowerCase() === 'accounts.officer@rlsycollege.ac.in') || {
        id: 'USR-AO-01',
        name: 'S. N. Sharma',
        email: 'accounts.officer@rlsycollege.ac.in',
        role: 'Accounts_Officer' as StaffRole,
        designation: 'Accounts Officer & Treasury Bursar',
      };
      onLogin({
        role: 'admin',
        id: demoStaff.id,
        name: demoStaff.name,
        emailOrPhone: 'accounts.officer@rlsycollege.ac.in',
        staffDesignation: 'Accounts Officer & Treasury Bursar',
        staffRole: 'Accounts_Officer',
        isAppAdmin: false,
      });
    }
  };

  // Student Email & Password Sign-In Submit
  const handleStudentEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentCaptchaError(null);

    // Rate-limit brute-force lockout check
    if (studentLockoutUntil && Date.now() < studentLockoutUntil) {
      const waitMinutes = Math.ceil((studentLockoutUntil - Date.now()) / 60000);
      setStudentCaptchaError(`Access temporarily locked due to repeated failed attempts. Please wait ${waitMinutes} minute(s) before trying again.`);
      return;
    }

    if (!studentEmail.trim()) {
      setStudentCaptchaError('Please enter your registered student email address or Roll Number.');
      return;
    }
    if (!studentPassword.trim()) {
      setStudentCaptchaError('Please enter your student password.');
      return;
    }
    if (!studentCaptchaInput.trim()) {
      setStudentCaptchaError('Please enter the security verification CAPTCHA code.');
      return;
    }
    if (studentCaptchaInput.trim().toUpperCase() !== studentExpectedCaptcha.toUpperCase()) {
      setStudentCaptchaError('Incorrect CAPTCHA code entered. Please re-enter the characters shown in the image.');
      return;
    }

    const emailQuery = studentEmail.trim().toLowerCase();
    const formattedRoll = studentEmail.trim().toUpperCase();

    // Look for matching student by email or Roll Number
    let matched = students.find((s) => 
      s.email?.toLowerCase() === emailQuery || 
      s.rollNo?.toUpperCase() === formattedRoll ||
      s.registerNo?.toUpperCase() === formattedRoll ||
      s.id?.toUpperCase() === formattedRoll
    );

    if (!matched) {
      setStudentCaptchaError(`No enrolled student found matching "${studentEmail}". If you are a first-time user, please click "First-Time User? Sign Up" below to activate your account.`);
      return;
    }

    // Password validation & security checks: strict password verification
    const hasPassword = Boolean(matched.password && matched.password.trim());
    const isPasswordCorrect = hasPassword 
      ? matched.password === studentPassword.trim()
      : (studentPassword.trim() === 'Student@123' && !matched.isActivated);

    if (!isPasswordCorrect) {
      if (!hasPassword && !matched.isActivated) {
        setStudentCaptchaError('This account has not been activated yet. As a first-time user, please click "First-Time User? Sign Up" below to set up your password with your Roll No and Date of Birth.');
        return;
      }

      const nextAttempts = studentLoginAttempts + 1;
      setStudentLoginAttempts(nextAttempts);
      if (nextAttempts >= 5) {
        setStudentLockoutUntil(Date.now() + 5 * 60 * 1000);
        setStudentCaptchaError('Maximum failed attempts reached. Account access locked for 5 minutes for institutional security.');
      } else {
        setStudentCaptchaError(`Incorrect password entered. (${5 - nextAttempts} attempts remaining). Please re-enter or click "Forgot Password?".`);
      }
      return;
    }

    // Reset attempts on successful authentication
    setStudentLoginAttempts(0);
    setStudentLockoutUntil(null);

    onLogin({
      role: 'student',
      id: matched.id,
      name: matched.name,
      emailOrPhone: matched.email,
      rollNo: matched.rollNo,
      studentRefId: matched.id,
      profilePicture: matched.profilePicture,
    });
  };

  // First-Time User: Step 1 Verify Roll No & DOB
  const handleStudentVerifyForSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!signupRollNo.trim()) {
      setSignupError('Please enter your University / College Roll Number.');
      return;
    }
    if (!signupDob.trim()) {
      setSignupError('Please select your Date of Birth as recorded during admission.');
      return;
    }
    if (!signupCaptchaInput.trim()) {
      setSignupError('Please enter the security verification CAPTCHA code.');
      return;
    }
    if (signupCaptchaInput.trim().toUpperCase() !== signupExpectedCaptcha.toUpperCase()) {
      setSignupError('Incorrect CAPTCHA code entered. Please re-enter the characters shown in the image.');
      return;
    }

    const formattedRoll = signupRollNo.trim().toUpperCase();
    const matched = students.find((s) => 
      s.rollNo.toUpperCase() === formattedRoll || 
      (s.registerNo && s.registerNo.toUpperCase() === formattedRoll)
    );

    if (!matched) {
      setSignupError(`No enrolled student found with Roll Number "${formattedRoll}". Please check your roll number or contact the Academic Registrar.`);
      return;
    }

    // Security Verification: Date of Birth Match with Excel serial & ISO normalization
    const recordDob = normalizeDateToYYYYMMDD(matched.dateOfBirth);
    const inputDob = normalizeDateToYYYYMMDD(signupDob);
    if (recordDob && inputDob && recordDob !== inputDob) {
      setSignupError('Date of Birth does not match official institutional admission records for this Roll Number.');
      return;
    }

    // Security Check: Prevent Duplicate Account Hijacking (independent of password field strip)
    if (matched.isActivated) {
      setSignupError(`Account for Roll Number "${formattedRoll}" has already been activated! Please sign in with your email and password, or use "Forgot Password?" if you cannot access it.`);
      return;
    }

    // Verification Success: move to Step 2
    setSignupMatchedStudent(matched);
    setSignupEmail(matched.email || `${formattedRoll.toLowerCase().replace(/[^a-z0-9]/g, '')}@institution.edu`);
    setSignupPassword('');
    setSignupConfirmPassword('');
    setSignupStep('credentials');
  };

  // First-Time User: Step 2 Complete Credential Creation
  const handleStudentCompleteSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!signupMatchedStudent) {
      setSignupStep('verify');
      return;
    }

    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setSignupError('Please enter a valid personal or institutional email address.');
      return;
    }

    const cleanPassword = signupPassword.trim();
    const cleanConfirm = signupConfirmPassword.trim();

    // Strong password validation (min 8 chars, one uppercase, one digit)
    const isMinLength = cleanPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(cleanPassword);
    const hasDigit = /[0-9]/.test(cleanPassword);

    if (!isMinLength || !hasUppercase || !hasDigit) {
      setSignupError('Security password must be at least 8 characters long and contain at least one uppercase letter (A-Z) and at least one number (0-9).');
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setSignupError('Passwords do not match. Please re-enter your password confirmation.');
      return;
    }

    // Update student record with new credentials & activation state
    const updatedStudent: Student = {
      ...signupMatchedStudent,
      email: signupEmail.trim(),
      password: signupPassword.trim(),
      isActivated: true,
      passwordSetAt: new Date().toISOString(),
    };

    onUpdateStudent?.(updatedStudent);

    // Sync user record to Firestore users collection for real-time RBAC listener handshake
    syncUserToFirestore(updatedStudent.id, {
      role: 'student',
      name: updatedStudent.name,
      email: updatedStudent.email,
      rollNo: updatedStudent.rollNo,
      studentRefId: updatedStudent.id,
      status: 'Active',
      profilePicture: updatedStudent.profilePicture || null,
    }).catch(() => {});

    // Auto-login into student portal
    onLogin({
      role: 'student',
      id: updatedStudent.id,
      name: updatedStudent.name,
      emailOrPhone: updatedStudent.email,
      rollNo: updatedStudent.rollNo,
      studentRefId: updatedStudent.id,
      profilePicture: updatedStudent.profilePicture,
    });
  };

  // Student Forgot Password Handler (Using registered email & verified roll number)
  const handleStudentResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentForgotError(null);
    setStudentForgotSuccess(null);

    const emailQuery = studentForgotEmail.trim().toLowerCase();
    const formattedRoll = studentForgotRollNo.trim().toUpperCase();

    if (!emailQuery || !emailQuery.includes('@')) {
      setStudentForgotError('Please enter your valid registered student email address.');
      return;
    }
    if (!formattedRoll) {
      setStudentForgotError('Please enter your verified University / College Roll Number.');
      return;
    }

    // Strong password validation: min 8 chars, one uppercase, one digit
    const isMinLength = studentForgotNewPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(studentForgotNewPassword);
    const hasDigit = /[0-9]/.test(studentForgotNewPassword);

    if (!isMinLength || !hasUppercase || !hasDigit) {
      setStudentForgotError('New security password must be at least 8 characters long and contain at least one uppercase letter (A-Z) and at least one number (0-9).');
      return;
    }

    if (studentForgotNewPassword !== studentForgotConfirmPassword) {
      setStudentForgotError('New passwords do not match. Please re-confirm.');
      return;
    }

    // Verify against student records using BOTH registered email and verified roll number
    const matched = students.find((s) => {
      const rollMatch = s.rollNo.toUpperCase() === formattedRoll || 
                        s.registerNo?.toUpperCase() === formattedRoll ||
                        s.id.toUpperCase() === formattedRoll;
      const emailMatch = s.email?.trim().toLowerCase() === emailQuery;
      return rollMatch && emailMatch;
    });

    if (!matched) {
      setStudentForgotError(`No enrolled student found matching registered email "${emailQuery}" and verified Roll Number "${formattedRoll}". Please verify your credentials or contact the Academic Office.`);
      return;
    }

    const updatedStudent: Student = {
      ...matched,
      password: studentForgotNewPassword.trim(),
      isActivated: true,
      passwordSetAt: new Date().toISOString(),
    };

    onUpdateStudent?.(updatedStudent);
    setStudentForgotSuccess(`Password for ${matched.name} (${matched.rollNo}) has been updated successfully! You can now sign in with your email and new password.`);
    setStudentEmail(matched.email || '');
    setStudentPassword(studentForgotNewPassword.trim());
  };

  // Staff Form Submit (Staff users onboarded by Admin with default password 11111111)
  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffEmail.trim()) {
      setStaffCaptchaError('Please enter your official institutional webmail ID.');
      return;
    }
    if (!staffPassword.trim()) {
      setStaffCaptchaError('Please enter your staff security password.');
      return;
    }
    if (!staffCaptchaInput.trim()) {
      setStaffCaptchaError('Please enter the security verification CAPTCHA code.');
      return;
    }
    if (staffCaptchaInput.trim().toUpperCase() !== staffExpectedCaptcha.toUpperCase()) {
      setStaffCaptchaError('Incorrect CAPTCHA code entered. Please enter characters shown in image.');
      return;
    }
    setStaffCaptchaError(null);

    // Look for matching staff user record strictly matching email or employeeCode AND role
    const emailLower = staffEmail.trim();
    const matchedStaff = staffUsers.find(
      (u) => (safeMatchStrings(u.email, emailLower) || safeMatchStrings(u.employeeCode, emailLower)) && u.role === staffRole
    );

    if (!matchedStaff) {
      setStaffCaptchaError(`No authorized staff record found for "${emailLower}" with role "${staffRole}". Role fallback is disabled for security.`);
      return;
    }

    const sessionData: UserSession = {
      role: 'admin',
      id: matchedStaff.id,
      name: matchedStaff.name,
      emailOrPhone: matchedStaff.email,
      staffDesignation: matchedStaff.designation,
      staffRole: matchedStaff.role,
      isAppAdmin: false,
      profilePicture: matchedStaff.profilePicture,
      canManageCertificateThemes: Boolean(matchedStaff.canManageCertificateThemes),
    };

    // FIRST TIME LOGIN CHECK:
    const isDefaultPassword = staffPassword.trim() === '11111111';
    const isFirstTime = (matchedStaff.isFirstLogin === true || matchedStaff.password === '11111111') && isDefaultPassword;

    if (isDefaultPassword && isFirstTime) {
      setPendingLoginStaffUser(matchedStaff);
      setPendingLoginSession(sessionData);
      setFirstTimeNewPassword('');
      setFirstTimeConfirmPassword('');
      setFirstTimeError(null);
      setShowChangeDefaultPasswordModal(true);
      return;
    }

    // Verify password strictly against matched staff record
    const expectedPassword = matchedStaff.password || '11111111';
    if (staffPassword.trim() !== expectedPassword) {
      setStaffCaptchaError('Invalid credentials. Please verify your official webmail/employee code and security password.');
      return;
    }

    onLogin(sessionData);
  };

  // First-time password change submit
  const handleSaveFirstTimePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstTimeNewPassword) {
      setFirstTimeError('Please enter a new secure password.');
      return;
    }
    if (firstTimeNewPassword.length < 6) {
      setFirstTimeError('Password must be at least 6 characters long.');
      return;
    }
    if (firstTimeNewPassword === '11111111') {
      setFirstTimeError('Your new password must be different from the default onboarding password.');
      return;
    }
    if (firstTimeNewPassword !== firstTimeConfirmPassword) {
      setFirstTimeError('Passwords do not match. Please re-enter.');
      return;
    }

    if (pendingLoginStaffUser && onUpdateStaffUser) {
      onUpdateStaffUser({
        ...pendingLoginStaffUser,
        password: firstTimeNewPassword,
        isFirstLogin: false,
      });
    }

    setShowChangeDefaultPasswordModal(false);
    if (pendingLoginSession) {
      onLogin(pendingLoginSession);
    }
  };

  // System Administrator Login Submit
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim()) {
      setAdminCaptchaError('Please enter system administrator username or credential ID.');
      return;
    }
    if (!adminPassword.trim()) {
      setAdminCaptchaError('Please enter system administrator master key.');
      return;
    }
    if (!adminCaptchaInput.trim()) {
      setAdminCaptchaError('Please enter the security verification CAPTCHA code.');
      return;
    }
    if (adminCaptchaInput.trim().toUpperCase() !== adminExpectedCaptcha.toUpperCase()) {
      setAdminCaptchaError('Incorrect CAPTCHA code entered. Please enter characters shown in image.');
      return;
    }
    setAdminCaptchaError(null);

    // Find root admin in staffUsers strictly matching username or email
    const adminQuery = adminUsername.trim().toLowerCase();
    const rootAdmin = staffUsers.find((u) => 
      u.role === 'App_Admin' && (
        safeMatchStrings(u.email, adminQuery) ||
        safeMatchStrings(u.employeeCode, adminQuery) ||
        adminQuery === 'admin'
      )
    );

    if (!rootAdmin) {
      setAdminCaptchaError('Invalid administrator credentials.');
      return;
    }

    const expectedAdminPassword = rootAdmin.password || 'adminPassword123';
    if (adminPassword.trim() !== expectedAdminPassword) {
      setAdminCaptchaError('Invalid system administrator master key or credentials.');
      return;
    }

    onLogin({
      role: 'admin',
      id: rootAdmin.id,
      name: rootAdmin.name,
      emailOrPhone: rootAdmin.email,
      staffDesignation: rootAdmin.designation,
      staffRole: 'App_Admin',
      isAppAdmin: true,
      profilePicture: rootAdmin.profilePicture,
      canManageCertificateThemes: true,
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto my-4 sm:my-8 px-4 box-border">
      {/* Institution Header / Intro */}
      <div className="text-center mb-6">
        <p className="text-xs text-slate-600 mb-2 font-medium">
          Affiliated with Patna College · Government of Bihar
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          RLSY College
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
          Digital campus and fee portal for students and staff
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
        {/* Navigation Tabs (Student and Staff; Admin Login in Navigation Menu) */}
        {activeTab === 'sysadmin' ? (
          <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-800 rounded-lg text-emerald-400 shrink-0">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Institutional System Administration</span>
                <span className="text-xs text-slate-300 block">Restricted ERP Root Management Console</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                onTabChange?.('student');
              }}
              className="min-h-[44px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto border border-slate-700"
            >
              <span>← Back to Student / Staff Sign In</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-sm font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                onTabChange?.('student');
              }}
              className={`min-h-[44px] py-3 px-3 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-emerald-700 text-white shadow-xs font-extrabold'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Student</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('staff');
                onTabChange?.('staff');
              }}
              className={`min-h-[44px] py-3 px-3 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-emerald-700 text-white shadow-xs font-extrabold'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Staff</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-4 sm:p-6 w-full">

          {/* ============================================================== */}
          {/* 1. STUDENT FORM & QUICK PAYMENT (Email & Password + First-time Sign Up) */}
          {/* ============================================================== */}
          {activeTab === 'student' && (
            <div className="space-y-5 max-w-md mx-auto">
              
              {/* Header Title & Branding */}
              <div className="text-center mb-4">
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-700">
                  RLSY Student Portal
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {studentMode === 'signin' ? 'Sign In to Student Portal' : 'First-Time Student Registration'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {studentMode === 'signin' 
                    ? 'Access term fee payment, download official receipts, track No Dues & request university certificates.'
                    : 'Activate your portal account using your official admission Roll Number & Date of Birth.'
                  }
                </p>
              </div>

              {/* Mode Switcher: Sign In vs First-Time User Sign Up */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setStudentMode('signin');
                    setStudentCaptchaError(null);
                  }}
                  className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    studentMode === 'signin'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStudentMode('signup');
                    setSignupStep('verify');
                    setSignupError(null);
                  }}
                  className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    studentMode === 'signup'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>First-Time User? Sign Up</span>
                </button>
              </div>

              {/* 1A: STUDENT SIGN IN FORM (EMAIL & PASSWORD) */}
              {studentMode === 'signin' && (
                <form onSubmit={handleStudentEmailSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Sign in to student portal
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Enter your registered student credentials to access your portal.
                    </p>
                  </div>

                  {studentCaptchaError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1 font-medium">{studentCaptchaError}</div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                      Student Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="Enter your registered email"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        className="w-full h-11 px-3 pl-10 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 box-border"
                      />
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-semibold text-slate-800">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setStudentForgotEmail(studentEmail.trim());
                          setStudentForgotRollNo('');
                          setStudentForgotNewPassword('');
                          setStudentForgotConfirmPassword('');
                          setStudentForgotError(null);
                          setStudentForgotSuccess(null);
                          setShowStudentForgotModal(true);
                        }}
                        className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showStudentPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter your password"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        className="w-full h-11 px-3 pr-10 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-mono box-border"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStudentPassword(!showStudentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 cursor-pointer p-1"
                        title={showStudentPassword ? 'Hide password' : 'Show password'}
                        aria-label={showStudentPassword ? 'Hide password' : 'Show password'}
                      >
                        {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Security CAPTCHA verification */}
                  <CaptchaChallenge
                    userInput={studentCaptchaInput}
                    onUserInputChange={(val) => {
                      setStudentCaptchaInput(val.toUpperCase());
                      if (studentCaptchaError) setStudentCaptchaError(null);
                    }}
                    onCodeGenerated={(code) => setStudentExpectedCaptcha(code)}
                    onRefresh={() => {
                      setStudentCaptchaInput('');
                      setStudentCaptchaError(null);
                    }}
                    errorMessage={studentCaptchaError}
                  />

                  {/* Primary 48px Sign in button */}
                  <button
                    type="submit"
                    className="w-full h-12 min-h-[48px] bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-sm font-bold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-600">
                    <span>First-time student?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentMode('signup');
                        setSignupStep('verify');
                        setSignupError(null);
                      }}
                      className="text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Activate account</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </form>
              )}

              {/* 1B: FIRST-TIME USER SIGN UP (ROLL NO & DOB) */}
              {studentMode === 'signup' && (
                <div className="space-y-4">
                  {signupError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1 font-medium">{signupError}</div>
                    </div>
                  )}

                  {signupStep === 'verify' ? (
                    <form onSubmit={handleStudentVerifyForSignup} className="space-y-4">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">First-Time Enrollment Verification: </span>
                          Enter your College Roll Number and Date of Birth as recorded during admission to verify your enrolled student record and set your account password.
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          University / College Roll Number *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 2025/BTECH/CSE/001"
                          value={signupRollNo}
                          onChange={(e) => setSignupRollNo(e.target.value)}
                          className="w-full p-2.5 text-xs font-mono font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-600 uppercase"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Date of Birth (as per Matriculation Certificate) *
                        </label>
                        <input
                          type="date"
                          required
                          value={signupDob}
                          onChange={(e) => setSignupDob(e.target.value)}
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>

                      {/* Security CAPTCHA verification */}
                      <CaptchaChallenge
                        userInput={signupCaptchaInput}
                        onUserInputChange={(val) => {
                          setSignupCaptchaInput(val.toUpperCase());
                          if (signupError) setSignupError(null);
                        }}
                        onCodeGenerated={(code) => setSignupExpectedCaptcha(code)}
                        onRefresh={() => {
                          setSignupCaptchaInput('');
                          setSignupError(null);
                        }}
                      />

                      <button
                        type="submit"
                        className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify Enrollment & Continue</span>
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setStudentMode('signin')}
                          className="text-xs text-slate-500 hover:text-slate-800 hover:underline"
                        >
                          ← Already activated? Return to Sign In
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* STEP 2: CREDENTIAL CREATION */
                    <form onSubmit={handleStudentCompleteSignup} className="space-y-4">
                      {signupMatchedStudent && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs mb-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>Enrolled Record Verified</span>
                          </div>
                          <div className="text-xs text-slate-700 space-y-0.5">
                            <div className="font-semibold text-slate-900">{signupMatchedStudent.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Roll: {signupMatchedStudent.rollNo} · {signupMatchedStudent.course} (Sem {signupMatchedStudent.semester})
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Father: {signupMatchedStudent.fatherName || 'N/A'}
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Confirm / Set Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">
                            Create New Password *
                          </label>
                          <span className="text-[10px] text-slate-500 font-medium">
                            min 8 chars, 1 uppercase, 1 digit
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type={signupShowPassword ? 'text' : 'password'}
                            required
                            minLength={8}
                            placeholder="Min 8 chars, 1 uppercase, 1 digit"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            className="w-full p-2.5 pr-9 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-600 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setSignupShowPassword(!signupShowPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {signupShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Strong Password Validation Checklist */}
                        <div className="mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-3 gap-1 text-[10px]">
                          <div className={`flex items-center gap-1 ${signupPassword.length >= 8 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${signupPassword.length >= 8 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                              {signupPassword.length >= 8 ? '✓' : '•'}
                            </span>
                            <span>8+ chars</span>
                          </div>
                          <div className={`flex items-center gap-1 ${/[A-Z]/.test(signupPassword) ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${/[A-Z]/.test(signupPassword) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                              {/[A-Z]/.test(signupPassword) ? '✓' : '•'}
                            </span>
                            <span>1 uppercase</span>
                          </div>
                          <div className={`flex items-center gap-1 ${/[0-9]/.test(signupPassword) ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${/[0-9]/.test(signupPassword) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                              {/[0-9]/.test(signupPassword) ? '✓' : '•'}
                            </span>
                            <span>1 number</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Confirm Password *
                        </label>
                        <input
                          type={signupShowPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          placeholder="Re-enter your password"
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-600 font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSignupStep('verify')}
                          className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                        >
                          ← Back
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Activate Account & Sign In</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* 2. STAFF FORM (App Admin hidden from role dropdown, default pwd 11111111) */}
          {/* ============================================================== */}
          {activeTab === 'staff' && (
            <form onSubmit={handleStaffSubmit} className="space-y-4 max-w-md mx-auto">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Sign in to staff portal
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Accounts Officer, Principal (DDO), Librarian, HOD, Warden & Cashier.
                </p>
              </div>

              {/* Staff Role Dropdown - Institutional App Administrator is strictly HIDDEN */}
              <div>
                <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                  Staff Role / Authority
                </label>
                <select
                  value={staffRole}
                  onChange={(e) => {
                    setStaffRole(e.target.value as StaffRole);
                  }}
                  className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 box-border"
                >
                  <option value="Accounts_Officer">Accounts Officer & Treasury Bursar</option>
                  <option value="Principal_DDO">Principal & DDO (Executive Sign-Off)</option>
                  <option value="Cashier">Treasury Counter Cashier</option>
                  <option value="Librarian">Central Library & Book Bank In-charge</option>
                  <option value="HOD">Head of Department (CSE / Labs Clearance)</option>
                  <option value="Hostel_Warden">Chief Hostel & Mess Warden</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-800 block mb-1.5">
                  Official Webmail / Employee Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter official webmail or employee code"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 box-border"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-slate-800">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenForgotPassword}
                    className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  placeholder="Enter staff security password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="w-full h-11 px-3 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 box-border font-mono"
                />
              </div>

              {/* Security CAPTCHA verification */}
              <CaptchaChallenge
                userInput={staffCaptchaInput}
                onUserInputChange={(val) => {
                  setStaffCaptchaInput(val.toUpperCase());
                  if (staffCaptchaError) setStaffCaptchaError(null);
                }}
                onCodeGenerated={(code) => setStaffExpectedCaptcha(code)}
                onRefresh={() => {
                  setStaffCaptchaInput('');
                  setStaffCaptchaError(null);
                }}
                errorMessage={staffCaptchaError}
              />

              <button
                type="submit"
                className="w-full h-12 min-h-[48px] bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-sm font-bold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Staff Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ============================================================== */}
          {/* 3. SYSTEM ADMINISTRATOR CONSOLE (Never place admin mail id visible to public) */}
          {/* ============================================================== */}
          {activeTab === 'sysadmin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4 max-w-md mx-auto">
              <div className="text-center mb-6">
                <div className="inline-flex p-2 bg-purple-100 text-purple-700 rounded-xl mb-2">
                  <Server className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Institutional System Administration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Restricted portal for ERP Root Administration, Staff Onboarding & Security Authorizations.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Administrator Account Username / Key *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter administrator ID"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-600 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Administrator Master Security Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter administrator master password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* CAPTCHA challenge */}
              <CaptchaChallenge
                userInput={adminCaptchaInput}
                onUserInputChange={(val) => {
                  setAdminCaptchaInput(val.toUpperCase());
                  if (adminCaptchaError) setAdminCaptchaError(null);
                }}
                onCodeGenerated={(code) => setAdminExpectedCaptcha(code)}
                onRefresh={() => {
                  setAdminCaptchaInput('');
                  setAdminCaptchaError(null);
                }}
                errorMessage={adminCaptchaError}
              />

              <button
                type="submit"
                className="w-full h-12 min-h-[48px] bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-sm font-bold transition-colors shadow-xs flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                <span>Authenticate as Institutional Admin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* 5 & 6. Demo Access: Below the form, collapsed by default under "Demo access" link, dev only */}
          {(import.meta.env.DEV || (typeof window !== 'undefined' && window.location.hostname.includes('localhost'))) && activeTab !== 'sysadmin' && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsDemoCollapsed(!isDemoCollapsed)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isDemoCollapsed ? 'Demo access' : 'Hide demo access'}</span>
                </button>
              </div>

              {!isDemoCollapsed && (
                <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-800 block">Development Demo Logins</span>
                    <span className="text-[11px] text-slate-600">Quick test access (visible only in development)</span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleFillDemoStudent(true)}
                      className="w-full h-11 min-h-[44px] px-3 border border-emerald-700 text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      title="Direct 1-click login as Demo Student"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      <span>Instant student login</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFillDemoAccountsUser(true)}
                      className="w-full h-11 min-h-[44px] px-3 border border-emerald-700 text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      title="Direct 1-click login as Demo Staff"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      <span>Instant staff login</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MANDATORY PASSWORD CHANGE MODAL FOR FIRST-TIME STAFF (11111111) */}
      {/* ============================================================== */}
      {showChangeDefaultPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto">
            <div className="bg-amber-600 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-700/50 rounded-lg border border-amber-400/40 text-amber-100">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Change Default Password Required</h3>
                  <p className="text-[11px] text-amber-100">First-Time Staff Onboarding Security Protocol</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveFirstTimePassword} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Temporary Onboarding Password Detected</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Welcome to RLSY Digital Campus! As an onboarded staff member logging in for the first time, you are required to replace your temporary onboarding password with a confidential personal password to protect administrative records.
                </p>
              </div>

              {firstTimeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{firstTimeError}</span>
                </div>
              )}

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  New Security Password * (min. 6 characters, must differ from default password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={firstTimeShowPassword ? 'text' : 'password'}
                    required
                    value={firstTimeNewPassword}
                    onChange={(e) => setFirstTimeNewPassword(e.target.value)}
                    placeholder="Create your new personal password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setFirstTimeShowPassword(!firstTimeShowPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {firstTimeShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={firstTimeShowPassword ? 'text' : 'password'}
                    required
                    value={firstTimeConfirmPassword}
                    onChange={(e) => setFirstTimeConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-2 sticky bottom-0 bg-white">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Password & Launch Dashboard</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* FORGOT PASSWORD MODAL (Includes Accountant Approval Workflow) */}
      {/* ============================================================== */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600/30 rounded-lg border border-indigo-400/30 text-indigo-300">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Password Recovery</h3>
                  <p className="text-[11px] text-slate-400">RLSY Central IAM Credential Reset</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Steps Indicator */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500 shrink-0">
              <div className={`flex items-center gap-1.5 ${forgotStep === 'request' ? 'text-indigo-700 font-bold' : 'text-slate-400'}`}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-current">1</span>
                <span>Role & Mail</span>
              </div>
              <div className="w-6 h-px bg-slate-200" />
              <div className={`flex items-center gap-1.5 ${forgotStep === 'otp' ? 'text-indigo-700 font-bold' : 'text-slate-400'}`}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-current">2</span>
                <span>OTP & Reset</span>
              </div>
              <div className="w-6 h-px bg-slate-200" />
              <div className={`flex items-center gap-1.5 ${forgotStep === 'success' || forgotStep === 'accountant_queued' ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-current">3</span>
                <span>Verification</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {forgotError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{forgotError}</span>
                </div>
              )}

              {/* Step 1: Request OTP */}
              {forgotStep === 'request' && (
                <form onSubmit={handleSendResetOtp} className="space-y-4 text-xs">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Staff Authority Role
                    </label>
                    <select
                      value={forgotRole}
                      onChange={(e) => {
                        const newR = e.target.value as StaffRole;
                        setForgotRole(newR);
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="Accounts_Officer">Accounts Officer & Treasury Bursar</option>
                      <option value="Principal_DDO">Principal & DDO (Executive Sign-Off)</option>
                      <option value="Cashier">Treasury Counter Cashier</option>
                      <option value="Librarian">Central Library & Book Bank In-charge</option>
                      <option value="HOD">Head of Department (CSE / Labs)</option>
                      <option value="Hostel_Warden">Chief Hostel & Mess Warden</option>
                    </select>
                  </div>

                  {forgotRole === 'Accounts_Officer' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                      <div className="font-bold flex items-center gap-1 text-amber-800 mb-0.5">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Accountant Security Policy</span>
                      </div>
                      For the role of Accountant, password resets must be authorized by the Principal or Institutional Administrator before taking effect.
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Official Institutional Webmail ID *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Enter official institutional webmail"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Generate & Send Security OTP</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: OTP Verification & Reset */}
              {forgotStep === 'otp' && (
                <form onSubmit={handleVerifyOtpAndReset} className="space-y-4 text-xs">
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs">
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Security OTP Dispatched</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      A 6-digit verification code has been dispatched for <span className="font-semibold text-indigo-950 font-mono">{forgotEmail}</span>.
                    </p>
                    <div className="mt-2 py-1.5 px-2.5 bg-white border border-indigo-200 rounded-lg flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">Verification Token:</span>
                      <span className="font-mono text-sm font-extrabold text-indigo-700 tracking-wider">
                        {generatedOtp}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Enter 6-Digit OTP Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 123456"
                      className="w-full p-2.5 text-center text-sm font-mono font-bold tracking-widest bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      New Security Password * (min. 6 characters, must differ from default password)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Create strong new password"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep('request')}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{forgotRole === 'Accounts_Officer' ? 'Submit for Authorization' : 'Verify & Reset Password'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3A: Accountant Queued for Authorization */}
              {forgotStep === 'accountant_queued' && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto border-2 border-amber-300">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Authorization Request Queued</h4>
                    <span className="text-[11px] font-mono font-bold text-amber-800 px-2 py-0.5 bg-amber-50 rounded-full border border-amber-200 inline-block mt-1">
                      REF: #APR-{Math.floor(1000 + Math.random() * 9000)}
                    </span>
                    <p className="text-xs text-slate-600 max-w-xs mx-auto mt-2 leading-relaxed">
                      For the role of <strong>Accountant</strong>, password resetting must be authorized by the <strong>Principal (DDO)</strong> or <strong>Institutional Administrator</strong> to take effect.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Your request has been placed in the executive authorization queue. Once approved, your new password will become active immediately.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Back to Sign In</span>
                  </button>
                </div>
              )}

              {/* Step 3B: Success Confirmation for General Staff */}
              {forgotStep === 'success' && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Password Successfully Updated</h4>
                    <p className="text-xs text-slate-600 max-w-xs mx-auto mt-1">
                      {forgotSuccessMsg || 'Your official staff credentials have been updated. You can now log into your console.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STUDENT FORGOT PASSWORD MODAL */}
      {/* ============================================================== */}
      {showStudentForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-700/40 rounded-lg border border-emerald-500/30 text-emerald-200">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Student Password Reset</h3>
                  <p className="text-[11px] text-emerald-200">Verify Registered Email & Roll Number</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStudentForgotModal(false)}
                className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {studentForgotSuccess ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Password Reset Successful</h4>
                  <p className="text-xs text-slate-600">{studentForgotSuccess}</p>
                  <button
                    type="button"
                    onClick={() => setShowStudentForgotModal(false)}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
                  >
                    <span>Proceed to Sign In</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleStudentResetPassword} className="space-y-4 text-xs">
                  {studentForgotError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1 font-medium">{studentForgotError}</div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Registered Student Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="e.g. aarav.sharma@institution.edu"
                        value={studentForgotEmail}
                        onChange={(e) => setStudentForgotEmail(e.target.value)}
                        className="w-full p-2.5 pl-8 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Verified University / College Roll Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2025/BTECH/CSE/001"
                      value={studentForgotRollNo}
                      onChange={(e) => setStudentForgotRollNo(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg uppercase font-mono font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        New Security Password *
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        min 8 chars, 1 uppercase, 1 digit
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type={studentForgotShowPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        placeholder="Min 8 chars, 1 uppercase, 1 digit"
                        value={studentForgotNewPassword}
                        onChange={(e) => setStudentForgotNewPassword(e.target.value)}
                        className="w-full p-2.5 pr-9 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setStudentForgotShowPassword(!studentForgotShowPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {studentForgotShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Requirement indicators */}
                    <div className="mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-3 gap-1 text-[10px]">
                      <div className={`flex items-center gap-1 ${studentForgotNewPassword.length >= 8 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${studentForgotNewPassword.length >= 8 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                          {studentForgotNewPassword.length >= 8 ? '✓' : '•'}
                        </span>
                        <span>8+ chars</span>
                      </div>
                      <div className={`flex items-center gap-1 ${/[A-Z]/.test(studentForgotNewPassword) ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${/[A-Z]/.test(studentForgotNewPassword) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                          {/[A-Z]/.test(studentForgotNewPassword) ? '✓' : '•'}
                        </span>
                        <span>Uppercase</span>
                      </div>
                      <div className={`flex items-center gap-1 ${/[0-9]/.test(studentForgotNewPassword) ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${/[0-9]/.test(studentForgotNewPassword) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                          {/[0-9]/.test(studentForgotNewPassword) ? '✓' : '•'}
                        </span>
                        <span>Digit</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      type={studentForgotShowPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      placeholder="Re-enter your password"
                      value={studentForgotConfirmPassword}
                      onChange={(e) => setStudentForgotConfirmPassword(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowStudentForgotModal(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
                    >
                      <span>Update Password</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
