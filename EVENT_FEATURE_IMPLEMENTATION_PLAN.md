# Event Feature Implementation Plan

## Overview
This document outlines the implementation plan for adding a comprehensive event management system to the calendar page. Events will support one-time and recurring schedules, optional associations with customers/projects/tasks, meeting links, and notification integration.

## Current State Analysis

### ✅ Existing Infrastructure
1. **Calendar Page** (`src/pages/Calendar.tsx`)
   - Basic calendar grid implementation
   - Shows tasks with due dates
   - Translation for "addEvent" exists but button is not rendered
   - Month navigation working
   - RTL support implemented

2. **Database Schema** (`prisma/schema.prisma`)
   - No Event model exists
   - Notification model exists with `type`, `title`, `message`, `userId`, `relatedId`
   - Customer, Project, Task models exist with proper relations

3. **Backend Routes**
   - No `/api/events` route exists
   - Notification routes exist (`server/routes/notifications.ts`)
   - Pattern established for CRUD operations

4. **Frontend Components**
   - Modal component exists (`src/components/common/Modal.tsx`)
   - CreateTaskModal pattern can be followed
   - AppContext manages state but has no event actions

5. **API Utilities**
   - API utility pattern exists (`src/utils/api.ts`)
   - Standard CRUD operations pattern established

### ❌ Missing Components
1. Event database model
2. Event backend routes
3. Event frontend components (Create/Edit modals)
4. Event state management in AppContext
5. Event display in calendar
6. Event notification integration
7. Recurring event logic

---

## Implementation Plan

### Phase 1: Database Schema & Migration

#### 1.1 Create Event Model in Prisma Schema
**File:** `prisma/schema.prisma`

Add new Event model with:
- Basic fields: `id`, `title`, `description`, `startDate`, `endDate`, `allDay` (boolean)
- Recurrence fields: `recurrenceType` (none, daily, weekly, monthly, quarterly), `recurrenceEndDate` (optional), `recurrenceCount` (optional)
- Optional relations: `customerId`, `projectId`, `taskId` (all nullable)
- Meeting link: `meetingLink` (optional string)
- User relation: `userId` (required)
- Timestamps: `createdAt`, `updatedAt`

**Relations:**
- `user` → User (many-to-one)
- `customer` → Customer (optional, many-to-one)
- `project` → Project (optional, many-to-one)
- `task` → Task (optional, many-to-one)

#### 1.2 Create Migration
- Run `npx prisma migrate dev --name add_events_table`
- Verify migration file is created correctly

#### 1.3 Update Shared Types
**File:** `shared/types.ts`
- Add `Event` interface matching Prisma model
- Include all relations (customer, project, task, user)

---

### Phase 2: Backend Implementation

#### 2.1 Create Events Route
**File:** `server/routes/events.ts`

Implement CRUD endpoints:
- `GET /api/events` - Get all events (with filters: userId, startDate, endDate, customerId, projectId, taskId)
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

**Special Logic:**
- For recurring events, calculate all instances within date range
- Handle recurrence end date and count limits
- Validate optional relations exist before saving

#### 2.2 Register Route in Server
**File:** `server/index.ts`
- Import events router
- Add route: `app.use('/api/events', eventsRouter)`

#### 2.3 Create Recurrence Utility
**File:** `server/utils/recurrenceService.ts`

Functions:
- `generateRecurringInstances(event, startDate, endDate)` - Generate all event instances for a date range
- `calculateNextOccurrence(event, fromDate)` - Calculate next occurrence after a date
- `isEventOccurringOnDate(event, date)` - Check if event occurs on specific date

**Recurrence Types:**
- `none` - Single event
- `daily` - Every day until end date/count
- `weekly` - Same day of week until end date/count
- `monthly` - Same day of month until end date/count
- `quarterly` - Every 3 months until end date/count

---

### Phase 3: Frontend API Integration

#### 3.1 Add Event API Methods
**File:** `src/utils/api.ts`

Add `events` object with:
- `getAll(filters?)` - Get events with optional filters
- `getById(id)` - Get single event
- `create(data)` - Create event
- `update(id, data)` - Update event
- `delete(id)` - Delete event

