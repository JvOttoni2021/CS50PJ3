
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
        return result;
    })
    .catch(error => {
        console.error('Error:', error);
        throw error;
    });
}

function put_read(id, read) {
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
        read: read
        })
})
}

async function put_arquive(id) {
    const mail = await get_response(id);

    await fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
        archived: !mail.archived
        })
    })

    load_mailbox('inbox');
}