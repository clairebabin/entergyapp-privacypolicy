const nodemailer = require('nodemailer');

const MONDAY_API_URL = 'https://api.monday.com/v2';
const MONDAY_BOARD_ID = process.env.MONDAY_BOARD_ID || '18431902072';

const EMAIL_COLUMN_ID = 'email_mm7c9v6v';
const DATE_COLUMN_ID = 'date_mm7cacbh';
const WELCOME_SENT_COLUMN_ID = 'boolean_mm7ckhr3';
const STATUS_COLUMN_ID = 'color_mm7cbgq6';

const WELCOME_SUBJECT = 'Thanks for joining Field Notes';

const WELCOME_TEXT = `Thanks for joining Field Notes.

Beaux Terre started with a simple instinct: look again at the things people have learned to ignore.

Land. Infrastructure. Residual material. The systems connecting all three.

We're still early, and we're being intentional about what we share. Field Notes is where we'll send observations, questions, photographs, research, and the occasional update from what we're building.

What gets overlooked still has value.

— Beaux Terre`;

const WELCOME_HTML = `
<div style="font-family: Georgia, 'Times New Roman', serif; color:#1f1c17; max-width:520px; margin:0 auto; line-height:1.7; font-size:16px;">
  <p style="letter-spacing:0.3em; text-transform:uppercase; font-size:12px; color:#6b6558;">Beaux Terre</p>
  <p>Thanks for joining Field Notes.</p>
  <p>Beaux Terre started with a simple instinct: look again at the things people have learned to ignore.</p>
  <p>Land. Infrastructure. Residual material. The systems connecting all three.</p>
  <p>We're still early, and we're being intentional about what we share. Field Notes is where we'll send observations, questions, photographs, research, and the occasional update from what we're building.</p>
  <p><em>What gets overlooked still has value.</em></p>
  <p>&mdash; Beaux Terre</p>
</div>`;

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function addToMondayBoard(email) {
  const columnValues = {
    [EMAIL_COLUMN_ID]: { email, text: email },
    [DATE_COLUMN_ID]: { date: new Date().toISOString().slice(0, 10) },
    [STATUS_COLUMN_ID]: { label: 'Active' },
  };

  const query = `mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
    create_item(board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
      id
    }
  }`;

  const response = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: process.env.MONDAY_API_TOKEN,
    },
    body: JSON.stringify({
      query,
      variables: {
        boardId: MONDAY_BOARD_ID,
        itemName: email,
        columnValues: JSON.stringify(columnValues),
      },
    }),
  });

  const data = await response.json();
  if (data.errors) {
    throw new Error(JSON.stringify(data.errors));
  }
  return data.data.create_item.id;
}

async function markWelcomeSent(itemId) {
  const query = `mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
    change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $columnValues) {
      id
    }
  }`;

  await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: process.env.MONDAY_API_TOKEN,
    },
    body: JSON.stringify({
      query,
      variables: {
        boardId: MONDAY_BOARD_ID,
        itemId,
        columnValues: JSON.stringify({ [WELCOME_SENT_COLUMN_ID]: { checked: 'true' } }),
      },
    }),
  });
}

async function sendWelcomeEmail(email) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"Beaux Terre" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: WELCOME_SUBJECT,
    text: WELCOME_TEXT,
    html: WELCOME_HTML,
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const email = (req.body && req.body.email || '').trim();

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }

  let itemId;
  try {
    itemId = await addToMondayBoard(email);
  } catch (err) {
    console.error('Monday.com error:', err);
    res.status(502).json({ error: 'Could not save your signup right now. Please try again.' });
    return;
  }

  try {
    await sendWelcomeEmail(email);
    await markWelcomeSent(itemId);
  } catch (err) {
    console.error('Welcome email error:', err);
  }

  res.status(200).json({ success: true });
};
