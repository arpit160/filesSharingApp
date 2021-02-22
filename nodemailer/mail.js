const nodemailer=require('nodemailer');
require('dotenv').config();

const sendEmail = async (from,to, subject, message,html ) => {
console.log(process.env.emailport)
try {
    // Create a transporter
    let transporter = nodemailer.createTransport({
    host: process.env.smtp,
    port: process.env.emailport,
    auth: {
        user: process.env.emailuser,
        pass: process.env.emailpassword,
    },
    tls: {
        rejectUnauthorized: false
      }
    });

    // send mail with defined transport object

    let mailStatus = await transporter.sendMail({
    from:from ,        
    to: to,           
    subject: subject, 
    text: message,
    html:html    
    });

    console.log(`Message sent: ${mailStatus.messageId}`);
    return `Message sent: ${mailStatus.messageId}`;
}
catch (error) {
    console.error(error);
}
};

module.exports={sendEmail}