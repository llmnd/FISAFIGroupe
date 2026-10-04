import nodemailer from 'nodemailer';
import { config } from '../config';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);

const emailHost = process.env.EMAIL_HOST || 'mail.ovh.net';
const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);
const emailFromAddress = process.env.EMAIL_FROM || 'contact@fisafigroupe.com';
const emailFrom = {
  name: process.env.EMAIL_FROM_NAME || 'FiSAFi Groupe',
  address: emailFromAddress,
};

// Create transporter for the configured SMTP provider
const createTransporter = () => {
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailUser = process.env.EMAIL_USER || emailFromAddress;
  
  console.log('[📧 Email Service] Initializing OVH SMTP transporter...');
  console.log('[📧 Email Service] From:', emailFrom);
  console.log('[📧 Email Service] Host:', `${emailHost}:${emailPort}`);
  console.log('[📧 Email Service] Password set:', !!emailPassword ? '✅ YES' : '❌ NO');

  if (!emailPassword) {
    console.error('⚠️ [📧 Email Service] WARNING: EMAIL_PASSWORD not set! Emails will not send.');
    console.error('[📧 Email Service] Add EMAIL_PASSWORD to .env.local');
  }

  return nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465,  // true for 465, false for 587
    auth: {
      user: emailUser,
      pass: emailPassword || '',
    },
    // Timeouts to prevent long blocking during startup/deploys
    connectionTimeout: 5000, // ms
    greetingTimeout: 5000,
    socketTimeout: 5000,
  });
};

