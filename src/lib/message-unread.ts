export const UNREAD_MESSAGE_TYPES = ["text", "proposal", "admin"] as const;

export const MESSAGE_UNREAD_UPDATED_EVENT = "message-unread-updated";

export const isUnreadMessageType = (messageType: string) =>
  UNREAD_MESSAGE_TYPES.includes(messageType as (typeof UNREAD_MESSAGE_TYPES)[number]);

export const dispatchMessageUnreadUpdated = () => {
  window.dispatchEvent(new Event(MESSAGE_UNREAD_UPDATED_EVENT));
};