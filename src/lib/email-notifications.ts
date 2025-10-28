/**
 * Email Notifications - Simple EmailJS Integration
 * Fresh implementation - no complexity, just works
 */

import emailjs from '@emailjs/browser';

// Initialize EmailJS once when the module loads
const initEmailJS = () => {
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  
  if (publicKey) {
    emailjs.init(publicKey);
    console.log('✅ EmailJS initialized with public key');
  } else {
    console.warn('⚠️ EmailJS public key not found');
  }
};

// Auto-initialize
if (typeof window !== 'undefined') {
  initEmailJS();
}

/**
 * Check if EmailJS is configured
 */
export function isEmailConfigured(): boolean {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  
  return !!(serviceId && templateId && publicKey);
}

/**
 * Get EmailJS configuration
 */
export function getEmailConfig() {
  return {
    serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '',
    templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '',
    publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '',
    isConfigured: isEmailConfigured()
  };
}

/**
 * Send an email using EmailJS
 */
export async function sendEmail(params: {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getEmailConfig();
    
    if (!config.isConfigured) {
      return {
        success: false,
        error: 'EmailJS is not configured. Please check your environment variables.'
      };
    }

    // Validate params
    if (!params.to_email || !params.to_email.trim()) {
      console.error('❌ Email validation failed: to_email is empty');
      return {
        success: false,
        error: 'Recipient email is required'
      };
    }

    console.log('📧 Sending email...', {
      to: params.to_email,
      name: params.to_name,
      subject: params.subject,
      messageLength: params.message.length,
      serviceId: config.serviceId,
      templateId: config.templateId
    });

    const templateParams = {
      to_email: params.to_email,
      to_name: params.to_name,
      subject: params.subject,
      message: params.message,
      // Add recipient email as separate field for EmailJS
      reply_to: params.to_email,
      to: params.to_email,
      email: params.to_email
    };

    console.log('📧 Template params:', templateParams);

    const response = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams
    );

    console.log('✅ Email sent successfully:', response);

    return { success: true };

  } catch (error: any) {
    console.error('❌ Failed to send email:', error);
    console.error('❌ Error details:', {
      message: error?.message,
      text: error?.text,
      status: error?.status,
      fullError: error
    });
    
    let errorMessage = 'Failed to send email. Please try again.';
    
    // Parse specific errors
    if (error.text) {
      errorMessage = error.text;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Send a test email
 */
export async function sendTestEmail(userEmail: string, userName: string): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to_email: userEmail,
    to_name: userName,
    subject: '🧪 Studify Test Email',
    message: 'This is a test email from Studify. If you\'re reading this, email notifications are working perfectly! 🎉'
  });
}

/**
 * Send study reminder email
 */
export async function sendStudyReminder(userEmail: string, userName: string, subject: string): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to_email: userEmail,
    to_name: userName,
    subject: '📚 Study Reminder - Studify',
    message: `Don't forget to study ${subject} today! Keep up the great work! 💪`
  });
}

/**
 * Send missed goal notification
 */
export async function sendMissedGoalEmail(userEmail: string, userName: string, goalDetails: string): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to_email: userEmail,
    to_name: userName,
    subject: '⏰ Goal Update - Studify',
    message: `Heads up! ${goalDetails}\n\nDon't worry - every day is a fresh start. Let's get back on track! 🎯`
  });
}

/**
 * Send weekly summary
 */
export async function sendWeeklySummary(
  userEmail: string, 
  userName: string, 
  totalMinutes: number,
  sessionsCount: number
): Promise<{ success: boolean; error?: string }> {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return sendEmail({
    to_email: userEmail,
    to_name: userName,
    subject: '📊 Your Weekly Study Summary - Studify',
    message: `Great week, ${userName}! 🎉\n\n` +
      `📚 Study Sessions: ${sessionsCount}\n` +
      `⏱️ Total Time: ${hours}h ${minutes}m\n\n` +
      `Keep up the amazing work! 💪`
  });
}
