import { getToken } from './userApi';

const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000';

async function requestJson(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_GATEWAY_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    const error = new Error(data.message || `Lỗi kết nối máy chủ (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return data;
}

/**
 * Chuẩn hóa đối tượng trip từ trip-service sang format Frontend
 */
export function normalizeTrip(t) {
  if (!t) return null;
  return {
    id: t.id,
    busName: t.bus_name,
    plateNumber: t.plate_number,
    busType: t.bus_type,
    busTypeName: t.bus_type_name,
    originCity: t.origin_city,
    originStation: t.origin_station,
    destinationCity: t.destination_city,
    destStation: t.dest_station,
    departureTime: t.departure_time,
    arrivalTime: t.arrival_time,
    departureFull: t.departure_full,
    duration: t.duration,
    price: Number(t.price || 0),
    totalSeats: Number(t.total_seats || 20),
    availableSeats: Number(t.available_seats ?? 0),
    bookedSeats: Array.isArray(t.booked_seats) ? t.booked_seats : [],
    rating: Number(t.rating || 5),
    reviewsCount: Number(t.reviews_count || 0),
    amenities: Array.isArray(t.amenities) ? t.amenities : [],
    status: t.status
  };
}

// === TRIP SERVICE ===
export async function getStationsApi() {
  const data = await requestJson('/api/stations');
  return data.data || [];
}

export async function searchTripsApi({ origin, destination, departDate, busType, timeSlot, sortBy } = {}) {
  const params = new URLSearchParams();
  if (origin) params.set('origin', origin);
  if (destination) params.set('destination', destination);
  if (departDate) params.set('date', departDate);
  if (busType && busType !== 'ALL') params.set('busType', busType);
  if (timeSlot && timeSlot !== 'ALL') params.set('timeSlot', timeSlot);
  if (sortBy && sortBy !== 'DEFAULT') params.set('sortBy', sortBy);

  const query = params.toString();
  const data = await requestJson(`/api/trips${query ? `?${query}` : ''}`);
  return (data.data || []).map(normalizeTrip);
}

export async function getTripSeatsApi(tripId) {
  const data = await requestJson(`/api/trips/${tripId}/seats`);
  return data.data;
}

export async function getTripReviewsApi(tripId) {
  const data = await requestJson(`/api/trips/${tripId}/reviews`);
  return data.data;
}

export async function addTripReviewApi(tripId, { rating, comment }) {
  return requestJson(`/api/trips/${tripId}/reviews`, {
    method: 'POST',
    body: { rating, comment },
    auth: true
  });
}

export async function getTripTrackingApi(tripId) {
  const data = await requestJson(`/api/trips/${tripId}/tracking`);
  return data.data;
}

// === BOOKING SERVICE ===
export async function holdSeatsApi({ trip_id, seat_codes, session_id }) {
  return requestJson('/api/bookings/hold-seats', {
    method: 'POST',
    body: { trip_id, seat_codes, session_id }
  });
}

export async function releaseSeatsApi({ trip_id, seat_codes, session_id }) {
  return requestJson('/api/bookings/release-seats', {
    method: 'POST',
    body: { trip_id, seat_codes, session_id }
  });
}

export async function createBookingApi(payload) {
  return requestJson('/api/bookings', {
    method: 'POST',
    body: payload,
    auth: true
  });
}

export async function getMyBookingsApi() {
  const data = await requestJson('/api/bookings/my-bookings', {
    method: 'GET',
    auth: true
  });
  return data.data || [];
}

export async function cancelBookingApi(bookingId) {
  return requestJson(`/api/bookings/${bookingId}/cancel`, {
    method: 'PATCH',
    auth: true
  });
}

export async function checkInTicketApi(qr_code) {
  return requestJson('/api/tickets/check-in', {
    method: 'PATCH',
    body: { qr_code },
    auth: true
  });
}

// === VOUCHER SERVICE ===
export async function validateVoucherApi({ code, order_amount, route_name }) {
  return requestJson('/api/vouchers/validate', {
    method: 'POST',
    body: { code, order_amount, route_name }
  });
}

export async function applyVoucherApi({ code, booking_code, order_amount, route_name }) {
  return requestJson('/api/vouchers/apply', {
    method: 'POST',
    body: { code, booking_code, order_amount, route_name },
    auth: true
  });
}

// === PAYMENT SERVICE ===
export async function getPaymentBankInfoApi({ booking_code, amount }) {
  const params = new URLSearchParams({ booking_code, amount: String(amount) });
  return requestJson(`/api/payments/bank-info?${params.toString()}`);
}

export async function initiatePaymentApi({ booking_id, booking_code, amount, payment_method }) {
  return requestJson('/api/payments/initiate', {
    method: 'POST',
    body: { booking_id, booking_code, amount, payment_method }
  });
}

export async function webhookPaymentApi({ payment_id, transaction_id, gateway_status = 'SUCCESS', bank_code = 'MBBANK', amount_paid }) {
  return requestJson('/api/payments/webhook', {
    method: 'POST',
    body: { payment_id, transaction_id, gateway_status, bank_code, amount_paid }
  });
}

// === NOTIFICATION SERVICE ===
export async function sendBookingEmailApi(payload) {
  return requestJson('/api/notifications/booking-confirmation', {
    method: 'POST',
    body: payload
  });
}

export async function sendRefundEmailApi(payload) {
  return requestJson('/api/notifications/refund-notice', {
    method: 'POST',
    body: payload
  });
}

// === DISPATCH SERVICE ===
export async function getTripJourneyLogsApi(tripId) {
  const data = await requestJson(`/api/dispatch/trips/${tripId}/logs`);
  return data.data;
}

export async function getDriverScheduleApi() {
  const data = await requestJson('/api/dispatch/my-schedule', {
    method: 'GET',
    auth: true
  });
  return data.data || [];
}
