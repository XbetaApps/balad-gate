// خدمة مركزية للتحقق من صحة الجلسة

// تخزين محلي لحالة التحقق من الجلسة
let sessionVerifiedState = false;

/**
 * تعيين حالة التحقق من الجلسة
 * @param {boolean} verified - حالة التحقق
 */
export const setSessionVerified = (verified) => {
  sessionVerifiedState = verified;
  // إرسال حدث عند تغيير حالة التحقق
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('session-verification-changed', { 
      detail: { verified } 
    }));
  }
};

/**
 * التحقق مما إذا كانت الجلسة قد تم التحقق منها
 * @returns {boolean} - حالة التحقق
 */
export const isSessionVerified = () => {
  return sessionVerifiedState;
};

/**
 * إعادة تعيين حالة التحقق (عند تسجيل الخروج مثلاً)
 */
export const resetSessionVerification = () => {
  sessionVerifiedState = false;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('session-verification-changed', { 
      detail: { verified: false } 
    }));
  }
};

/**
 * إضافة مستمع لتغييرات حالة التحقق
 * @param {Function} callback - الدالة التي سيتم استدعاؤها عند تغيير الحالة
 * @returns {Function} - دالة إزالة المستمع
 */
export const onSessionVerificationChange = (callback) => {
  if (typeof window === 'undefined') {
    return () => {}; // لا شيء للتنظيف في بيئة الخادم
  }
  
  const handler = (event) => callback(event.detail.verified);
  window.addEventListener('session-verification-changed', handler);
  return () => window.removeEventListener('session-verification-changed', handler);
};
