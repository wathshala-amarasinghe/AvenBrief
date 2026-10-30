import { connection } from "next/server";

export default async function CurrentDate() {
  await connection();
  return new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Colombo" }).format(new Date());
}