#### 3.2 Update AppContext
**File:** `src/context/AppContext.tsx`

Add to AppState:
- `events: Event[]`

Add Actions:
- `SET_EVENTS` - Load all events
- `ADD_EVENT` - Add new event
- `UPDATE_EVENT` - Update existing event
- `DELETE_EVENT` - Delete event

Add Reducer Cases:
- Handle all event actions
- Normalize event dates (similar to tasks)

Add Data Fetching:
- Fetch events on app initialization
- Include events in data refresh logic

---

### Phase 4: Frontend Components

#### 4.1 Create Event Modal Component
**File:** `src/components/events/CreateEventModal.tsx`

**Features:**
- Form fields:
  - Title (required)
  - Description (optional, textarea)
  - Start Date & Time (required)
  - End Date & Time (optional, defaults to start + 1 hour)
  - All Day toggle (checkbox)
  - Recurrence Type (dropdown: None, Daily, Weekly, Monthly, Quarterly)
  - Recurrence End Date (optional, shown when recurrence selected)
  - Recurrence Count (optional, shown when recurrence selected)
  - Customer dropdown (optional)
  - Project dropdown (optional, filtered by selected customer)
  - Task dropdown (optional, filtered by selected project)
  - Meeting Link (optional, URL input with validation)

- Validation:
  - Title required
  - End date must be after start date
  - Meeting link must be valid URL if provided
  - Recurrence end date must be after start date if provided

- Translations:
  - English and Hebrew support
  - All form labels and placeholders

- Submit Handler:
  - Call API to create event
  - Dispatch ADD_EVENT action
  - Show success toast
  - Close modal

#### 4.2 Create Edit Event Modal Component
**File:** `src/components/events/EditEventModal.tsx`

**Features:**
- Similar to CreateEventModal but pre-populated with event data
- Handle editing recurring events:
  - Option to edit single occurrence or all occurrences
  - If editing single occurrence, create exception event
- Delete button (with confirmation)
- Update handler calls API and dispatches UPDATE_EVENT

#### 4.3 Create Event Detail Modal (Optional)
**File:** `src/components/events/EventDetailModal.tsx`

**Features:**
- Display event details
- Show links to related customer/project/task
- Edit and Delete buttons
- Meeting link as clickable button

---

### Phase 5: Calendar Integration

#### 5.1 Update Calendar Page
**File:** `src/pages/Calendar.tsx`

**Changes:**
1. **Add "New Event" Button**
   - Add button in header section (next to month navigation)
   - Use existing `addEvent` translation
   - Icon: CalendarPlus or Plus
   - Opens CreateEventModal

2. **Fetch Events**
   - Load events from AppContext state
   - Filter events for current month view

3. **Display Events in Calendar**
   - Modify `getTasksForDate` to also get events for date
   - Create `getEventsForDate(date)` function
   - Display events in calendar cells (different styling from tasks)
   - Show event title, time (if not all-day), and customer/project indicator
   - Limit display to 2-3 items per day (show "+X more" if needed)

4. **Event Click Handler**
   - Click on event opens EditEventModal or EventDetailModal
   - Pass event data to modal

5. **Visual Distinction**
   - Events styled differently from tasks (different color scheme)
   - All-day events shown with full-width bar
   - Timed events shown with time indicator

6. **Recurring Events Display**
   - Show all instances of recurring events in calendar
   - Use recurrence utility to calculate instances

#### 5.2 Update Calendar Translations
**File:** `src/pages/Calendar.tsx`

Add translations:
- Event-related labels
- Time formats
- Recurrence indicators

---

### Phase 6: Notification Integration

#### 6.1 Update Notification Service
**File:** `server/utils/notificationService.ts`

Add function:
- `createEventReminder(eventId, eventTitle, eventDate, userId, reminderMinutes)` - Create reminder notification for event

#### 6.2 Create Event Notification Types
**File:** `shared/types.ts` and `src/types/index.ts`

Update Notification type:
- Add `event_reminder` and `event_starting` to type union

