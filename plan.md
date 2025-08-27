# Individual Winner Redraw Implementation Plan

Based on analysis of the current React implementation and comparison with the HTML version, here's the comprehensive plan to implement individual winner redraw functionality with the "Berhenti" button in the WinnerList table:

## Overview
The goal is to update the lottery application so that when a user clicks "Undi Ulang" (redraw) for an individual winner in the WinnerList table, the drawing window correctly identifies and reanimates only that winner's slot, while showing a "Berhenti" (Stop) button in the WinnerList table for that specific winner.

## Step-by-Step Implementation Plan

### 1. Update the Lottery Context (src/context/LotteryContext.tsx)
- **Add redraw state management:**
  - Add `currentRedrawWinnerId: string | null` to track which winner is currently being redrawn
  - Add `setCurrentRedrawWinnerId` action to update this state
- **Modify the Winner type:**
  - Add `slotIndex: number` property to reliably track each winner's position in the drawing grid
- **Update context functions:**
  - Modify `addWinner` to include slotIndex when creating winners
  - Add `startRedraw(winnerId: string)` and `stopRedraw()` functions
  - Update `updateWinner` to preserve slotIndex when updating winner data

### 2. Update the Drawing Window (src/app/drawing-window/page.tsx)
- **Fix winner slot assignment:**
  - Update `stopDrawing()` function to assign slotIndex when calling `addWinner`
  - Ensure slotIndex matches the position in the drawing grid
- **Improve individual redraw logic:**
  - Simplify `handleIndividualRedraw()` to use `winner.slotIndex` directly instead of recalculating
  - Add better error handling when slotIndex is not found
  - Update context state to mark redraw as active: `setCurrentRedrawWinnerId(winnerId)`
- **Update stop redraw logic:**
  - In `handleStopRedraw()`, clear the redraw state: `setCurrentRedrawWinnerId(null)`
  - Ensure winner is updated with new number and slotIndex is preserved
- **Enhance communication:**
  - Listen for both "redrawWinner" and "stopRedraw" commands from localStorage
  - Send redraw status updates back to control panel

### 3. Update WinnerList Component (src/components/WinnerList.tsx)
- **Add redraw state display:**
  - Show "Mengundi ulang..." status for winner being redrawn
  - Replace "Undi Ulang" button with "Berhenti" button when `state.currentRedrawWinnerId === winner.id`
- **Update button handlers:**
  - `handleRedrawWinner()`: Set redraw state and send command to drawing window
  - Add `handleStopRedraw()`: Send stop command to drawing window and clear redraw state
- **Improve UI feedback:**
  - Add visual indicators (different background color, pulsing animation) for winner being redrawn
  - Show loading state during redraw process

### 4. Enhanced Error Handling and User Feedback
- **Drawing Window:**
  - Alert user if winner's slotIndex cannot be found
  - Log detailed debug information for troubleshooting
  - Handle cases where drawing window is not open
- **WinnerList:**
  - Show error messages if redraw fails
  - Provide clear feedback on redraw status
  - Handle edge cases (no drawing window, communication failures)

### 5. UI/UX Improvements
- **WinnerList Table:**
  - Highlight row of winner being redrawn with colored background
  - Show "Berhenti" button only for the winner currently being redrawn
  - Add pulsing animation or spinner for active redraw
- **Drawing Window:**
  - Keep existing slot highlighting during redraw
  - Maintain confetti effect after successful redraw
  - Preserve modern Tailwind CSS styling

### 6. Cross-Window Communication Enhancement
- **Bidirectional communication:**
  - Control Panel → Drawing Window: "redrawWinner", "stopRedraw"
  - Drawing Window → Control Panel: "redrawStarted", "redrawCompleted", "redrawError"
- **State synchronization:**
  - Ensure both windows stay in sync regarding redraw status
  - Handle cases where one window is closed/refreshed during redraw

### 7. Testing Scenarios
- **Happy path:** Click "Undi Ulang" → see "Berhenti" button → animation in drawing window → click "Berhenti" → new number assigned
- **Error cases:** No drawing window open, winner not found, communication failure
- **Edge cases:** Multiple rapid clicks, window refresh during redraw, closing drawing window during redraw

### 8. Documentation Updates
- Update comments explaining slotIndex property and its importance
- Document new localStorage communication keys and their purposes
- Add troubleshooting guide for common redraw issues

## Key Changes Summary
1. **Context:** Add redraw state management and slotIndex to Winner type
2. **Drawing Window:** Use slotIndex for reliable slot identification, improve error handling
3. **WinnerList:** Show "Berhenti" button in table when redraw is active, add visual feedback
4. **Communication:** Enhanced bidirectional messaging between windows
5. **UX:** Clear visual indicators and user feedback throughout the redraw process

This plan ensures the individual redraw functionality works exactly like the HTML version, with the "Berhenti" button appearing in the WinnerList table for better user control and experience.