export const emailService = {
  transporter: createTransporter(),

  /**
   * Send a contact form response email
   */
  async sendContactConfirmation(
    visitorEmail: string,
    visitorName: string,
    subject: string
  ): Promise<boolean> {
    try {
      console.log(`[📧 Email Service] Sending contact confirmation to: ${visitorEmail}`);
      await this.transporter.sendMail({
        from: emailFrom,
        to: visitorEmail,
        subject: `Confirmation: ${subject} - FiSAFi Groupe`,
        html: `
          <h2>Merci ${visitorName}!</h2>
          <p>Nous avons bien reçu votre message concernant: <strong>${subject}</strong></p>
          <p>Notre équipe vous répondra dans les plus brefs délais.</p>
          <br/>
          <p>Cordialement,<br/>
          <strong>FiSAFi Groupe</strong><br/>
          <a href="https://www.fisafigroupe.com">www.fisafigroupe.com</a></p>
        `,
      });
      console.log(`✅ [📧 Email Service] Confirmation email sent to ${visitorEmail}`);
      return true;
    } catch (error: any) {
      console.error(`❌ [📧 Email Service] Error sending confirmation email to ${visitorEmail}:`, error.message);
      return false;
    }
  },

  /**
   * Send admin notification when contact form is submitted
   */
  async sendContactAdminNotification(
    visitorName: string,
    visitorEmail: string,
    phone: string | null,
    subject: string,
    message: string
  ): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: emailFrom,
        to: 'contact@fisafigroupe.com', // Send to admin
        subject: `[NEW CONTACT] ${subject}`,
        html: `
          <h2>Nouveau message de contact</h2>
          <p><strong>Nom:</strong> ${visitorName}</p>
          <p><strong>Email:</strong> ${visitorEmail}</p>
          ${phone ? `<p><strong>Téléphone:</strong> ${phone}</p>` : ''}
          <p><strong>Sujet:</strong> ${subject}</p>
          <hr/>
          <h3>Message:</h3>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
      });
      console.log(`✅ Admin notification sent for: ${subject}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending admin notification:', error);
      return false;
    }
  },

  /**
   * Send registration confirmation email
   */
  async sendRegistrationConfirmation(
    userEmail: string,
    userName: string,
    verificationUrl?: string,
  ): Promise<boolean> {
    try {
      const safeUserName = escapeHtml(userName);
      const safeVerificationUrl = verificationUrl ? escapeHtml(verificationUrl) : undefined;
      await this.transporter.sendMail({
        from: emailFrom,
        to: userEmail,
        subject: verificationUrl
          ? 'Vérifiez votre adresse email - FiSAFi Groupe'
          : 'Confirmation d\'inscription - FiSAFi Groupe',
        html: `
          <h2>Bienvenue ${safeUserName}!</h2>
          <p>Merci de vous être inscrit sur <strong>FiSAFi Groupe</strong>.</p>
          ${
            safeVerificationUrl
              ? `<p>Confirmez votre adresse pour recevoir par email les mises à jour de vos devis FiSAFi Market. Vous pouvez déjà vous connecter et passer commande.</p>
            <p><a href="${safeVerificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Vérifier mon adresse email</a></p>
            <p>Ce lien expire dans 24 heures. Si vous n’avez pas créé ce compte, ignorez ce message.</p>`
              : `<p>Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter à votre espace personnel.</p>
            <p><a href="https://www.fisafigroupe.com/login" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Se connecter</a></p>`
          }
          <br/>
          <p>Cordialement,<br/>
          <strong>FiSAFi Groupe</strong><br/>
          <a href="https://www.fisafigroupe.com">www.fisafigroupe.com</a></p>
        `,
      });
      console.log(`✅ Registration confirmation sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending registration email:', error);
      return false;
    }
  },

  async sendMarketQuotationStatus(
    userEmail: string,
    userName: string,
    reference: string,
    status: string,
    amount: number,
  ): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: emailFrom,
        to: userEmail,
        subject: `Mise à jour de votre devis ${reference} — FiSAFi Market`,
        html: `
          <h2>Bonjour ${escapeHtml(userName)},</h2>
          <p>Le statut de votre demande FiSAFi Market a changé.</p>
          <p><strong>Devis :</strong> ${escapeHtml(reference)}<br/>
          <strong>Statut :</strong> ${escapeHtml(status)}<br/>
          <strong>Total :</strong> ${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(amount)} FCFA</p>
          <p>Connectez-vous à votre <a href="https://www.fisafigroupe.com/dashboard">espace FiSAFi</a> pour consulter vos devis.</p>
        `,
      });
      return true;
    } catch (error) {
      console.error(`❌ Market quotation status email failed for ${userEmail}:`, error);
      return false;
    }
  },

  /**
   * Send formation subscription confirmation
   */
  async sendFormationSubscriptionConfirmation(
    userEmail: string,
    userName: string,
    formationName: string
  ): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: emailFrom,
        to: userEmail,
        subject: `Inscription confirmée: ${formationName} - FiSAFi Groupe`,
        html: `
          <h2>Inscription confirmée!</h2>
          <p>Bonjour ${userName},</p>
          <p>Votre inscription à la formation <strong>${formationName}</strong> a été confirmée.</p>
          <p>Vous recevrez prochainement les détails de la formation par email.</p>
          <br/>
          <p>Des questions? N'hésitez pas à nous contacter:</p>
          <p>📧 contact@fisafigroupe.com<br/>
          🌐 <a href="https://www.fisafigroupe.com">www.fisafigroupe.com</a></p>
          <br/>
          <p>Cordialement,<br/>
          <strong>FiSAFi Groupe</strong></p>
        `,
      });
      console.log(`✅ Formation subscription email sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending formation subscription email:', error);
      return false;
    }
  },

  /**
   * Send admin notification for new formation subscription
   */
  async sendFormationSubscriptionAdminNotification(
    userName: string,
    userEmail: string,
    formationName: string
  ): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: emailFrom,
        to: 'contact@fisafigroupe.com',
        subject: `[NEW INSCRIPTION] ${formationName} - ${userName}`,
        html: `
          <h2>Nouvelle inscription à une formation</h2>
          <p><strong>Utilisateur:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Formation:</strong> ${formationName}</p>
          <p>Merci de confirmer cette inscription en base de données si nécessaire.</p>
        `,
      });
      console.log(`✅ Admin notification sent for formation: ${formationName}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending admin formation notification:', error);
      return false;
    }
  },

  /**
   * Send inscription acceptance email to user
   */
  async sendFormationAcceptanceEmail(
    userEmail: string,
    userName: string,
    formationName: string,
    sessionStartDate?: Date | null,
    location?: string | null
  ): Promise<boolean> {
    try {
      const dateStr = sessionStartDate 
        ? new Date(sessionStartDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'À déterminer';
      
      await this.transporter.sendMail({
        from: emailFrom,
        to: userEmail,
        subject: `Votre inscription acceptée: ${formationName} - FiSAFi Groupe`,
        html: `
          <h2>🎉 Bonne nouvelle ${userName}!</h2>
          <p>Votre inscription à la formation <strong>${formationName}</strong> a été <strong>acceptée et confirmée</strong>.</p>
          
          <h3>Détails de la formation:</h3>
          <ul>
            <li><strong>Formation:</strong> ${formationName}</li>
            <li><strong>Date:</strong> ${dateStr}</li>
            ${location ? `<li><strong>Lieu:</strong> ${location}</li>` : ''}
          </ul>
          
          <p>Nous vous enverrons prochainement les informations complètes et les modalités d'accès.</p>
          
          <br/>
          <p>Questions? Contactez-nous:<br/>
          📧 contact@fisafigroupe.com<br/>
          🌐 <a href="https://www.fisafigroupe.com">www.fisafigroupe.com</a></p>
          
          <br/>
          <p>Cordialement,<br/>
          <strong>FiSAFi Groupe</strong></p>
        `,
      });
      console.log(`✅ Formation acceptance email sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending acceptance email:', error);
      return false;
    }
  },

  /**
   * Send inscription rejection/waitlist email to user
   */
  async sendFormationRejectionEmail(
    userEmail: string,
    userName: string,
    formationName: string
  ): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: emailFrom,
        to: userEmail,
        subject: `Statut de votre inscription: ${formationName} - FiSAFi Groupe`,
        html: `
          <h2>Information sur votre inscription</h2>
          <p>Bonjour ${userName},</p>
          <p>Nous vous remercions de votre intérêt pour la formation <strong>${formationName}</strong>.</p>
          
          <p>Malheureusement, votre inscription n'a pas pu être confirmée pour le moment. Cependant, nous vous gardons en mémoire et vous recontacterons si des places se libèrent.</p>
          
          <p>D'autres sessions de cette formation seront organisées. N'hésitez pas à nous contacter pour connaître les prochaines dates.</p>
          
          <br/>
          <p>Nous vous remercions de votre compréhension.<br/>
          <strong>FiSAFi Groupe</strong><br/>
          📧 contact@fisafigroupe.com<br/>
          🌐 <a href="https://www.fisafigroupe.com">www.fisafigroupe.com</a></p>
        `,
      });
      console.log(`✅ Formation rejection email sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending rejection email:', error);
      return false;
    }
  },

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('[📧 Email Service] Testing SMTP connection...');
      await this.transporter.verify();
      console.log('✅ [📧 Email Service] SMTP connection SUCCESSFUL! Email service is ready.');
      return true;
    } catch (error: any) {
      console.error('❌ [📧 Email Service] SMTP connection FAILED!');
      console.error('[📧 Email Service] Error:', error.message);
      console.error('[📧 Email Service] Code:', error.code);
      console.error('[📧 Email Service] Reason:', error);
      return false;
    }
  },
};
