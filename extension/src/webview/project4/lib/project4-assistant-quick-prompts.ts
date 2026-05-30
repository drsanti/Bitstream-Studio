/**
 * Preset prompts for Digital Twin Copilot (Project 4 Assistant).
 * When **AI Interaction** is on, wording nudges the model toward **`project4_*`** tools
 * (telemetry GET, move dirs **W S A D WA WD SA SD STOP**, **`project4_set_speed`** **val** 0–255).
 */

export type Project4AssistantQuickPromptLocale = "en" | "th";

/** Persisted preference for quick-prompt language (`localStorage`). */
export const PROJECT4_QUICK_PROMPT_LOCALE_STORAGE_KEY = "ternion.project4.quickPromptLocale";

export type Project4AssistantQuickPromptCategory =
  | "telemetry"
  | "motion"
  | "speed"
  | "workflow";

export type Project4AssistantQuickPromptCopy = {
  label: string;
  prompt: string;
};

export type Project4AssistantQuickPromptItem = {
  id: string;
  category: Project4AssistantQuickPromptCategory;
  en: Project4AssistantQuickPromptCopy;
  th: Project4AssistantQuickPromptCopy;
};

/** Default composer text on first open (English). */
export const DEFAULT_PROJECT4_ASSISTANT_PROMPT =
  "Pull live telemetry and summarize the whole robot state: every wheel speed, scanner bearings (`a` / ultrasonic angles), front and rear distances (`df`, `db`), IMU if present, whether data looks fresh, and anything unsafe.";

/** Thai default matching **Full telemetry summary** preset. */
export const DEFAULT_PROJECT4_ASSISTANT_PROMPT_TH =
  "ดึงเทเลเมทรีสดแล้วสรุปสถานะหุ่นยนต์ทั้งหมด: ความเร็วล้อทุกล้อ มุมสแกนเนอร์ (`a` / มุมอัลตราโซนิก) ระยะหน้าและหลัง (`df`, `db`) ถ้ามี IMU ว่าข้อมูลดูสดหรือไม่ และสิ่งที่ไม่ปลอดภัย";

