import nodemailer from "nodemailer"

// This is a placeholder for sending emails. Replace with your email service logic.
export async function sendEmail({ to, subject, text }: { to: string, subject: string, text: string }) {
  // const transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: Number(process.env.SMTP_PORT) || 587,
  //   secure: false,
  //   auth: {
  //     user: process.env.SMTP_USER,
  //     pass: process.env.SMTP_PASS,
  //   },
  // })

  // await transporter.sendMail({
  //   from: process.env.EMAIL_FROM,
  //   to,
  //   subject,
  //   text,
  // })
  console.log(`Email sent to ${to} with subject "${subject}" and text "${text}"`)
}
