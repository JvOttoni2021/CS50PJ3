const MAIL_BOX_CONTENT = '<div class="mail_box_content" style="background-color: #BORDER_COLOR#;"><div><b>Sender:</b> #SENDER# | <b>Subject:</b> #SUBJECT#</div><div>#TIMESTAMP#</div></div>';

document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  const compose_form = document.querySelector('#compose-form');

  compose_form.addEventListener('submit', async event => {
    event.preventDefault();

    const recipients = compose_form.querySelector('#compose-recipients').value;
    const subject = compose_form.querySelector('#compose-subject').value;
    const body = compose_form.querySelector('#compose-body').value;

    const return_validation = validate_compose(recipients, subject, body);

    if (return_validation !== '') {
      document.querySelector('#compose-validation-message').innerHTML = return_validation;
      return;
    }

    const response = await post_email(recipients, subject, body);

    if (response.error !== undefined) {
      document.querySelector('#compose-validation-message').innerHTML = response.error;
      return;
    }

    load_mailbox('sent');
  });
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-validation-message').innerHTML = "";
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

async function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  const emails = await get_response(mailbox);
  let mail_list = "";
  emails.forEach(mail => {
    mail_list = mail_list + get_mail_box_formated(mail.sender, mail.subject, mail.timestamp);
  });
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3><div id="mailbox_mails">${mail_list}</div>`;
}

function get_mail_box_formated(sender, subject, timestamp, read) {
  let border_color = "white";
  if (read) {
    border_color = "gray";
  }

  let replace_values = {
    "#SUBJECT#": subject,
    "#TIMESTAMP#": timestamp,
    "#SENDER#": sender,
    "#BORDER_COLOR#": border_color
  }

  let formatted_return = MAIL_BOX_CONTENT;

  for (let [key, value] of Object.entries(replace_values)) {
    formatted_return = formatted_return.replace(key, value);
  }

  return formatted_return;
}

async function get_response(parameter) {
  return fetch(`/emails/${parameter}`)
  .then(response => response.json())
  .then(emails => {
    return emails;
  })
  .catch(error => {
    console.error('Error:', error);
    throw error;
  });
}

async function post_email(recipients, subject, body) {
  return fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
    return result;
  })
  .catch(error => {
    console.error('Error:', error);
    throw error;
  });
}

function validate_compose(recipients, subject, body) {
  const recipients_list = recipients.split(',');

  recipients_list.forEach(element => {
    if (!is_address_valid(element)) {
      return 'Invalid recipient address.';
    }
  });

  if (subject.trim() === "") {
    return 'Subject must not be empty';
  }

  if (body.trim() === "") {
    return 'Body must not be empty';
  }

  return '';
}

function is_address_valid(email_address) {
  // i'm not going deep into validation, only validating basic formatting
  const email_parts = email_address.split('@');

  if (email_parts.length !== 2) {
    return false;
  }

  const domain = email_parts[1];

  if (!domain.includes('.')) {
    return false;
  }

  return true;
}