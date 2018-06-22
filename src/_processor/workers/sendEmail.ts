import { Emailer } from "../services/Emailer";

export default async function sendEmail(job: any) {
  const email = JSON.parse(job.body);

  await Emailer.getDefault().send(email);
}
