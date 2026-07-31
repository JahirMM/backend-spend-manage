export interface LogData {
  url_service: string;
  http_method: string;
  service_name: string;
  payload_request?: Record<string, unknown> | unknown[] | null; // json, nullable en BD
  payload_response: Record<string, unknown> | unknown[];        // json, NOT NULL en BD
  http_code: string;                                             // NOT NULL en BD
  error_message: string;                                         // NOT NULL en BD
}