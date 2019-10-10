const bot = require('./bot');
const cnf = require('./config');
const nodemailer = require('nodemailer');

// async..await is not allowed in global scope, must use a wrapper
async function sendMail(users) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();
    const renderList = () => {
        let string = '';

        for (let u of users)
            string += `<br/> <li>${JSON.stringify(u)}</li>`;

        return string;
    };
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "ssl0.ovh.net",
        port: 587,
        secure: false,
        auth: {
            user: "badii@xdabier.com",
            pass: "badet@123"
        }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Mohsen Instagram 👳‍ 👻" <badii@xdabier.com>', // sender address
        to: 'hello@vegabowl.com, ingrid.garcia.jones@gmail.com, rami.mestiri.ept@gmail.com, hello@bags', // list of receivers
        subject: 'Rapport Mohsen', // Subject line
        html: `
        <h1>Mohsen Instagram RETURN!</h1>
        <br/>
        <br/>
        <h3>
        ${users}
        </h3>
        ` // html body
    });

    console.log('Message sent: %s', info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}


const runBot = () => {
    bot.fetchInstagram().then((users) => {
        console.log('completed.. sending mail == ', users);
            sendMail(users).then(() => {
                console.log('mail sent');
            }).catch((err) => {
                console.log('mail not sent = ', err);
            });
    });
};

runBot();

setInterval(runBot, cnf.settings.run_every_x_hours * 3600000);