export const PROJECT4_ASSISTANT_QUICK_PROMPTS: readonly Project4AssistantQuickPromptItem[] = [
  {
    id: "telemetry-full",
    category: "telemetry",
    en: { label: "Full telemetry summary", prompt: DEFAULT_PROJECT4_ASSISTANT_PROMPT },
    th: { label: "สรุปเทเลเมทรีแบบเต็ม", prompt: DEFAULT_PROJECT4_ASSISTANT_PROMPT_TH },
  },
  {
    id: "telemetry-compact",
    category: "telemetry",
    en: {
      label: "Quick snapshot (wheels + distances)",
      prompt:
        "Use telemetry tools if available. Report wheel speeds (vFL–vRR), front/rear distances df and db (cm), and scanner bearings (a / aFront / aRear). Say if anything looks missing or stale.",
    },
    th: {
      label: "สแนปช็อตด่วน (ล้อ + ระยะ)",
      prompt:
        "ใช้เครื่องมือเทเลเมทรีถ้ามี รายงานความเร็วล้อ (vFL–vRR) ระยะหน้า/หลัง df และ db (ซม.) และมุมสแกนเนอร์ (a / aFront / aRear) บอกถ้าข้อมูลขาดหรือดูไม่สด",
    },
  },
  {
    id: "telemetry-imu",
    category: "telemetry",
    en: {
      label: "IMU and orientation hints",
      prompt:
        "Pull telemetry and focus on IMU accelerometer axes (ax, ay, az) and any pose hints in the JSON. Note anomalies or zeros that suggest missing calibration.",
    },
    th: {
      label: "โฟกัส IMU และทิศทาง",
      prompt:
        "ดึงเทเลเมทรีแล้วโฟกัสแกนความเร่ง IMU (ax, ay, az) และคำใบ้ท่าทางใน JSON ระบุค่าผิดปกติหรือศูนย์ที่อาจหมายถึงยังไม่ได้คาริเบรต",
    },
  },
  {
    id: "motion-stop",
    category: "motion",
    en: {
      label: "Stop motors (STOP)",
      prompt:
        "Use the move tool with dir STOP to halt the robot. Then read telemetry again and confirm wheel speeds are zero or near-zero.",
    },
    th: {
      label: "หยุดมอเตอร์ (STOP)",
      prompt:
        "ใช้เครื่องมือ move กับ dir STOP เพื่อหยุดหุ่นยนต์ แล้วอ่านเทเลเมทรีอีกครั้งเพื่อยืนยันว่าความเร็วล้อเป็นศูนย์หรือใกล้ศูนย์",
    },
  },
  {
    id: "motion-forward-back",
    category: "motion",
    en: {
      label: "Forward then stop",
      prompt:
        "First read telemetry for obstacles. If df looks safe, command a short forward motion with dir W, wait briefly, then STOP and read telemetry again to verify.",
    },
    th: {
      label: "ไปข้างหน้าแล้วหยุด",
      prompt:
        "อ่านเทเลเมทรีก่อนเรื่องสิ่งกีดขวาง ถ้า df ดูปลอดภัย สั่งเคลื่อนหน้าสั้นๆ ด้วย dir W รอสักครู่ แล้ว STOP และอ่านเทเลเมทรียืนยันอีกครั้ง",
    },
  },
  {
    id: "motion-retreat",
    category: "motion",
    en: {
      label: "Back away slowly",
      prompt:
        "Read telemetry. If safe, command backward motion with dir S briefly, then STOP and summarize distances df/db afterward.",
    },
    th: {
      label: "ถอยช้าๆ",
      prompt:
        "อ่านเทเลเมทรี ถ้าปลอดภัย สั่งถอยด้วย dir S ชั่วคราว แล้ว STOP และสรุประยะ df/db หลังทำ",
    },
  },
  {
    id: "motion-turn-left",
    category: "motion",
    en: {
      label: "Turn left (A)",
      prompt:
        "Read telemetry first. Command turn-in-place using dir A briefly, then STOP and report headings/distances from fresh telemetry.",
    },
    th: {
      label: "หมุนซ้าย (A)",
      prompt:
        "อ่านเทเลเมทรีก่อน สั่งหมุนที่กับ dir A ชั่วคราว แล้ว STOP และรายงานระยะ/ข้อมูลที่เกี่ยวข้องจากเทเลเมทรีล่าสุด",
    },
  },
  {
    id: "motion-turn-right",
    category: "motion",
    en: {
      label: "Turn right (D)",
      prompt:
        "Read telemetry first. Command turn-in-place using dir D briefly, then STOP and report headings/distances from fresh telemetry.",
    },
    th: {
      label: "หมุนขวา (D)",
      prompt:
        "อ่านเทเลเมทรีก่อน สั่งหมุนที่กับ dir D ชั่วคราว แล้ว STOP และรายงานระยะ/ข้อมูลที่เกี่ยวข้องจากเทเลเมทรีล่าสุด",
    },
  },
  {
    id: "motion-diagonal",
    category: "motion",
    en: {
      label: "Diagonal arc (example WD)",
      prompt:
        "Explain when WA/WD/SA/SD arcs might be used vs pure W/A/S/D. If tools are enabled and conditions look safe, demonstrate one short WD burst then STOP.",
    },
    th: {
      label: "เส้นทแยง (ตัวอย่าง WD)",
      prompt:
        "อธิบายว่าเมื่อไหร่ควรใช้ WA/WD/SA/SD เทียบกับ W/A/S/D ล้วนๆ ถ้าเปิดเครื่องมือและสภาพปลอดภัย ให้สาธิต WD สั้นๆ แล้ว STOP",
    },
  },
  {
    id: "speed-low",
    category: "speed",
    en: {
      label: "Lower speed preset (~90)",
      prompt:
        "Set speed preset val to 90 using the speed tool, then read telemetry and describe effect if visible from wheel speeds.",
    },
    th: {
      label: "ลดพรีเซ็ตความเร็ว (~90)",
      prompt:
        "ตั้งค่า speed preset val เป็น 90 ด้วยเครื่องมือ set_speed แล้วอ่านเทเลเมทรี อธิบายผลถ้าเห็นจากความเร็วล้อ",
    },
  },
  {
    id: "speed-medium",
    category: "speed",
    en: {
      label: "Medium speed preset (~160)",
      prompt:
        "Set speed preset val to 160 using the speed tool, then remind me this maps to firmware 0–255 scaling.",
    },
    th: {
      label: "พรีเซ็ตปานกลาง (~160)",
      prompt:
        "ตั้งค่า speed preset val เป็น 160 ด้วยเครื่องมือ set_speed แล้วเตือนว่าช่วง 0–255 ตามสเกลเฟิร์มแวร์",
    },
  },
  {
    id: "speed-conservative",
    category: "speed",
    en: {
      label: "Very cautious preset (~60)",
      prompt:
        "Set speed preset val to 60 for cautious driving. Pull telemetry before and after and mention wheel speeds.",
    },
    th: {
      label: "ระมัดระวังสูง (~60)",
      prompt:
        "ตั้งค่า speed preset val เป็น 60 เพื่อขับอย่างระมัดระวัง ดึงเทเลเมทรีก่อนและหลัง พูดถึงความเร็วล้อ",
    },
  },
  {
    id: "workflow-obstacle-guard",
    category: "workflow",
    en: {
      label: "Check obstacles before any move",
      prompt:
        "Never command motion until you have read telemetry. If df or db is under 25 cm or readings look invalid, refuse forward/back moves and recommend STOP instead.",
    },
    th: {
      label: "เช็คสิ่งกีดขวางก่อนขยับ",
      prompt:
        "ห้ามสั่งเคลื่อนที่จนกว่าจะอ่านเทเลเมทรีแล้ว ถ้า df หรือ db ต่ำกว่า 25 ซม. หรือค่าดูผิดปกติ ให้ปฏิเสธการขยับหน้า/ถอยและแนะนำ STOP แทน",
    },
  },
  {
    id: "workflow-stop-if-close",
    category: "workflow",
    en: {
      label: "Monitor distance — stop if too close",
      prompt:
        "Poll telemetry. If front distance df drops below 20 cm while suggesting motion, choose STOP and explain why.",
    },
    th: {
      label: "เฝ้าระยะ — หยุดถ้าใกล้เกินไป",
      prompt:
        "โพลเทเลเมทรี ถ้าระยะหน้า df ต่ำกว่า 20 ซม. ในขณะที่พิจารณาจะขยับ ให้เลือก STOP และอธิบายเหตุผล",
    },
  },
  {
    id: "workflow-full-patrol-readonly",
    category: "workflow",
    en: {
      label: "Patrol read-only (no motion)",
      prompt:
        "Only read telemetry repeatedly (conceptually); do not call move or set_speed. Describe scanner bearings and distances as if surveying the scene.",
    },
    th: {
      label: "ลาดตระเวนดูอย่างเดียว (ไม่ขยับ)",
      prompt:
        "อ่านเทเลเมทรีซ้ำๆ เท่านั้น (แนวคิด) ห้ามเรียก move หรือ set_speed อธิบายมุมสแกนและระยะเหมือนกำลังสำรวจสภาพ",
    },
  },
] as const;

