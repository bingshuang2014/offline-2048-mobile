"use client";

import { useEffect, useRef } from "react";
import { Platform, BackHandler } from "react-native";

/**
 * Hook to handle back button for dialogs/modals on both web and mobile.
 *
 * Web: Uses history.pushState to add a history entry and popstate listener
 * Mobile (React Native): Uses BackHandler API to intercept hardware back button
 *
 * When the dialog opens:
 * - Web: Adds a history entry
 * - Mobile: Registers a back button handler
 *
 * When back button is pressed, closes the dialog instead of navigating away.
 * When dialog is closed normally (via close button), cleans up handlers.
 */
export function useBackButton(open: boolean, onClose: () => void) {
  const closingViaBackButtonRef = useRef(false);
  const addedHistoryEntryRef = useRef(false);

  useEffect(() => {
    if (open) {
      if (Platform.OS === 'web') {
        // Web: Add a history entry when dialog opens
        if (!addedHistoryEntryRef.current) {
          if (typeof window !== "undefined" && window.history) {
            window.history.pushState({ dialogOpen: true }, "", "");
            addedHistoryEntryRef.current = true;
          }
          closingViaBackButtonRef.current = false;
        }

        // Web: Handle back button via popstate
        const handlePopState = () => {
          closingViaBackButtonRef.current = true;
          onClose();
        };

        if (typeof window !== "undefined") {
          window.addEventListener("popstate", handlePopState);
        }

        return () => {
          // Clean up web listener
          if (typeof window !== "undefined") {
            window.removeEventListener("popstate", handlePopState);
          }
        };
      } else {
        // Mobile (React Native): Handle hardware back button
        const backHandlerSubscription = BackHandler.addEventListener("hardwareBackPress", () => {
          closingViaBackButtonRef.current = true;
          onClose();
          return true; // Prevent default behavior
        });

        return () => {
          // Clean up React Native listener
          backHandlerSubscription.remove();
        };
      }
    } else {
      // Dialog closed - reset refs
      addedHistoryEntryRef.current = false;
      closingViaBackButtonRef.current = false;
    }
    return undefined;
  }, [open, onClose]);

  // If dialog was closed via close button (not back button), remove our history entry
  useEffect(() => {
    if (!open && addedHistoryEntryRef.current && !closingViaBackButtonRef.current) {
      // We added a history entry but dialog was closed normally - remove it
      // Only on web platform
      if (Platform.OS === 'web' && typeof window !== "undefined" && window.history?.state?.dialogOpen) {
        window.history.back();
      }
      addedHistoryEntryRef.current = false;
    }
  }, [open]);
}
