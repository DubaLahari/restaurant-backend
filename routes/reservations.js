const express = require("express");
const router = express.Router();
const Reservation = require("../models/Reservation");

// ── GET all reservations ─────────────────────────────────────
// GET /api/reservations?username=john&date=2024-12-25&status=confirmed
router.get("/", async (req, res) => {
  try {
    const { username, date, status, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (username) filter.username = username;
    if (date) filter.date = date;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [reservations, total] = await Promise.all([
      Reservation.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Reservation.countDocuments(filter),
    ]);

    res.json({
      data: reservations,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("GET /reservations error:", err);
    res.status(500).json({ message: "Failed to fetch reservations" });
  }
});

// ── GET single reservation ───────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    res.json(reservation);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid reservation ID" });
    }
    res.status(500).json({ message: "Failed to fetch reservation" });
  }
});

// ── POST create reservation ──────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, phone, date, time, people, specialRequest, tableType, username } = req.body;

    // Check for duplicate booking (same phone + date + time)
    const existing = await Reservation.findOne({
      phone,
      date,
      time,
    });

    if (existing) {
      return res.status(409).json({
        message: "A reservation already exists for this phone number at the same date and time.",
      });
    }

    const reservation = new Reservation({
      username: username || "",
      name,
      phone,
      date,
      time,
      people: Number(people),
      tableType: tableType || "indoor",
      specialRequest: specialRequest || "",
    });

    const saved = await reservation.save();
    res.status(201).json({
      message: "Reservation created successfully",
      data: saved,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    console.error("POST /reservations error:", err);
    res.status(500).json({ message: "Failed to create reservation" });
  }
});

// ── PUT update reservation ───────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const { name, phone, date, time, people, specialRequest, tableType, status } = req.body;

    const updated = await Reservation.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(date && { date }),
        ...(time && { time }),
        ...(people && { people: Number(people) }),
        ...(specialRequest !== undefined && { specialRequest }),
        ...(tableType && { tableType }),
        ...(status && { status }),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    res.json({ message: "Reservation updated successfully", data: updated });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid reservation ID" });
    }
    res.status(500).json({ message: "Failed to update reservation" });
  }
});

// ── DELETE cancel reservation ────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Reservation.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    res.json({ message: "Reservation cancelled successfully" });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid reservation ID" });
    }
    res.status(500).json({ message: "Failed to cancel reservation" });
  }
});

// ── GET stats — must be before /:id ─────────────────────────
router.get("/stats/summary", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [total, todayCount, upcoming] = await Promise.all([
      Reservation.countDocuments(),
      Reservation.countDocuments({ date: today }),
      Reservation.countDocuments({ date: { $gte: today } }),
    ]);
    res.json({ total, today: todayCount, upcoming });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

module.exports = router;
