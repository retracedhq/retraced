import { Emailer } from "../services/Emailer";
import type { Email } from "../services/Emailer";

export default async function sendEmail(email: Email) {
  await Emailer.getDefault().send(email);
}
