import type { Challenge } from '../../types/round';

const modelsPy = `from dataclasses import dataclass

@dataclass(frozen=True)
class TimeSlot:
    start_hour: int
    end_hour: int

    def __post_init__(self) -> None:
        if self.start_hour >= self.end_hour:
            raise ValueError(f"Invalid interval: start {self.start_hour} must precede end {self.end_hour}")

    def __str__(self) -> str:
        return f"{self.start_hour:02d}:00-{self.end_hour:02d}:00"

@dataclass(frozen=True)
class MeetingRoom:
    room_id: str
    name: str
    capacity: int

@dataclass
class Booking:
    booking_id: str
    room_id: str
    title: str
    slot: TimeSlot
`;

const overlapPy = `from .models import TimeSlot

def intervals_overlap(slot_a: TimeSlot, slot_b: TimeSlot) -> bool:
    """Checks whether two half-open time intervals conflict."""
    # BUG: uses <= and >= which treats adjacent boundary points as conflicts!
    # A meeting ending at 10:00 and one starting at 10:00 are flagged as overlapping.
    return slot_a.start_hour <= slot_b.end_hour and slot_a.end_hour >= slot_b.start_hour
`;

const fixedOverlapPy = `from .models import TimeSlot

def intervals_overlap(slot_a: TimeSlot, slot_b: TimeSlot) -> bool:
    """Checks whether two half-open time intervals conflict."""
    return slot_a.start_hour < slot_b.end_hour and slot_a.end_hour > slot_b.start_hour
`;

const calendarPy = `from typing import Optional
from .models import TimeSlot, MeetingRoom, Booking
from .overlap import intervals_overlap

class BookingConflictError(Exception):
    """Raised when a requested reservation overlaps with an existing booking."""
    pass

class CalendarService:
    """Manages conference room schedules and prevents overlapping reservations."""

    def __init__(self) -> None:
        self.rooms: dict[str, MeetingRoom] = {}
        self.bookings: list[Booking] = []
        self._seq = 0

    def register_room(self, room: MeetingRoom) -> None:
        self.rooms[room.room_id] = room

    def book_room(self, room_id: str, slot: TimeSlot, title: str) -> Booking:
        if room_id not in self.rooms:
            raise KeyError(f"Room '{room_id}' not found")

        # Check for conflicts against existing reservations in this room
        for existing in self.bookings:
            if existing.room_id == room_id:
                if intervals_overlap(existing.slot, slot):
                    raise BookingConflictError(
                        f"Conflict in room '{self.rooms[room_id].name}': overlaps with '{existing.title}' ({existing.slot})"
                    )

        self._seq += 1
        new_booking = Booking(
            booking_id=f"BK-{self._seq:03d}",
            room_id=room_id,
            title=title,
            slot=slot,
        )
        self.bookings.append(new_booking)
        return new_booking
`;

const searchPy = `from .models import TimeSlot, MeetingRoom
from .calendar_service import CalendarService
from .overlap import intervals_overlap

class RoomFinder:
    """Discovers available conference rooms for a requested time window."""

    def __init__(self, calendar: CalendarService) -> None:
        self.calendar = calendar

    def find_free_rooms(self, desired_slot: TimeSlot) -> list[MeetingRoom]:
        available: list[MeetingRoom] = []

        for room_id, room in self.calendar.rooms.items():
            has_conflict = False
            for booking in self.calendar.bookings:
                if booking.room_id == room_id:
                    if intervals_overlap(booking.slot, desired_slot):
                        has_conflict = True
                        break

            if not has_conflict:
                available.append(room)

        return available
`;

