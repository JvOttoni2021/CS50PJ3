const MAIL_BOX_CONTENT = '<a class="email_view_button" href="#" data-message="#EMAIL_ID#" onclick="open_visualization(event, this, \'#HIDE_ARCHIVE#\')"> \
                          <div class="mail_box_content" style="background-color: #BACKGROUND_COLOR#;">\
                          <div><b>Sender:</b> #SENDER# | <b>Subject:</b> #SUBJECT#</div>\
                          <div>#TIMESTAMP#</div></div></a>';

const MAIL_BODY_CONTENT = '<div class="mail_body_content">\
                            <div><b>From:</b> #SENDER#</div>\
                            <div><b>To:</b> #RECIPIENT#</div>\
                            <div><b>Subject:</b> #SUBJECT#</div>\
                            <div><b>Timestamp:</b> #TIMESTAMP#</div>\
                            <div #HIDE_ARCHIVE#><button class="btn btn-sm btn-outline-primary" id="archive_button" onclick="put_arquive(#EMAIL_ID#)">#ARCHIVE_TEXT#</button>\
                            <button class="btn btn-sm btn-outline-primary" id="archive_button" onclick="compose_email(\'#SENDER#\', \'#SUBJECT#\', \'#BODY#\', \'#TIMESTAMP#\')">Reply</button></div>\
                            <div><hr></div>\
                            <div>#BODY#</div>\
                          </div>';

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

function compose_email(recipient = '', subject = '', body = '', timestamp = "") {

  if (recipient !== "") {
    if (!subject.startsWith("Re: ")) subject = "Re: " + subject;
    body = `${timestamp} ${recipient} wrote: \r\n${body}`.replaceAll("<br>", "\r\n");
  }

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-content-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-validation-message').innerHTML = "";
  document.querySelector('#compose-recipients').value = recipient;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
}

async function open_visualization(event, element, hide_archive) {

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-content-view').style.display = 'block';

  event.preventDefault();
  mail = await get_response(element.dataset.message);

  if (!mail.read){
    put_read(mail.id, true);
  }

  document.querySelector('#email-content-view').innerHTML = get_mail_box_formated(mail.id, mail.sender, mail.subject, mail.timestamp, mail.read, mail.body, mail.recipients.join(", "), hide_archive, mail.archived);
}

async function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-content-view').style.display = 'none';

  const emails = await get_response(mailbox);
  let mail_list = "";
  let hide_archive = '';
  if (mailbox === 'sent') hide_archive = 'hidden';
  
  emails.forEach(mail => {
    mail_list = mail_list + get_mail_box_formated(mail.id, mail.sender, mail.subject, mail.timestamp, mail.read, "", "", hide_archive, "");
  });
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3><div id="mailbox_mails">${mail_list}</div>`;
}

function get_mail_box_formated(id, sender, subject, timestamp, read, body, recipient, hide_archive, archived) {
  let background_color = "white";
  if (read) background_color = "#ced4da";

  let archive_text = "Archive";
  if (archived) archive_text = "Unarchive";

  let replace_values = {
    "#EMAIL_ID#": id,
    "#SUBJECT#": subject,
    "#TIMESTAMP#": timestamp,
    "#SENDER#": sender,
    "#BACKGROUND_COLOR#": background_color,
    "#BODY#": body.replace(/\r?\n/g, '<br>'),
    "#RECIPIENT#": recipient,
    "#HIDE_ARCHIVE#": hide_archive,
    "#ARCHIVE_TEXT#": archive_text
  }

  let formatted_return = MAIL_BOX_CONTENT;

  if (body !== "") formatted_return = MAIL_BODY_CONTENT;

  for (let [key, value] of Object.entries(replace_values)) {
    formatted_return = formatted_return.replaceAll(key, value);
  }

  return formatted_return;
}

function validate_compose(recipients, subject, body) {
  const recipients_list = recipients.split(',');

  recipients_list.forEach(element => {
    if (!is_address_valid(element)) return 'Invalid recipient address.';
  });

  if (subject.trim() === "") return 'Subject must not be empty';
  if (body.trim() === "") return 'Body must not be empty';
  return '';
}

function is_address_valid(email_address) {
  // i'm not going deep into validation, only validating basic formatting
  const email_parts = email_address.split('@');

  if (email_parts.length !== 2) return false;

  const domain = email_parts[1];

  if (!domain.includes('.')) return false;

  return true;
}
