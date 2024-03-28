export default function healthcheck(req, res) {
  res.status(200).json({ success: true });
}
