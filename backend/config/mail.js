const dns = require("node:dns").promises;
const nodemailer = require("nodemailer");

let transporterPromise;

async function createTransporter() {
    // Render does not provide an outbound IPv6 route on every service. Resolve
    // Gmail explicitly over IPv4 so email delivery does not fail with
    // ENETUNREACH when DNS also returns an IPv6 address.
    const addresses = await dns.resolve4("smtp.gmail.com");

    if (addresses.length === 0) {
        throw new Error("Unable to resolve an IPv4 address for Gmail SMTP");
    }

    return nodemailer.createTransport({
        host: addresses[0],
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            servername: "smtp.gmail.com",
            minVersion: "TLSv1.2"
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 30000
    });
}

async function sendMail(options) {
    if (!transporterPromise) {
        transporterPromise = createTransporter();
    }

    try {
        const transporter = await transporterPromise;
        return await transporter.sendMail(options);
    } catch (error) {
        // Re-resolve Gmail on the next attempt in case its IP address changed.
        transporterPromise = undefined;
        throw error;
    }
}

module.exports = { sendMail };