const CATEGORY_LABEL_EN: Record<Project4AssistantQuickPromptCategory, string> = {
  telemetry: "Telemetry",
  motion: "Motion",
  speed: "Speed preset",
  workflow: "Safe workflows",
};

const CATEGORY_LABEL_TH: Record<Project4AssistantQuickPromptCategory, string> = {
  telemetry: "เทเลเมทรี",
  motion: "การเคลื่อนที่",
  speed: "พรีเซ็ตความเร็ว",
  workflow: "เวิร์กโฟลว์ปลอดภัย",
};

export const PROJECT4_ASSISTANT_QUICK_PROMPT_CATEGORY_ORDER: readonly Project4AssistantQuickPromptCategory[] =
  ["telemetry", "motion", "speed", "workflow"];

export function project4AssistantQuickPromptCategoryLabel(
  category: Project4AssistantQuickPromptCategory,
  locale: Project4AssistantQuickPromptLocale,
): string {
  return locale === "th" ? CATEGORY_LABEL_TH[category] : CATEGORY_LABEL_EN[category];
}

export function project4AssistantQuickPromptCopy(
  item: Project4AssistantQuickPromptItem,
  locale: Project4AssistantQuickPromptLocale,
): Project4AssistantQuickPromptCopy {
  return locale === "th" ? item.th : item.en;
}

export function readProject4QuickPromptLocale(): Project4AssistantQuickPromptLocale {
  if (typeof window === "undefined") {
    return "en";
  }
  try {
    const raw = window.localStorage.getItem(PROJECT4_QUICK_PROMPT_LOCALE_STORAGE_KEY);
    return raw === "th" ? "th" : "en";
  } catch {
    return "en";
  }
}

export function persistProject4QuickPromptLocale(locale: Project4AssistantQuickPromptLocale): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(PROJECT4_QUICK_PROMPT_LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}
