import { Platform } from "react-native";

export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    console.log("[Notifications] Web does not require permission");
    return false;
  }

  console.log("[Notifications] Requesting permission (mock)");
  return true;
}

export async function scheduleReminder(hour: number): Promise<void> {
  if (Platform.OS === "web") {
    console.log("[Notifications] Web does not support notifications");
    return;
  }

  console.log(`[Notifications] Scheduling reminder for ${hour}:00 (mock)`);
}