const mainPy = `from app.models import TimeSlot, MeetingRoom
from app.calendar_service import CalendarService, BookingConflictError
from app.search import RoomFinder

def run_calendar_demo() -> None:
    calendar = CalendarService()
    calendar.register_room(MeetingRoom("RM-A", "Ada Lovelace Boardroom", 12))

    finder = RoomFinder(calendar)

    print("Step 1: Reserve Ada Lovelace Boardroom for 09:00 - 10:00")
    b1 = calendar.book_room("RM-A", TimeSlot(9, 10), "Morning Standup")
    print(f"Confirmed: {b1.booking_id} | {b1.title} ({b1.slot})")

    print("\\nStep 2: Reserve back-to-back meeting for 10:00 - 11:00")
    try:
        b2 = calendar.book_room("RM-A", TimeSlot(10, 11), "Design Review")
        print(f"Confirmed: {b2.booking_id} | {b2.title} ({b2.slot})")
    except BookingConflictError as err:
        print(f"BOOKING REJECTED: {err}")

    print("\\nStep 3: Search for available rooms between 10:00 and 11:00")
    free_rooms = finder.find_free_rooms(TimeSlot(10, 11))
    room_names = [r.name for r in free_rooms]
    print(f"Available rooms ({len(free_rooms)}): {room_names}")

if __name__ == "__main__":
    run_calendar_demo()
`;

const testCalendarPy = `import unittest
from app.models import TimeSlot, MeetingRoom
from app.calendar_service import CalendarService, BookingConflictError

class TestCalendarBooking(unittest.TestCase):
    def test_back_to_back_meetings_allowed(self) -> None:
        calendar = CalendarService()
        calendar.register_room(MeetingRoom("r1", "Room 1", 6))

        # Booking 09:00 to 10:00
        calendar.book_room("r1", TimeSlot(9, 10), "Meeting 1")

        # Booking 10:00 to 11:00 (back-to-back, starts exactly when previous ends)
        b2 = calendar.book_room("r1", TimeSlot(10, 11), "Meeting 2")
        self.assertEqual(b2.title, "Meeting 2")

    def test_actual_overlap_rejected(self) -> None:
        calendar = CalendarService()
        calendar.register_room(MeetingRoom("r1", "Room 1", 6))

        calendar.book_room("r1", TimeSlot(9, 11), "Meeting 1")
        with self.assertRaises(BookingConflictError):
            calendar.book_room("r1", TimeSlot(10, 12), "Overlapping Meeting")

if __name__ == "__main__":
    unittest.main()
`;

