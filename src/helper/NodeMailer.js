

const nodemailer = require('nodemailer');

function SendMail(to, subject, text, html,attachments) {
    // Create a transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL, // your email address
            pass: process.env.EMAIL_PASSWORD // your email password
        }
    });

    // Setup email data with unicode symbols
    let mailOptions = {
        from: process.env.EMAIL, // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        attachments: attachments
  };
    text ? mailOptions.text = text : mailOptions.html = html

    // Send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
}


module.exports = SendMail
