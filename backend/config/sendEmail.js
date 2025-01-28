import { Resend } from 'resend';
import dotenv from 'dotenv'
dotenv.config()
if(process.env.Resend_API){
    console.log("provide RESEND_API in side the .env file")
}

const resend = new Resend(process.env.Resend_API);

const sendEmail = async ({sendTo,subject,html})=>{
    try {
          const { data, error } = await resend.emails.send({
        from: 'onlineshop <onboarding@resend.dev>',
        to: sendTo,
        subject: subject,
        html: html,
  });
  if (error) {
    return console.error({ error });
  } 
    return data 
    }catch{ (error)
        confirm.log(error)
    }
}

export default sendEmail