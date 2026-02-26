export interface EmailTemplateType {
    subject: string;
    html: string;
    text: string;
}

/**
 * Shared HTML wrapper for beautifully matching the KSS website design
 */
function generateLayout(subject: string, contentHtml: string, actionUrl?: string, actionText?: string): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f4f6f9; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: #1B2B48; color: #ffffff; padding: 35px 40px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px; color: #ffffff; }
        .content { padding: 40px; }
        .content h2 { margin-top: 0; color: #1B2B48; font-size: 22px; font-weight: 800; }
        .content p { font-size: 16px; margin-bottom: 20px; color: #4a5568; }
        .footer { background: #f8f9fa; padding: 30px 40px; text-align: center; font-size: 13px; color: #718096; border-top: 1px solid #edf2f7; }
        .button { display: inline-block; padding: 14px 35px; background: #FF8A00; color: #ffffff !important; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: bold; font-size: 16px; text-align: center; box-shadow: 0 4px 10px rgba(255, 138, 0, 0.3); }
        .highlight { background: #f0f4ff; padding: 25px; border-left: 5px solid #FF8A00; margin: 25px 0; border-radius: 0 8px 8px 0; }
        .highlight p { margin: 0; color: #2d3748; }
        .grid { width: 100%; margin: 25px 0; font-size: 15px; }
        .grid-item { padding: 12px 0; border-bottom: 1px solid #edf2f7; display: flex; }
        .grid-item:last-child { border-bottom: none; }
        .grid-item strong { color: #1B2B48; width: 150px; flex-shrink: 0; }
        .grid-item span { color: #4a5568; font-weight: 500; }
        .cal-btn { display: inline-block; padding: 8px 15px; background: #edf2f7; color: #1B2B48 !important; text-decoration: none; border-radius: 5px; font-size: 13px; font-weight: bold; border: 1px solid #e2e8f0; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>KSS ACADEMY</h1>
        </div>
        <div class="content">
            ${contentHtml}
            ${actionUrl && actionText ? `<div style="text-align: center;"><a href="${actionUrl}" class="button">${actionText}</a></div>` : ''}
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Kenya School of Sales (KSS) Academy. All rights reserved.</p>
            <p>Building Africa's highest-performing commercial teams.</p>
            <p><a href="mailto:hi@kss.or.ke" style="color: #FF8A00; text-decoration: none; font-weight: bold;">hi@kss.or.ke</a></p>
        </div>
    </div>
</body>
</html>`;
}

// ============================================================================
// 1. FINANCE MODULE EMAILS
// ============================================================================

export function generatePaymentReceiptEmail(data: { name: string; amount: number; currency: string; date: string; receiptUrl: string; balance: number; program: string }): EmailTemplateType {
    const subject = `Receipt for Your Payment to KSS Academy`;
    const content = `
        <h2>Hello ${data.name},</h2>
        <p>Thank you for your recent payment. Your transaction was successful and has been applied to your account for <strong>${data.program}</strong>.</p>
        <div class="grid">
            <div class="grid-item"><strong>Amount Paid:</strong> <span>${data.currency} ${data.amount.toLocaleString()}</span></div>
            <div class="grid-item"><strong>Date:</strong> <span>${data.date}</span></div>
            <div class="grid-item"><strong>Remaining Balance:</strong> <span>${data.currency} ${data.balance.toLocaleString()}</span></div>
        </div>
        <p>You can download or view your official receipt using the link below.</p>
    `;
    const text = `Hello ${data.name},\nThank you for your payment of ${data.currency} ${data.amount.toLocaleString()} for ${data.program}.\nYour remaining balance is ${data.currency} ${data.balance.toLocaleString()}.\nAccess your receipt here: ${data.receiptUrl}`;
    return { subject, html: generateLayout(subject, content, data.receiptUrl, 'View Official Receipt'), text };
}

export function generateBalanceReminderEmail(data: { name: string; balance: number; dueDate: string; paymentUrl: string; program: string; currency: string }): EmailTemplateType {
    const subject = `Action Required: Upcoming Balance Reminder for ${data.program}`;
    const content = `
        <h2>Hello ${data.name},</h2>
        <p>This is a friendly reminder that you have an upcoming balance due for your enrollment in <strong>${data.program}</strong>.</p>
        <div class="highlight">
            <p><strong>Amount Due:</strong> ${data.currency} ${data.balance.toLocaleString()}<br>
            <strong>Due Date:</strong> ${data.dueDate}</p>
        </div>
        <p>Please ensure payment is made by the due date to maintain uninterrupted access to your classes and learning materials.</p>
    `;
    const text = `Hello ${data.name},\nReminder: You have a balance of ${data.currency} ${data.balance.toLocaleString()} due on ${data.dueDate} for ${data.program}.\nPay here: ${data.paymentUrl}`;
    return { subject, html: generateLayout(subject, content, data.paymentUrl, 'Make a Payment'), text };
}

export function generateOverduePaymentEmail(data: { name: string; balance: number; daysOverdue: number; paymentUrl: string; program: string; currency: string }): EmailTemplateType {
    const subject = `Urgent: Overdue Payment Notice - KSS Academy`;
    const content = `
        <h2>Hello ${data.name},</h2>
        <p>Our records indicate that your payment for <strong>${data.program}</strong> is currently <strong>${data.daysOverdue} days overdue</strong>.</p>
        <div class="highlight" style="border-left-color: #e53e3e;">
            <p><strong>Overdue Amount:</strong> ${data.currency} ${data.balance.toLocaleString()}</p>
        </div>
        <p>To avoid temporary suspension of your portal access, please settle this balance immediately. If you have already made this payment, kindly provide us with the transaction proof.</p>
    `;
    const text = `Hello ${data.name},\nYour payment of ${data.currency} ${data.balance.toLocaleString()} for ${data.program} is ${data.daysOverdue} days overdue.\nPlease pay immediately: ${data.paymentUrl}`;
    return { subject, html: generateLayout(subject, content, data.paymentUrl, 'Pay Now'), text };
}

export function generatePaymentPlanStartedEmail(data: { name: string; program: string; totalAmount: number; currency: string; nextInstallmentDate: string }): EmailTemplateType {
    const subject = `Your Payment Plan Agreement - KSS Academy`;
    const content = `
        <h2>Hello ${data.name},</h2>
        <p>Your installment payment plan for <strong>${data.program}</strong> has been successfully activated.</p>
        <div class="grid">
            <div class="grid-item"><strong>Total Commitment:</strong> <span>${data.currency} ${data.totalAmount.toLocaleString()}</span></div>
            <div class="grid-item"><strong>Next Installment:</strong> <span>${data.nextInstallmentDate}</span></div>
        </div>
        <p>We will send you a reminder email before each upcoming installment is due. You can track your payment schedule directly within the Finance portal.</p>
    `;
    const text = `Hello ${data.name},\nYour payment plan for ${data.program} is active. Total: ${data.currency} ${data.totalAmount.toLocaleString()}. Next payment is due on ${data.nextInstallmentDate}.`;
    return { subject, html: generateLayout(subject, content), text };
}

export function generateFullyPaidEmail(data: { name: string; program: string; dashboardUrl: string }): EmailTemplateType {
    const subject = `Thank You! Your Program is Fully Paid`;
    const content = `
        <h2>Congratulations ${data.name},</h2>
        <p>We have received your final payment! Your enrollment for <strong>${data.program}</strong> is now <strong>fully paid</strong>.</p>
        <p>Thank you for fulfilling your financial commitment. You can continue to access all your courses, modules, and certificates without any interruptions.</p>
        <p>Keep up the great work in your sales journey.</p>
    `;
    const text = `Hello ${data.name},\nYour enrollment for ${data.program} is fully paid! Thank you.`;
    return { subject, html: generateLayout(subject, content, data.dashboardUrl, 'Go to Dashboard'), text };
}

// ============================================================================
// 2. ADMISSIONS / REGISTRATION EMAILS
// ============================================================================

export function generateLeadConfirmationEmail(data: { name: string; program: string }): EmailTemplateType {
    const subject = `Inquiry Received: ${data.program}`;
    const content = `
        <h2>Hello ${data.name},</h2>
        <p>Thank you for expressing interest in <strong>${data.program}</strong>.</p>
        <div class="highlight">
            <p><strong>What happens next?</strong><br>Our admissions team will review your inquiry and contact you within 24-48 hours to discuss program details and answer any questions you may have.</p>
        </div>
        <p>In the meantime, feel free to explore our website to learn more about our frameworks and community.</p>
    `;
    const text = `Hello ${data.name},\nThank you for your interest in ${data.program}. Our team will contact you shortly.`;
    return { subject, html: generateLayout(subject, content), text };
}

export function generateWelcomeEmail(data: { name: string; program: string; portalUrl: string }): EmailTemplateType {
    const subject = `Welcome to KSS Academy! Next Steps for ${data.program}`;
    const content = `
        <h2>Welcome aboard, ${data.name}!</h2>
        <p>Your registration for <strong>${data.program}</strong> has been successfully confirmed.</p>
        <div class="grid">
            <div class="grid-item"><strong>Step 1:</strong> <span>Complete your Assessment test via the portal</span></div>
            <div class="grid-item"><strong>Step 2:</strong> <span>Get placed into a Cohort</span></div>
            <div class="grid-item"><strong>Step 3:</strong> <span>Begin your commercial training!</span></div>
        </div>
        <p>Please log in to your dashboard to complete your initial assessments right away.</p>
    `;
    const text = `Hello ${data.name},\nWelcome to KSS! Please log in to your portal to take your assessment and begin placing into a cohort for ${data.program}.`;
    return { subject, html: generateLayout(subject, content, data.portalUrl, 'Log in to Portal'), text };
}

export function generateAssessmentCompletedEmail(data: { name: string; program: string; score: string; dashboardUrl: string }): EmailTemplateType {
    const subject = `Assessment Completed Successfully - KSS Academy`;
    const content = `
        <h2>Great job, ${data.name}!</h2>
        <p>You have successfully completed the assessment for <strong>${data.program}</strong>.</p>
        <div class="highlight">
            <p><strong>Your Score:</strong> ${data.score}</p>
        </div>
        <p>Our academic directors are currently reviewing your profile to place you in the best possible cohort that matches your skill level. You will be notified once your placement is confirmed.</p>
    `;
    const text = `Hello ${data.name},\nYou completed the assessment for ${data.program} with a score of ${data.score}. We will place you in a cohort soon.`;
    return { subject, html: generateLayout(subject, content, data.dashboardUrl, 'View Dashboard'), text };
}

export function generatePlacementAssignedEmail(data: { name: string; program: string; cohortName: string; startDate: string; dashboardUrl: string }): EmailTemplateType {
    const subject = `You've Been Placed! Cohort Assignment for ${data.program}`;
    const content = `
        <h2>Hello ${data.name},</h2>
        <p>Based on your assessment and profile, we are thrilled to inform you that you have been placed into a cohort!</p>
        <div class="highlight">
            <p><strong>Program:</strong> ${data.program}<br>
            <strong>Cohort:</strong> ${data.cohortName}<br>
            <strong>Start Date:</strong> ${data.startDate}</p>
        </div>
        <p>Your learning journey is about to begin. Please log in to your portal to view your upcoming schedule and meet your facilitator.</p>
    `;
    const text = `Hello ${data.name},\nYou've been placed in cohort ${data.cohortName} for ${data.program}. Classes start on ${data.startDate}.`;
    return { subject, html: generateLayout(subject, content, data.dashboardUrl, 'Access Learning Portal'), text };
}

export function generateOrientationReminderEmail(data: { name: string; cohortName: string; orientationDate: string; meetingLink: string }): EmailTemplateType {
    const subject = `Reminder: Cohort Orientation Tomorrow!`;
    const content = `
        <h2>Hi ${data.name},</h2>
        <p>Get ready! The orientation session for <strong>${data.cohortName}</strong> is happening tomorrow.</p>
        <div class="grid">
            <div class="grid-item"><strong>Date & Time:</strong> <span>${data.orientationDate}</span></div>
            <div class="grid-item"><strong>Location:</strong> <span>Virtual (Link Below)</span></div>
        </div>
        <p>During this session, we will cover the platform rules, grading metrics, and introduce you to the team. Attendance is mandatory.</p>
    `;
    const text = `Hello ${data.name},\nOrientation for ${data.cohortName} is tomorrow at ${data.orientationDate}.\nJoin here: ${data.meetingLink}`;
    return { subject, html: generateLayout(subject, content, data.meetingLink, 'Join Orientation Call'), text };
}

export function generateB2bRegistrationEmail(data: { name: string; companyName: string; tier: string; dashboardUrl: string }): EmailTemplateType {
    const subject = `Corporate Registration Confirmed - ${data.companyName}`;
    const content = `
        <h2>Hello ${data.name},</h2>
        <p>Thank you for enrolling <strong>${data.companyName}</strong> in the KSS B2B Training Program.</p>
        <div class="highlight">
            <p><strong>Active Plan:</strong> ${data.tier} Tier</p>
        </div>
        <p>Your business admin portal is now active. From the portal, you can allocate seats, track your team’s progress, and oversee their commercial upskilling journey.</p>
    `;
    const text = `Hello ${data.name},\nYour company ${data.companyName} is registered for the ${data.tier} tier. Admin portal is active.`;
    return { subject, html: generateLayout(subject, content, data.dashboardUrl, 'Go to Business Portal'), text };
}

// ============================================================================
// 3. CURRICULUM / LEARNING EMAILS
// ============================================================================

export function generateWeeklyClassesEmail(data: { name: string; weekStart: string; classes: { title: string; date: string; time: string; link: string; calLink?: string }[] }): EmailTemplateType {
    const subject = `Your Week Ahead: Upcoming Classes (${data.weekStart})`;

    let classesHtml = '';
    data.classes.forEach(c => {
        classesHtml += `
            <div style="padding: 15px; border: 1px solid #edf2f7; border-radius: 8px; margin-bottom: 15px; background: #fff;">
                <h3 style="margin: 0 0 5px 0; color: #1B2B48; font-size: 16px;">${c.title}</h3>
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #718096;"><strong>${c.date}</strong> at <strong>${c.time}</strong></p>
                <a href="${c.link}" style="color: #FF8A00; text-decoration: none; font-weight: bold; font-size: 14px; margin-right: 15px;">Join Class →</a>
                ${c.calLink ? `<a href="${c.calLink}" class="cal-btn">📅 Add to Calendar</a>` : ''}
            </div>
        `;
    });

    const content = `
        <h2>Hello ${data.name},</h2>
        <p>Here is your class schedule for the upcoming week. Make sure to add these sessions to your personal calendar so you don't miss out.</p>
        <div style="margin: 25px 0;">
            ${classesHtml}
        </div>
        <p>Please come prepared to participate. We look forward to seeing you there!</p>
    `;
    const text = `Hello ${data.name},\nHere are your classes for the week of ${data.weekStart}.\nCheck your portal for details.`;
    return { subject, html: generateLayout(subject, content), text };
}

export function generateDailyClassReminderEmail(data: { name: string; classTitle: string; time: string; joinLink: string }): EmailTemplateType {
    const subject = `Reminder: ${data.classTitle} starts soon!`;
    const content = `
        <h2>Hi ${data.name},</h2>
        <p>This is a quick reminder that your session <strong>${data.classTitle}</strong> is happening today.</p>
        <div class="highlight">
            <p><strong>Start Time:</strong> ${data.time}</p>
        </div>
        <p>Click the link below to join the virtual classroom. See you there!</p>
    `;
    const text = `Hello ${data.name},\n${data.classTitle} starts at ${data.time}.\nJoin here: ${data.joinLink}`;
    return { subject, html: generateLayout(subject, content, data.joinLink, 'Join Class Now'), text };
}

export function generateSessionRecordingEmail(data: { name: string; classTitle: string; recordingLink: string; dashboardUrl: string }): EmailTemplateType {
    const subject = `Recording Available: ${data.classTitle}`;
    const content = `
        <h2>Hello ${data.name},</h2>
        <p>The recording and deck for <strong>${data.classTitle}</strong> have been uploaded to your portal.</p>
        <p>Whether you missed the live class or just want to review the key frameworks discussed, you can now stream the session on-demand.</p>
    `;
    const text = `Hello ${data.name},\nThe recording for ${data.classTitle} is now available.\nLog in to your portal to watch it.`;
    return { subject, html: generateLayout(subject, content, data.dashboardUrl, 'Watch Recording'), text };
}

export function generateAssignmentDueEmail(data: { name: string; assignmentTitle: string; dueDate: string; submitLink: string }): EmailTemplateType {
    const subject = `Action Required: Assignment Due Soon`;
    const content = `
        <h2>Hi ${data.name},</h2>
        <p>Your assignment <strong>${data.assignmentTitle}</strong> is rapidly approaching its deadline.</p>
        <div class="highlight" style="border-left-color: #e53e3e;">
            <p><strong>Due by:</strong> ${data.dueDate}</p>
        </div>
        <p>Please ensure your work is submitted before the deadline to avoid point deductions. Click below to jump straight to the submission portal.</p>
    `;
    const text = `Hello ${data.name},\nYour assignment ${data.assignmentTitle} is due on ${data.dueDate}.\nSubmit here: ${data.submitLink}`;
    return { subject, html: generateLayout(subject, content, data.submitLink, 'Submit Assignment'), text };
}

export function generateModuleCompletedEmail(data: { name: string; moduleName: string; program: string; dashboardUrl: string }): EmailTemplateType {
    const subject = `Module Completed: ${data.moduleName}`;
    const content = `
        <h2>Congratulations ${data.name}!</h2>
        <p>You have successfully passed and completed the <strong>${data.moduleName}</strong> module within the ${data.program}.</p>
        <p>We are thrilled to see your progress. Keep the momentum going as you unlock your next set of commercial frameworks.</p>
    `;
    const text = `Hello ${data.name},\nYou completed the module ${data.moduleName} in ${data.program}! Good job!`;
    return { subject, html: generateLayout(subject, content, data.dashboardUrl, 'Continue Learning'), text };
}

export function generateCourseCompletedEmail(data: { name: string; program: string; certificateUrl: string }): EmailTemplateType {
    const subject = `🎉 You Did It! ${data.program} Completed`;
    const content = `
        <h2>Massive Congratulations, ${data.name}!</h2>
        <p>Your hard work has paid off. You have officially completed <strong>${data.program}</strong> and proven your mastery of the KSS commercial frameworks.</p>
        <p>Your official Certificate of Completion is now ready. You can download it directly from your portal and add it to your LinkedIn profile to showcase your new credentials.</p>
    `;
    const text = `Hello ${data.name},\nYou have completed ${data.program}! Your certificate is now available.\nDownload here: ${data.certificateUrl}`;
    return { subject, html: generateLayout(subject, content, data.certificateUrl, 'Get Certificate'), text };
}

export function generateFacilitatorSessionReminderEmail(data: { name: string; sessionTitle: string; time: string; link: string }): EmailTemplateType {
    const subject = `Teaching Reminder: ${data.sessionTitle}`;
    const content = `
        <h2>Hello Facilitator ${data.name},</h2>
        <p>You are scheduled to run the session <strong>${data.sessionTitle}</strong> today.</p>
        <div class="grid">
            <div class="grid-item"><strong>Start Time:</strong> <span>${data.time}</span></div>
            <div class="grid-item"><strong>Platform:</strong> <span>Virtual</span></div>
        </div>
        <p>Please ensure you log in 5-10 minutes early. Click below to start the session.</p>
    `;
    const text = `Hello ${data.name},\nYou have a session: ${data.sessionTitle} at ${data.time}.\nJoin here: ${data.link}`;
    return { subject, html: generateLayout(subject, content, data.link, 'Start Session'), text };
}

// ============================================================================
// 4. GENERAL / ADMINISTRATIVE EMAILS
// ============================================================================

export function generateFacilitatorAssignmentEmail(data: { name: string; cohortName: string; program: string; startDate: string; portalUrl: string }): EmailTemplateType {
    const subject = `New Assignment: You are facilitating ${data.cohortName}`;
    const content = `
        <h2>Hello ${data.name},</h2>
        <p>You have been assigned as the lead facilitator for a new cohort!</p>
        <div class="grid">
            <div class="grid-item"><strong>Program:</strong> <span>${data.program}</span></div>
            <div class="grid-item"><strong>Cohort:</strong> <span>${data.cohortName}</span></div>
            <div class="grid-item"><strong>Start Date:</strong> <span>${data.startDate}</span></div>
        </div>
        <p>Please log in to your facilitator portal to review the curriculum and prepare for the upcoming orientation.</p>
    `;
    const text = `Hello ${data.name},\nYou've been assigned to ${data.cohortName} for ${data.program}. Starts ${data.startDate}.`;
    return { subject, html: generateLayout(subject, content, data.portalUrl, 'Go to Facilitator Portal'), text };
}

export function generateAdminNewPaymentAlertEmail(data: { adminName: string; studentName: string; amount: number; currency: string; program: string; portalUrl: string }): EmailTemplateType {
    const subject = `New Payment Alert: ${data.studentName}`;
    const content = `
        <h2>Admin Alert: New Payment Received</h2>
        <p>A new payment has just been processed through the system.</p>
        <div class="highlight" style="border-left-color: #38a169;">
            <p><strong>Student:</strong> ${data.studentName}<br>
            <strong>Amount:</strong> ${data.currency} ${data.amount.toLocaleString()}<br>
            <strong>Program:</strong> ${data.program}</p>
        </div>
        <p>You can view the full transaction details in the admin finance dashboard.</p>
    `;
    const text = `Hello Admin,\nNew payment: ${data.studentName} paid ${data.currency} ${data.amount.toLocaleString()} for ${data.program}.`;
    return { subject, html: generateLayout(subject, content, data.portalUrl, 'View Finance Dashboard'), text };
}
