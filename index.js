const bot = require('./bot');
const cnf = require('./config');
const nodemailer = require('nodemailer');

async function sendMail(users) {
    let testAccount = await nodemailer.createTestAccount();
    const renderList = () => {
        let string = '';

        for (let u of users)
            string += `<br/> <li>${JSON.stringify(u)}</li>`;

        return string;
    };

    let transporter = nodemailer.createTransport({
        host: "youremail.host.net",
        port: 587,
        secure: false,
        auth: {
            user: "your@email.com",
            pass: "youremailpassw0rd"
        }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Mohsen Instagram 👳‍ 👻" <your@email.com>', // sender address
        to: 'your@otheremail.com', // list of receivers
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

