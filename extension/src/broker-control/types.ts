export interface ControlMessage {
  id: string;
  type: "get-status" | "restart" | "stop" | "update-ports" | "get-clients";
  data?: any;
}

export interface ControlResponse {
  id: string;
  data: any;
  error?: string;
}
