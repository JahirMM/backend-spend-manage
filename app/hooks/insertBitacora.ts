import { insertRow } from "@/lib/supabase";
import { LogData } from "../interfaces/LogData.interface";

export const insertLog = async (data: LogData): Promise<void> => {
  try {
    await insertRow("logs", data);
  } catch (error) {
    console.error("Error insertando log:", error);
  }
};