export const meetingRoomBookingChallenge: Challenge = {
  id: 'meeting-room-booking',
  slug: 'meeting-room-booking',
  title: 'Meeting Scheduler That Rejects Back-to-Back Bookings',
  category: 'Debugging',
  difficulty: 'Medium',
  estimatedMinutes: 12,
  tags: ['Scheduling', 'Intervals', 'Search'],
  entryFile: 'app/main.py',
  summary: 'A calendar service reserves meeting rooms, validates time slots, and finds available room openings.',
  story:
    'Our office room management system allows employees to reserve conference rooms and search for available time slots. Team members reported that back-to-back bookings, like 10:00 to 11:00 followed by 11:00 to 12:00, are incorrectly rejected as conflicts. Because of this, the room finder reports that no rooms are available when a room has an adjacent reservation. The conflict detection logic is treating adjacent boundaries as overlapping intervals.',
  description:
    'Our office room management system allows employees to reserve conference rooms and search for available time slots. Team members reported that back-to-back bookings, like 10:00 to 11:00 followed by 11:00 to 12:00, are incorrectly rejected as conflicts. Because of this, the room finder reports that no rooms are available when a room has an adjacent reservation. The conflict detection logic is treating adjacent boundaries as overlapping intervals.',
  expectedInvariants: [
    'Must allow back-to-back meetings where one meeting starts exactly when another ends.',
    'Must reject any booking that overlaps with an existing reservation during the same interval.',
    'Must accurately report open intervals when searching for free meeting rooms.',
  ],
  expectedBehaviour: [
    'Must allow back-to-back meetings where one meeting starts exactly when another ends.',
    'Must reject any booking that overlaps with an existing reservation during the same interval.',
    'Must accurately report open intervals when searching for free meeting rooms.',
  ],
  bug: {
    file: 'app/overlap.py',
    line: 7,
  },
  fix: {
    file: 'app/overlap.py',
    line: 7,
    newText: '    return slot_a.start_hour < slot_b.end_hour and slot_a.end_hour > slot_b.start_hour',
  },
  decoy: {
    text: 'Check the RoomFinder loop in app/search.py line 15; the has_conflict flag might not be reset between rooms.',
    pointsTo: 'app/search.py',
  },
  assistantHints: [
    {
      id: 'calendar-hint-1',
      text: 'The search logic in app/search.py has an inner loop that might be leaking boolean state across rooms.',
      pointsTo: 'app/search.py',
      isDecoy: true,
      recommendedChoice: 'verify',
    },
    {
      id: 'calendar-hint-2',
      text: 'Examine the relational operators in app/overlap.py: check what happens when slot_a.end_hour equals slot_b.start_hour.',
      pointsTo: 'app/overlap.py',
      isDecoy: false,
      recommendedChoice: 'trust',
    },
    {
      id: 'calendar-hint-3',
      text: 'Check the TimeSlot dataclass post-init validation in app/models.py to ensure start hour ordering is enforced.',
      pointsTo: 'app/models.py',
      isDecoy: true,
      recommendedChoice: 'verify',
    },
  ],
  hints: [
    'Observe why the 10:00-11:00 meeting was rejected right after the 09:00-10:00 meeting was booked.',
    'Consider standard interval math: two intervals [A, B) and [B, C) share boundary point B but do not overlap.',
    'In app/overlap.py line 7, using <= and >= means slot_a.end_hour == slot_b.start_hour evaluates to True, erroneously reporting back-to-back meetings as conflicts.',
  ],
  explainRubric: [
    'Identifies that intervals_overlap uses inclusive comparisons (<= and >=) instead of strict inequalities (< and >).',
    'Explains that when one meeting ends at 10:00 and the next begins at 10:00, 10 >= 10 evaluates to True.',
    'States that changing the operators to strict inequalities allows contiguous back-to-back bookings without overlap.',
  ],
  files: [
    { path: 'app/models.py', language: 'python', content: modelsPy },
    { path: 'app/overlap.py', language: 'python', content: overlapPy },
    { path: 'app/calendar_service.py', language: 'python', content: calendarPy },
    { path: 'app/search.py', language: 'python', content: searchPy },
    { path: 'app/main.py', language: 'python', content: mainPy },
    { path: 'tests/test_calendar.py', language: 'python', content: testCalendarPy },
    { path: 'tests/test_cart.py', language: 'python', content: testCalendarPy },
  ],
  fixedFile: {
    path: 'app/overlap.py',
    content: fixedOverlapPy,
  },
  expectedOutput: {
    buggy: `Step 1: Reserve Ada Lovelace Boardroom for 09:00 - 10:00
Confirmed: BK-001 | Morning Standup (09:00-10:00)

Step 2: Reserve back-to-back meeting for 10:00 - 11:00
BOOKING REJECTED: Conflict in room 'Ada Lovelace Boardroom': overlaps with 'Morning Standup' (09:00-10:00)

Step 3: Search for available rooms between 10:00 and 11:00
Available rooms (0): []`,
    fixed: `Step 1: Reserve Ada Lovelace Boardroom for 09:00 - 10:00
Confirmed: BK-001 | Morning Standup (09:00-10:00)

Step 2: Reserve back-to-back meeting for 10:00 - 11:00
Confirmed: BK-002 | Design Review (10:00-11:00)

Step 3: Search for available rooms between 10:00 and 11:00
Available rooms (0): []`,
  },
  modelExplanation:
    'In app/overlap.py, the function intervals_overlap compares interval bounds using <= and >=. In time-slot scheduling, time intervals are half-open [start, end). When meeting 1 ends at 10:00 and meeting 2 starts at 10:00, the condition slot_a.end_hour >= slot_b.start_hour evaluates to 10 >= 10 (True). This incorrectly flags back-to-back meetings as conflicts, causing CalendarService to reject valid bookings.',
};
