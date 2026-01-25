import { Router } from 'express';
import { sendContactEmail } from '../utils/emailService.js';

const router = Router();

/**
 * POST /api/contact - Send contact form email
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, email, and message are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: 'Please provide a valid email address',
      });
    }

    // Send email
    await sendContactEmail({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });

    res.json({
      success: true,
      message: 'Contact form submitted successfully',
    });
  } catch (error: any) {
    console.error('Error processing contact form:', error);
    res.status(500).json({
      error: 'Failed to send contact form',
      message: error.message || 'An error occurred while processing your request',
    });
  }
});

export { router as contactRouter };
