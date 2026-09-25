import { usePersistentState } from './usePersistentState';

export interface NotificationPreferences {
  enabled: boolean;
  tasks: boolean;
  meetings: boolean;
  followUps: boolean;
  goals: boolean;
  reminders: boolean;
  finance: boolean;
  sound: boolean;
  vibration: boolean;
  meetingReminderMinutes: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export const defaultNotificationPreferences: NotificationPreferences = {
  enabled: false,
  tasks: true,
  meetings: true,
  followUps: true,
  goals: true,
  reminders: true,
  finance: true,
  sound: true,
  vibration: true,
  meetingReminderMinutes: 30,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '06:00',
};

export function useNotificationPreferences() {
  return usePersistentState<NotificationPreferences>(
    'ens.notification-preferences.v1',
    defaultNotificationPreferences,
  );
}
