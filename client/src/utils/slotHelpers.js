// client/src/utils/slotHelpers.js

export function generateSlots(openTime, closeTime, slotMinutes = 60, selectedDate) {
    if (!openTime || !closeTime || !selectedDate) return [];
    const slots = [];
  
    const start = new Date(`${selectedDate}T${openTime}`);
    const end = new Date(`${selectedDate}T${closeTime}`);
  
    let current = new Date(start);
  
    while (current < end) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotMinutes);
  
      if (slotEnd > end) break;
  
      slots.push({ start: slotStart, end: slotEnd });
      current = slotEnd;
    }
    return slots;
  }
  
  export function isSlotBooked(slot, bookings) {
    return bookings.some((booking) => {
      const bStart = new Date(booking.start_time);
      const bEnd = new Date(booking.end_time);
      // Overlap logic: (StartA < EndB) AND (EndA > StartB)
      return slot.start < bEnd && slot.end > bStart;
    });
  }