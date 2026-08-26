import webpush from "web-push";

// VAPID 기본 키 (환경변수에 없을 때 사용)
const DEFAULT_PUBLIC_KEY =
  "BB2WQ5Dwel1ItbUe9kIdbr4gDYMqSq8jN1sXnZt3MGNS3XMim2ah9IGn7Y40phFzxNQZdS3vxz1h612VAOfRLWc";
const DEFAULT_PRIVATE_KEY =
  "xnqAG4L807OpmpA726Dp2DvTKOrSzY07NyGuPaA3Ha4";
const DEFAULT_SUBJECT = "mailto:alrami@example.com";

const publicKey =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY || DEFAULT_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || DEFAULT_SUBJECT;

if (publicKey && privateKey && subject) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export { webpush, publicKey };