#### 6.3 Event Notification Logic
**File:** `server/routes/events.ts`

On event creation/update:
- If event has start date/time, create notification scheduled for reminder time
- For recurring events, create notifications for each instance

#### 6.4 Notification Display
**File:** `src/pages/Notifications.tsx` (if exists)

- Display event notifications
- Link to event detail when clicked
- Show event title and time in notification

---

### Phase 7: Additional Features

#### 7.1 Event Filtering
**File:** `src/pages/Calendar.tsx`

Add filter options:
- Filter by customer
- Filter by project
- Filter by task
- Show/hide all-day events
- Show/hide recurring events

#### 7.2 Event Search
- Add search functionality to find events by title
- Highlight matching events in calendar

#### 7.3 Event Export (Future)
- Export events to iCal format
- Export to Google Calendar

---

## Technical Considerations

### Recurring Events Implementation
1. **Storage Strategy:**
   - Store base event with recurrence rules
   - Generate instances on-the-fly when querying
   - Store exceptions for edited/deleted instances

2. **Performance:**
   - Cache generated instances for current month
   - Only generate instances for visible date range
   - Use database queries efficiently

3. **Editing Recurring Events:**
   - Option 1: Edit single occurrence (create exception)
   - Option 2: Edit all future occurrences (update base event)
   - Option 3: Edit all occurrences (update base event)

### Date/Time Handling
- Use consistent timezone handling (UTC in database, local in UI)
- Handle all-day events separately (no time component)
- Support for events spanning multiple days

### Validation Rules
- Start date must be valid date
- End date must be after start date
- Recurrence end date must be after start date
- Recurrence count must be positive integer
- Meeting link must be valid URL format
- Related entities (customer/project/task) must exist

### Error Handling
- Handle API errors gracefully
- Show user-friendly error messages
- Validate data before submission
- Handle network failures

---

## File Structure

```
prisma/
  schema.prisma (updated)
  migrations/
    YYYYMMDDHHMMSS_add_events_table/
      migration.sql

server/
  routes/
    events.ts (new)
  utils/
    recurrenceService.ts (new)
    notificationService.ts (updated)
  index.ts (updated)

shared/
  types.ts (updated)

src/
  components/
    events/
      CreateEventModal.tsx (new)
      EditEventModal.tsx (new)
      EventDetailModal.tsx (new, optional)
  pages/
    Calendar.tsx (updated)
  context/
    AppContext.tsx (updated)
  utils/
    api.ts (updated)
  types/
    index.ts (updated)
```

---

## Testing Checklist

### Backend
- [ ] Event CRUD operations work correctly
- [ ] Recurring events generate correct instances
- [ ] Event filters work (customer, project, task, date range)
- [ ] Event validation works (dates, relations)
- [ ] Event notifications are created correctly
- [ ] Recurrence calculations are accurate

### Frontend
- [ ] Create event modal works
- [ ] Edit event modal works
- [ ] Delete event works
- [ ] Events display correctly in calendar
- [ ] Recurring events show all instances
- [ ] Event click opens detail/edit modal
- [ ] Event filters work
- [ ] Translations work (English/Hebrew)
- [ ] RTL layout works correctly
- [ ] Mobile responsive

### Integration
- [ ] Events sync with backend
- [ ] Notifications appear for events
- [ ] Event links to customer/project/task work
- [ ] Meeting links open correctly
- [ ] Calendar updates when events change

---

## Implementation Order

1. **Phase 1** - Database schema and migration
2. **Phase 2** - Backend routes and utilities
3. **Phase 3** - Frontend API integration and AppContext
4. **Phase 4** - Create and Edit modals
5. **Phase 5** - Calendar integration
6. **Phase 6** - Notification integration
7. **Phase 7** - Additional features and polish

---

## Notes

- The "New Event" button translation already exists but is not rendered - simply need to add the button
- Follow existing patterns from CreateTaskModal for consistency
- Ensure RTL support throughout (Hebrew locale)
- Consider performance for recurring events with many instances
- Meeting links should support Zoom, Google Meet, Teams, etc.
- Event colors should be distinct from task colors for visual clarity

