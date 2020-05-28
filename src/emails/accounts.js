const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'abhishek.jain06@sap.com',
        subject: 'Thanks for joining in !!',
        text: `welcome to the app , ${name}. let me know how you get along the app`
    })
}

const sendCancelEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'abhishek.jain06@sap.com',
        subject: 'Thanks for your support',
        text: `Hi, ${name}. We really look forward to meet you again`
    })
}
module.exports ={
    sendWelcomeEmail,
    sendCancelEmail
}