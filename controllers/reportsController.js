
const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const Reservation = require("../models/Reservation");
const InventoryItem = require("../models/InventoryItem");

exports.getReportsOverview = async (req, res, next) => {
  try {
    // Use the server's local calendar day for the daily report.
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const [
      totalMenuItems,
      ordersToday,
      activeOrders,
      servedToday,
      reservationsToday,
      lowStockItems,
      inventoryValuation,
      paidRevenueToday,
      paidRevenueThisMonth,
      popularItems,
    ] = await Promise.all([
      MenuItem.countDocuments({ isAvailable: true }),

      Order.countDocuments({
        createdAt: {
          $gte: startOfToday,
          $lt: startOfTomorrow,
        },
      }),

      Order.countDocuments({
        status: {
          $in: ["Pending", "Confirmed", "Preparing", "Ready"],
        },
      }),

      Order.countDocuments({
        status: "Served",
        updatedAt: {
          $gte: startOfToday,
          $lt: startOfTomorrow,
        },
      }),

      Reservation.countDocuments({
        startAt: {
          $gte: startOfToday,
          $lt: startOfTomorrow,
        },
        status: {
          $nin: ["Cancelled", "NoShow"],
        },
      }),

      InventoryItem.countDocuments({
        isActive: true,
        $expr: {
          $lte: ["$currentStock", "$reorderLevel"],
        },
      }),

      InventoryItem.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalValue: {
              $sum: {
                $multiply: ["$currentStock", "$costPerUnit"],
              },
            },
          },
        },
      ]),

      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfToday,
              $lt: startOfTomorrow,
            },
            paymentStatus: "Paid",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
      ]),

      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth },
            paymentStatus: "Paid",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
      ]),

      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth },
            status: { $ne: "Cancelled" },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            quantitySold: { $sum: "$items.quantity" },
            orderValue: {
              $sum: "$items.lineTotal",
            },
          },
        },
        { $sort: { quantitySold: -1, _id: 1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            name: "$_id",
            quantitySold: 1,
            orderValue: 1,
          },
        },
      ]),
    ]);

    const todayRevenue = paidRevenueToday[0] || {
      total: 0,
      orderCount: 0,
    };

    const monthRevenue = paidRevenueThisMonth[0] || {
      total: 0,
      orderCount: 0,
    };

    return res.status(200).json({
      success: true,
      generatedAt: new Date().toISOString(),

      overview: {
        totalMenuItems,
        ordersToday,
        activeOrders,
        servedToday,
        reservationsToday,
        lowStockItems,

        inventoryValue: Number(
          (inventoryValuation[0]?.totalValue || 0).toFixed(2)
        ),

        paidRevenueToday: Number(
          todayRevenue.total.toFixed(2)
        ),
        paidOrdersToday: todayRevenue.orderCount,

        paidRevenueThisMonth: Number(
          monthRevenue.total.toFixed(2)
        ),
        paidOrdersThisMonth: monthRevenue.orderCount,
      },

      popularItems,
    });
  } catch (error) {
    next(error);
  }
};
