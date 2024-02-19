import nodemailer from 'nodemailer';
import pug from 'pug';
import { convert } from 'html-to-text';
import { User } from '../types/generics';

export class Email {
    firstName: string;
    to: string;
    url: string;
    from: string;
    user: User;
    constructor(user: User, url: string) {
        this.firstName = user.fullname;
        this.to = user.email;
        this.url = url;
        this.from = `Marc Gravely Inc. < ${process.env.EMAIL_FROM}>`;
        this.user = user;
    }

    newTransport() {
        let transporter: any = null;
        if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'stage') {
            transporter = nodemailer.createTransport({
                host: process.env.GMAIL_HOST,
                port: process.env.GMAIL_PORT,
                auth: {
                    user: process.env.GMAIL_USERMAME,
                    pass: process.env.GMAIL_PASSWORD,
                },
            });
            return transporter;
        }
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.MAILTRAP_USERNAME,
                pass: process.env.MAILTRAP_PASSWORD,
            },
        });
        if (transporter) transporter.verify().then(console.log('Verified')).catch(console.error);
        return transporter;
    }

    async send(template, subject, description = null, expiryDate = null, stormDetails: any = null) {
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject,
            description,
            expiry_date: expiryDate,
            stormDetails,
        });

        //2 Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: convert(html),
        };

        await this.newTransport().sendMail(mailOptions);
    }

    async sendHailNotification(subject?: string, hailDetails?: any) {
        await this.send('welcome', subject, null, null, hailDetails);
    }
}
