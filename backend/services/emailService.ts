import nodemailer from 'nodemailer';
import { config } from '../config';

// Create transporter for OVH SMTP
const createTransporter = () => {
  const emailPassword = process.env.EMAIL_PASSWORD;
  
  if (!emailPassword) {
    console.warn('⚠️ EMAIL_PASSWORD not set - email service will not work');
  }

  return nodemailer.createTransport({
    host: 'mail.ovh.net',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: 'contact@fisafigroupe.com',
      pass: emailPassword || '',
    },
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
      await this.transporter.sendMail({
        from: 'contact@fisafigroupe.com',
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
      console.log(`✅ Confirmation email sent to ${visitorEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending confirmation email:', error);
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
        from: 'contact@fisafigroupe.com',
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
    userName: string
  ): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: 'contact@fisafigroupe.com',
        to: userEmail,
        subject: 'Confirmation d\'inscription - FiSAFi Groupe',
        html: `
          <h2>Bienvenue ${userName}!</h2>
          <p>Merci de vous être inscrit sur <strong>FiSAFi Groupe</strong>.</p>
          <p>Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter à votre espace personnel.</p>
          <p>
            <a href="https://www.fisafigroupe.com/login" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Se connecter
            </a>
          </p>
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
        from: 'contact@fisafigroupe.com',
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
        from: 'contact@fisafigroupe.com',
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
        from: 'contact@fisafigroupe.com',
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
        from: 'contact@fisafigroupe.com',
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
      await this.transporter.verify();
      console.log('✅ Email service connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  },
};
