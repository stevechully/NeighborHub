// src/utils/bookingHelpers.js

/**
 * Generates an array of time slots based on facility hours
 */
export function generateSlots(openTime, closeTime, slotMinutes, selectedDate) {
    const slots = [];
    // Ensure we are working with the correct date string format
    const start = new Date(`${selectedDate}T${openTime}`);
    const end = new Date(`${selectedDate}T${closeTime}`);
  
    let current = new Date(start);
  
    while (current < end) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotMinutes);
  
      if (slotEnd > end) break;
  
      slots.push({
        start: slotStart,
        end: slotEnd
      });
  
      current = slotEnd;
    }
    return slots;
  }
  
  /**
   * Checks if a specific slot overlaps with any existing bookings
   */
  export function isSlotBooked(slot, bookings) {
    return bookings.some((booking) => {
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);
  
      return (
        slot.start < bookingEnd &&
        slot.end > bookingStart
      );
    });
  }