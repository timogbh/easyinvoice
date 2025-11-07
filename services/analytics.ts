export function logEvent(name: string, params?: Record<string, unknown>): void {
  console.log(`[Analytics] Event: ${name}`, params);
}

export const AnalyticsEvents = {
  ONBOARDING_COMPLETE: "onboarding_complete",
  CONSENT_ACCEPTED: "consent_accepted",
  CLIENT_ADD: "client_add",
  CLIENT_UPDATE: "client_update",
  CLIENT_DELETE: "client_delete",
  ITEM_ADD: "item_add",
  ITEM_UPDATE: "item_update",
  ITEM_DELETE: "item_delete",
  DOC_CREATE: "doc_create",
  DOC_UPDATE: "doc_update",
  DOC_EXPORT: "doc_export",
  DOC_DUPLICATE: "doc_duplicate",
  DOC_DELETE: "doc_delete",
  PAYWALL_VIEW: "paywall_view",
  PURCHASE_START: "purchase_start",
  PURCHASE_SUCCESS: "purchase_success",
  PURCHASE_CANCEL: "purchase_cancel",
  PURCHASE_RESTORE: "purchase_restore",
  DATA_EXPORT: "data_export",
  DATA_DELETE: "data_delete",
  AI_REQUEST_STARTED: "ai_request_started",
  AI_REQUEST_SUCCESS: "ai_request_success",
  AI_REQUEST_FAILED: "ai_request_failed",
  AI_DISABLED_WARNING: "ai_disabled_warning",
  AI_LIMIT_REACHED: "ai_limit_reached",
} as const;
