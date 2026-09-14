const BREVO_EMAIL_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

function formatRecipient(recipient) {
    if (typeof recipient === "string") {
        return { email: recipient };
    }

    if (recipient && recipient.address) {
        return {
            email: recipient.address,
            ...(recipient.name ? { name: recipient.name } : {})
        };
    }

    throw new Error("A valid email recipient is required");
}

async function sendMail({ to, subject, html, text }) {
    const recipients = (Array.isArray(to) ? to : [to]).map(
        formatRecipient
    );

    const response = await fetch(BREVO_EMAIL_ENDPOINT, {
        method: "POST",
        headers: {
            accept: "application/json",
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json"
        },
        body: JSON.stringify({
            sender: {
                name: "elog - Employee Management System",
                email: process.env.EMAIL_USER
            },
            to: recipients,
            subject,
            ...(html ? { htmlContent: html } : {}),
            ...(text ? { textContent: text } : {})
        }),
        signal: AbortSignal.timeout(15000)
    });

    let result = {};

    try {
        result = await response.json();
    } catch (_error) {
        // Brevo can return an empty body for some infrastructure errors.
    }

    if (!response.ok) {
        const message =
            typeof result.message === "string"
                ? result.message
                : "Email provider request failed";

        throw new Error(`Brevo API error (${response.status}): ${message}`);
    }

    return result;
}

module.exports = { sendMail };
