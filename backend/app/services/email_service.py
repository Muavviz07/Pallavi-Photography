from datetime import datetime
import logging
from typing import Optional
import resend
from app.core.config import settings

logger = logging.getLogger(__name__)

# Premium email HTML wrapper styling
EMAIL_STYLES = """
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FCFAF7; color: #2C2623; margin: 0; padding: 40px 20px; }
  .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #DCD0C0; padding: 40px; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
  .logo { text-align: center; margin-bottom: 30px; }
  .logo h1 { font-family: Georgia, serif; font-size: 26px; font-weight: 300; letter-spacing: 0.2em; color: #2C2623; margin: 0; text-transform: uppercase; }
  .logo span { font-size: 9px; letter-spacing: 0.35em; color: #6E635F; text-transform: uppercase; display: block; margin-top: 2px; }
  .content { font-size: 14px; line-height: 1.6; color: #2C2623; font-weight: 300; }
  .cta-btn { display: inline-block; background-color: #2C2623; color: #FCFAF7 !important; text-decoration: none; padding: 12px 30px; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.15em; border-radius: 2px; margin: 25px 0; }
  .cta-btn:hover { background-color: #352F2C; }
  .accent-box { background-color: #F5EFEB; border-left: 3px solid #C4A484; padding: 15px; margin: 20px 0; font-size: 13px; }
  .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #6E635F; letter-spacing: 0.1em; border-top: 1px solid #EAE4DC; padding-top: 20px; }
</style>
"""

