import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { useApolloClient } from '@apollo/client';

import { useAuth } from '@/services/auth/auth.context';
import {
  ensureAndroidChannel,
  fetchExpoPushToken,
  getPermissionStatus,
  installForegroundHandler,
  notificationContentToInboxItem,
  requestPermission,
  scheduleLocalTestNotification,
  subscribeToForegroundNotifications,
  subscribeToNotificationTaps,
} from './notifications.service';
import { REGISTER_PUSH_TOKEN, UNREGISTER_PUSH_TOKEN } from './notifications.gql';
import {
  initialNotificationState,
  notificationReducer,
  unreadCount as computeUnread,
  type NotificationState,
} from './notification-store';
import { deriveScreenView } from './notification-screen-state';
import type { NotificationScreenView } from './notification-types';

interface NotificationsContextValue {
  state: NotificationState;
  screen: NotificationScreenView;
  unreadCount: number;
  requestPermissionAndRegister: () => Promise<void>;
  scheduleLocalTest: () => Promise<void>;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearInbox: () => void;
}

const Ctx = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialNotificationState);
  const apollo = useApolloClient();
  const { isAuthenticated, user } = useAuth();
  const lastRegisteredToken = useRef<string | null>(null);

  // Foreground handler + Android channel must be installed once.
  useEffect(() => {
    installForegroundHandler();
    void ensureAndroidChannel();
  }, []);

  // Boot: read current permission so the UI can render the right state before
  // the user explicitly opts in.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const status = await getPermissionStatus();
      if (!cancelled) dispatch({ type: 'PERMISSION_SET', status });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to foreground notifications so the inbox stays current while
  // the app is open. Tap responses are also pushed into the same inbox.
  useEffect(() => {
    const recv = subscribeToForegroundNotifications((n) => {
      dispatch({
        type: 'INBOX_PUSH',
        item: notificationContentToInboxItem(n.request.identifier, n.request.content, Date.now()),
      });
    });
    const tap = subscribeToNotificationTaps((r) => {
      dispatch({
        type: 'INBOX_PUSH',
        item: { ...notificationContentToInboxItem(r.notification.request.identifier, r.notification.request.content, Date.now()), read: true },
      });
    });
    return () => {
      recv.remove();
      tap.remove();
    };
  }, []);

  const registerToken = useCallback(
    async (token: string, platform: 'ios' | 'android' | 'web') => {
      if (!isAuthenticated) return;
      if (lastRegisteredToken.current === token) return;
      try {
        await apollo.mutate({
          mutation: REGISTER_PUSH_TOKEN,
          variables: { input: { token, platform } },
        });
        lastRegisteredToken.current = token;
      } catch {
        // Token will be retried on next login or on the next requestPermissionAndRegister.
      }
    },
    [apollo, isAuthenticated],
  );

  // Logout effect: drop the registered token from the server and reset state.
  // We capture the previous user id so we still know "we were logged in".
  const prevUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (user?.id) {
      prevUserIdRef.current = user.id;
      return;
    }
    if (!user && prevUserIdRef.current && lastRegisteredToken.current) {
      const token = lastRegisteredToken.current;
      void apollo
        .mutate({ mutation: UNREGISTER_PUSH_TOKEN, variables: { token } })
        .catch(() => undefined);
      lastRegisteredToken.current = null;
      prevUserIdRef.current = null;
      dispatch({ type: 'RESET' });
    }
  }, [apollo, user]);

  const requestPermissionAndRegister = useCallback(async () => {
    dispatch({ type: 'TOKEN_LOADING' });
    const current = await getPermissionStatus();
    const final = current === 'granted' ? 'granted' : await requestPermission();
    dispatch({ type: 'PERMISSION_SET', status: final });
    if (final !== 'granted') {
      dispatch({
        type: 'TOKEN_UNAVAILABLE',
        reason: 'Las notificaciones están desactivadas en tu sistema.',
      });
      return;
    }
    const outcome = await fetchExpoPushToken();
    if (outcome.kind === 'ready') {
      dispatch({ type: 'TOKEN_READY', token: outcome.token, platform: outcome.platform });
      await registerToken(outcome.token, outcome.platform);
      return;
    }
    if (outcome.kind === 'unavailable') {
      dispatch({ type: 'TOKEN_UNAVAILABLE', reason: outcome.reason });
      return;
    }
    dispatch({ type: 'TOKEN_ERROR', message: outcome.message });
  }, [registerToken]);

  // Auto-register once after login. We don't *force* a permission prompt
  // here — only ask if the user has already granted previously.
  useEffect(() => {
    if (!isAuthenticated) return;
    void (async () => {
      const status = await getPermissionStatus();
      dispatch({ type: 'PERMISSION_SET', status });
      if (status !== 'granted') return;
      dispatch({ type: 'TOKEN_LOADING' });
      const outcome = await fetchExpoPushToken();
      if (outcome.kind === 'ready') {
        dispatch({ type: 'TOKEN_READY', token: outcome.token, platform: outcome.platform });
        await registerToken(outcome.token, outcome.platform);
      } else if (outcome.kind === 'unavailable') {
        dispatch({ type: 'TOKEN_UNAVAILABLE', reason: outcome.reason });
      } else {
        dispatch({ type: 'TOKEN_ERROR', message: outcome.message });
      }
    })();
  }, [isAuthenticated, registerToken]);

  const value = useMemo<NotificationsContextValue>(() => {
    const screen = deriveScreenView({
      permission: state.permission,
      token: state.token,
      items: state.items,
    });
    return {
      state,
      screen,
      unreadCount: computeUnread(state),
      requestPermissionAndRegister,
      scheduleLocalTest: scheduleLocalTestNotification,
      markRead: (id: string) => dispatch({ type: 'INBOX_MARK_READ', id }),
      markAllRead: () => dispatch({ type: 'INBOX_MARK_ALL_READ' }),
      clearInbox: () => dispatch({ type: 'INBOX_CLEAR' }),
    };
  }, [state, requestPermissionAndRegister]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider');
  return ctx;
}
