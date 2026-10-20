
const mongoose = require("mongoose");
const Reservation = require("../models/Reservation");
const Table = require("../models/Table");

const ACTIVE_STATUSES = ["Pending", "Confirmed", "Seated"];

function parseReservationTimes(startAt, endAt) {
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (
    !startAt ||
    !endAt ||
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return null;
  }

  if (start <= new Date() || end <= start) {
    return null;
  }

  // Avoid accidentally blocking a table for an excessively long period.
  const durationMinutes = (end.getTime() - start.getTime()) / 60000;

  if (durationMinutes > 360) {
    return null;
  }

  return { start, end };
}

async function findAvailableTables(start, end, guestCount) {
  const tables = await Table.find({
    isActive: true,
    status: { $ne: "Maintenance" },
    capacity: { $gte: guestCount },
  })
    .sort({ capacity: 1, tableNumber: 1 })
    .lean();

  if (!tables.length) return [];

  // Reservations overlap when existing.start < requested.end
  // and existing.end > requested.start.
  const conflicts = await Reservation.find({
    table: { $in: tables.map((table) => table._id) },
    status: { $in: ACTIVE_STATUSES },
    startAt: { $lt: end },
    endAt: { $gt: start },
  })
    .select("table")
    .lean();

  const occupiedTableIds = new Set(
    conflicts.map((reservation) => reservation.table.toString())
  );

  return tables.filter(
    (table) => !occupiedTableIds.has(table._id.toString())
  );
}

// GET /api/reservations/availability?startAt=...&endAt=...&guestCount=2
exports.getAvailableTables = async (req, res, next) => {
  try {
    const { startAt, endAt } = req.query;
    const guestCount = Number(req.query.guestCount);

    if (
      !Number.isInteger(guestCount) ||
      guestCount < 1 ||
      guestCount > 30
    ) {
      return res.status(400).json({
        success: false,
        message: "Guest count must be a whole number from 1 to 30.",
      });
    }

    const times = parseReservationTimes(startAt, endAt);

    if (!times) {
      return res.status(400).json({
        success: false,
        message:
          "Provide valid future start and end times, with a duration of at most 6 hours.",
      });
    }

    const tables = await findAvailableTables(
      times.start,
      times.end,
      guestCount
    );

    return res.status(200).json({
      success: true,
      count: tables.length,
      tables,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reservations
exports.getReservations = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    const validStatuses = [
      "Pending",
      "Confirmed",
      "Seated",
      "Completed",
      "Cancelled",
      "NoShow",
    ];

    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid reservation status filter.",
        });
      }

      filter.status = status;
    }

    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
      : 50;

    const reservations = await Reservation.find(filter)
      .populate("table", "tableNumber capacity section")
      .sort({ startAt: 1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      count: reservations.length,
      reservations,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/reservations
exports.createReservation = async (req, res, next) => {
  try {
    const {
      tableNumber,
      guestName,
      guestPhone,
      guestEmail = "",
      guestCount,
      startAt,
      endAt,
      occasion = "None",
      specialRequests = "",
      source = "Website",
    } = req.body;

    if (
      typeof guestName !== "string" ||
      guestName.trim().length < 2 ||
      guestName.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Guest name must be between 2 and 100 characters.",
      });
    }

    if (
      typeof guestPhone !== "string" ||
      guestPhone.trim().length < 7 ||
      guestPhone.trim().length > 20
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid guest phone number is required.",
      });
    }

    if (
      typeof guestEmail !== "string" ||
      guestEmail.length > 254 ||
      (guestEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail))
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (
      !Number.isInteger(guestCount) ||
      guestCount < 1 ||
      guestCount > 30
    ) {
      return res.status(400).json({
        success: false,
        message: "Guest count must be a whole number from 1 to 30.",
      });
    }

    if (typeof tableNumber !== "string" || !tableNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please select a restaurant table.",
      });
    }

    if (
      ![
        "None",
        "Birthday",
        "Anniversary",
        "Business Dinner",
        "Family Gathering",
        "Other",
      ].includes(occasion)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid reservation occasion.",
      });
    }

    if (
      typeof specialRequests !== "string" ||
      specialRequests.length > 500 ||
      !["Website", "Phone", "Walk-in"].includes(source)
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more reservation fields are invalid.",
      });
    }

    const times = parseReservationTimes(startAt, endAt);

    if (!times) {
      return res.status(400).json({
        success: false,
        message:
          "Provide valid future start and end times, with a duration of at most 6 hours.",
      });
    }

    const table = await Table.findOne({
      tableNumber: tableNumber.trim().toUpperCase(),
      isActive: true,
      status: { $ne: "Maintenance" },
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found or unavailable for service.",
      });
    }

    if (guestCount > table.capacity) {
      return res.status(400).json({
        success: false,
        message: `This table accommodates up to ${table.capacity} guests.`,
      });
    }

    const availableTables = await findAvailableTables(
      times.start,
      times.end,
      guestCount
    );

    const tableIsAvailable = availableTables.some(
      (item) => item._id.toString() === table._id.toString()
    );

    if (!tableIsAvailable) {
      return res.status(409).json({
        success: false,
        message: "This table is already reserved for the requested time.",
      });
    }

    const reservation = await Reservation.create({
      table: table._id,
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      guestEmail: guestEmail.trim().toLowerCase(),
      guestCount,
      startAt: times.start,
      endAt: times.end,
      occasion,
      specialRequests: specialRequests.trim(),
      source,
    });

    await reservation.populate("table", "tableNumber capacity section");

    return res.status(201).json({
      success: true,
      message: "Reservation created successfully.",
      reservation,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/reservations/:id/status
exports.updateReservationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reservation ID.",
      });
    }

    const transitions = {
      Pending: ["Confirmed", "Cancelled"],
      Confirmed: ["Seated", "Cancelled", "NoShow"],
      Seated: ["Completed"],
      Completed: [],
      Cancelled: [],
      NoShow: [],
    };

    if (!Object.hasOwn(transitions, status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reservation status.",
      });
    }

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found.",
      });
    }

    if (!transitions[reservation.status].includes(status)) {
      return res.status(409).json({
        success: false,
        message:
          `Reservation cannot move from ${reservation.status} to ${status}.`,
      });
    }

    reservation.status = status;
    await reservation.save();
    await reservation.populate("table", "tableNumber capacity section");

    return res.status(200).json({
      success: true,
      message: `Reservation updated to ${status}.`,
      reservation,
    });
  } catch (error) {
    next(error);
  }
};