class EmailService:
    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        if self.api_key:
            resend.api_key = self.api_key
            logger.info("Resend SDK initialized for EmailService.")
        else:
            logger.warning("RESEND_API_KEY is missing. Emails will be logged to stdout.")

    def _send(self, to_email: str, subject: str, html_body: str) -> bool:
        if self.api_key:
            try:
                resend.Emails.send({
                    "from": "Pallavi Photography <noreply@pallaviphotography.com>",
                    "to": to_email,
                    "subject": subject,
                    "html": html_body
                })
                logger.info(f"Successfully sent Resend email to {to_email}")
                return True
            except Exception as e:
                logger.error(f"Failed to send email via Resend API: {e}")
                return False
        else:
            # Print mock formatted email to terminal stdout
            print(f"\n{'='*25} MOCK EMAIL DESPATCH {'='*25}")
            print(f"TO:      {to_email}")
            print(f"FROM:    noreply@pallaviphotography.com")
            print(f"SUBJECT: {subject}")
            print(f"HTML CONTENT:")
            print(html_body)
            print(f"{'='*72}\n")
            return True

    def send_gallery_shared_email(
        self, to_email: str, gallery_title: str, gallery_link: str, password: Optional[str] = None
    ) -> bool:
        """
        Sends an invitation link to the client for unlocking their private gallery.
        """
        password_section = ""
        if password:
            password_section = f"""
            <div class="accent-box">
              <strong>Gallery Entry Password:</strong> <code style="font-family: monospace; font-size: 14px; background: #e0d9d4; padding: 2px 6px; border-radius: 2px;">{password}</code>
              <br/><span style="font-size: 11px; color:#6E635F;">Keep this password confidential. You will be prompted to enter it to unlock your pictures.</span>
            </div>
            """

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          {EMAIL_STYLES}
        </head>
        <body>
          <div class="card">
            <div class="logo">
              <h1>PALLAVI</h1>
              <span>Photography</span>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Your private photography gallery <strong>"{gallery_title}"</strong> has been prepared and is ready for viewing.</p>
              <p>You can view and manage your photo selections by clicking the link below:</p>
              <div style="text-align: center;">
                <a href="{gallery_link}" class="cta-btn">View My Gallery</a>
              </div>
              {password_section}
              <p>Please note that this gallery contains your high-quality proofs. If selections are enabled, you can mark your favorite frames directly inside the portal and submit them for final touch-ups.</p>
              <p>Best regards,<br/>Pallavi Photography</p>
            </div>
            <div class="footer">
              © {datetime.now().year} Pallavi Photography, Switzerland. All rights reserved.
            </div>
          </div>
        </body>
        </html>
        """
        return self._send(to_email, f"Your Private Gallery '{gallery_title}' is Ready", html_body)

    def send_selections_submitted_email(
        self, admin_email: str, client_email: str, gallery_title: str, selected_count: int
    ) -> bool:
        """
        Notifies the administrator that the client has finalized their image selections.
        """
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          {EMAIL_STYLES}
        </head>
        <body>
          <div class="card">
            <div class="logo">
              <h1>PALLAVI</h1>
              <span>Photography</span>
            </div>
            <div class="content">
              <p>Dear Pallavi,</p>
              <p>Your client (<strong>{client_email}</strong>) has finalized and submitted their image selections for their private gallery: <strong>"{gallery_title}"</strong>.</p>
              <div class="accent-box">
                <strong>Selection Details:</strong>
                <ul>
                  <li>Gallery: {gallery_title}</li>
                  <li>Client Email: {client_email}</li>
                  <li>Selected Frames: <strong>{selected_count} image(s)</strong></li>
                </ul>
              </div>
              <p>You can log in to the Admin Dashboard to download the client's selected selection list or review details.</p>
              <div style="text-align: center;">
                <a href="{settings.NEXTAUTH_URL}/dashboard" class="cta-btn">Go to Admin Dashboard</a>
              </div>
              <p>Best regards,<br/>System Automated Dispatch</p>
            </div>
            <div class="footer">
              © {datetime.now().year} Pallavi Photography System.
            </div>
          </div>
        </body>
        </html>
        """
        return self._send(admin_email, f"Selections Finalized: {gallery_title} ({client_email})", html_body)

    def send_gallery_updated_email(self, to_email: str, gallery_title: str, gallery_link: str) -> bool:
        """
        Notifies the client that their gallery has been updated.
        """
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          {EMAIL_STYLES}
        </head>
        <body>
          <div class="card">
            <div class="logo">
              <h1>PALLAVI</h1>
              <span>Photography</span>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>New photos have been uploaded and added to your private gallery <strong>"{gallery_title}"</strong>.</p>
              <p>Please click the button below to view the updated gallery:</p>
              <div style="text-align: center;">
                <a href="{gallery_link}" class="cta-btn">View Updated Gallery</a>
              </div>
              <p>If you've already started making selections, your saved progress has been preserved.</p>
              <p>Best regards,<br/>Pallavi Photography</p>
            </div>
            <div class="footer">
              © {datetime.now().year} Pallavi Photography, Switzerland.
            </div>
          </div>
        </body>
        </html>
        """
        return self._send(to_email, f"Gallery Updated: '{gallery_title}'", html_body)

    def send_booking_requested_email(
        self, admin_email: str, client_name: str, client_email: str, booking_date: str, booking_time: str, message: Optional[str] = None
    ) -> bool:
        """
        Notifies the admin that a new session booking has been requested.
        """
        message_section = f"<p><strong>Message:</strong> {message}</p>" if message else ""
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          {EMAIL_STYLES}
        </head>
        <body>
          <div class="card">
            <div class="logo">
              <h1>PALLAVI</h1>
              <span>Photography</span>
            </div>
            <div class="content">
              <p>Dear Pallavi,</p>
              <p>A new photoshoot session has been requested by <strong>{client_name}</strong> (<strong>{client_email}</strong>).</p>
              <div class="accent-box">
                <strong>Booking Request Details:</strong>
                <ul>
                  <li>Client: {client_name} ({client_email})</li>
                  <li>Date: {booking_date}</li>
                  <li>Time: {booking_time}</li>
                </ul>
                {message_section}
              </div>
              <p>Please log in to the admin panel to approve or decline this request.</p>
              <div style="text-align: center;">
                <a href="{settings.NEXTAUTH_URL}/admin/bookings" class="cta-btn">Manage Bookings</a>
              </div>
              <p>Best regards,<br/>System Dispatch</p>
            </div>
            <div class="footer">
              © {datetime.now().year} Pallavi Photography System.
            </div>
          </div>
        </body>
        </html>
        """
        return self._send(admin_email, f"New Booking Request from {client_name}", html_body)

    def send_booking_status_updated_email(
        self, client_email: str, client_name: str, booking_date: str, booking_time: str, status: str
    ) -> bool:
        """
        Informs the client about their booking request status change.
        """
        status_text = "approved" if status == "approved" else "declined"
        intro_text = f"We are pleased to inform you that your booking request has been <strong>{status_text}</strong>!" if status == "approved" else f"We regret to inform you that we are unable to accept your booking request for the specified slot."
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          {EMAIL_STYLES}
        </head>
        <body>
          <div class="card">
            <div class="logo">
              <h1>PALLAVI</h1>
              <span>Photography</span>
            </div>
            <div class="content">
              <p>Hello {client_name},</p>
              <p>{intro_text}</p>
              <div class="accent-box">
                <strong>Your Booking Details:</strong>
                <ul>
                  <li>Date: {booking_date}</li>
                  <li>Time: {booking_time}</li>
                  <li>Status: <span style="text-transform: uppercase; font-weight: bold; color: {'#2e7d32' if status == 'approved' else '#c62828'};">{status}</span></li>
                </ul>
              </div>
              <p>If you have any questions or need to make changes, please reply directly to this email or call us.</p>
              <p>Best regards,<br/>Pallavi Photography</p>
            </div>
            <div class="footer">
              © {datetime.now().year} Pallavi Photography, Switzerland.
            </div>
          </div>
        </body>
        </html>
        """
        return self._send(client_email, f"Booking Request Update: {status_text.capitalize()}", html_body)

    def send_contact_enquiry_received_email(
        self, admin_email: str, visitor_name: str, visitor_email: str, message: str
    ) -> bool:
        """
        Notifies the admin that a new contact form enquiry has been received.
        """
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          {EMAIL_STYLES}
        </head>
        <body>
          <div class="card">
            <div class="logo">
              <h1>PALLAVI</h1>
              <span>Photography</span>
            </div>
            <div class="content">
              <p>Dear Pallavi,</p>
              <p>You have received a new message via the contact form on your website.</p>
              <div class="accent-box">
                <strong>Enquiry Details:</strong>
                <p><strong>From:</strong> {visitor_name} (<a href="mailto:{visitor_email}">{visitor_email}</a>)</p>
                <p><strong>Message:</strong></p>
                <p style="white-space: pre-wrap;">{message}</p>
              </div>
              <p>You can reply directly to the visitor's email address.</p>
            </div>
            <div class="footer">
              © {datetime.now().year} Pallavi Photography System.
            </div>
          </div>
        </body>
        </html>
        """
        return self._send(admin_email, f"New Website Enquiry from {visitor_name}", html_body)

    def send_contact_auto_reply_email(
        self, visitor_email: str, visitor_name: str
    ) -> bool:
        """
        Sends an automated confirmation email to the visitor.
        """
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          {EMAIL_STYLES}
        </head>
        <body>
          <div class="card">
            <div class="logo">
              <h1>PALLAVI</h1>
              <span>Photography</span>
            </div>
            <div class="content">
              <p>Hello {visitor_name},</p>
              <p>Thank you for reaching out and getting in touch! We have received your message and will read it shortly.</p>
              <p>We typically respond within 24-48 hours. If your request is urgent, please feel free to call or WhatsApp us.</p>
              <p>Have a wonderful day!</p>
              <p>Best regards,<br/>Pallavi Photography</p>
            </div>
            <div class="footer">
              © {datetime.now().year} Pallavi Photography, Switzerland.
            </div>
          </div>
        </body>
        </html>
        """
        return self._send(visitor_email, "Thank you for contacting Pallavi Photography", html_body)

    def send_newsletter_opt_in_email(
        self, subscriber_email: str, opt_in_link: str
    ) -> bool:
        """
        Sends an email confirmation for double opt-in subscription.
        """
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          {EMAIL_STYLES}
        </head>
        <body>
          <div class="card">
            <div class="logo">
              <h1>PALLAVI</h1>
              <span>Photography</span>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Thank you for subscribing to our newsletter! Please click the button below to confirm your subscription and join our mailing list.</p>
              <div style="text-align: center;">
                <a href="{opt_in_link}" class="cta-btn">Confirm Subscription</a>
              </div>
              <p>If you did not make this request, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              © {datetime.now().year} Pallavi Photography, Switzerland.
            </div>
          </div>
        </body>
        </html>
        """
        return self._send(subscriber_email, "Confirm Your Newsletter Subscription", html_body)

    def send_newsletter_broadcast_email(
        self, subscriber_email: str, subject: str, title: str, content: str, unsubscribe_link: str
    ) -> bool:
        """
        Sends a newsletter email broadcast to subscribers.
        """
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          {EMAIL_STYLES}
        </head>
        <body>
          <div class="card">
            <div class="logo">
              <h1>PALLAVI</h1>
              <span>Photography</span>
            </div>
            <div class="content">
              <h2 style="font-family: Georgia, serif; font-size: 20px; font-weight: normal; color: #2C2623;">{title}</h2>
              <div style="font-size: 14px; line-height: 1.6; color: #2C2623; font-weight: 300;">
                {content}
              </div>
              <p>Best regards,<br/>Pallavi Photography</p>
            </div>
            <div class="footer">
              <p>© {datetime.now().year} Pallavi Photography, Switzerland.</p>
              <p style="font-size: 9px;">You are receiving this email because you subscribed to our newsletter. <a href="{unsubscribe_link}" style="color: #6E635F; text-decoration: underline;">Unsubscribe here</a></p>
            </div>
          </div>
        </body>
        </html>
        """
        return self._send(subscriber_email, subject, html_body)

# Singleton instance
email_service = EmailService()



