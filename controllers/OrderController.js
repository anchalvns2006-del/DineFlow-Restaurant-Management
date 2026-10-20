
const mongoose = require("mongoose");
const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const Recipe = require("../models/Recipe");
const InventoryItem = require("../models/InventoryItem");
const InventoryMovement = require("../models/InventoryMovement");

const MAX_ORDER_ITEMS = 30;
const MAX_QUANTITY_PER_ITEM = 50;

exports.createOrder = async (req, res, next) => {
  try {
    const {
      customerName,
      customerPhone = "",
      orderType = "Dine-in",
      tableNumber = "",
      items,
      paymentMethod = "Cash",
      specialInstructions = "",
    } = req.body;

    // Validate customer details.
    if (
      typeof customerName !== "string" ||
      customerName.trim().length < 2 ||
      customerName.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer name must be between 2 and 100 characters.",
      });
    }

    if (
      !["Dine-in", "Takeaway", "Delivery"].includes(orderType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid order type.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "An order must contain at least one menu item.",
      });
    }

    if (items.length > MAX_ORDER_ITEMS) {
      return res.status(400).json({
        success: false,
        message: `An order can contain at most ${MAX_ORDER_ITEMS} different items.`,
      });
    }

    if (!["Cash", "Card", "UPI", "Online"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid payment method.",
      });
    }

    if (
      typeof customerPhone !== "string" ||
      customerPhone.length > 20 ||
      typeof tableNumber !== "string" ||
      tableNumber.length > 30 ||
      typeof specialInstructions !== "string" ||
      specialInstructions.length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more order fields are invalid.",
      });
    }

    // Validate IDs and quantities; never trust client-supplied prices.
    const quantities = new Map();

    for (const item of items) {
      if (
        !item ||
        typeof item.menuItem !== "string" ||
        !mongoose.isValidObjectId(item.menuItem)
      ) {
        return res.status(400).json({
          success: false,
          message: "Every item must contain a valid menuItem ID.",
        });
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > MAX_QUANTITY_PER_ITEM
      ) {
        return res.status(400).json({
          success: false,
          message: `Each quantity must be between 1 and ${MAX_QUANTITY_PER_ITEM}.`,
        });
      }

      const id = item.menuItem.toString();
      quantities.set(id, (quantities.get(id) || 0) + item.quantity);

      if (quantities.get(id) > MAX_QUANTITY_PER_ITEM) {
        return res.status(400).json({
          success: false,
          message: `Combined quantity for an item cannot exceed ${MAX_QUANTITY_PER_ITEM}.`,
        });
      }
    }

    // Fetch the authoritative price and image from MongoDB.
    const menuItems = await MenuItem.find({
      _id: { $in: [...quantities.keys()] },
      isAvailable: true,
    }).lean();

    const menuById = new Map(
      menuItems.map((item) => [item._id.toString(), item])
    );

    if (menuById.size !== quantities.size) {
      return res.status(400).json({
        success: false,
        message: "One or more menu items do not exist or are unavailable.",
      });
    }

    const orderItems = [...quantities.entries()].map(([id, quantity]) => {
      const menuItem = menuById.get(id);

      return {
        menuItem: menuItem._id,
        name: menuItem.name,
        imageUrl: menuItem.imageUrl,
        quantity,
        unitPrice: menuItem.price,
      };
    });

    const order = await Order.create({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      orderType,
      tableNumber: tableNumber.trim(),
      items: orderItems,
      paymentMethod,
      specialInstructions: specialInstructions.trim(),
      // Prices, tax and total are calculated server-side.
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      order,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    const validStatuses = [
      "Pending",
      "Confirmed",
      "Preparing",
      "Ready",
      "Served",
      "Cancelled",
    ];

    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status filter.",
        });
      }

      filter.status = status;
    }

    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
      : 50;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};


exports.updateOrderStatus = async (req, res, next) => {
  let session;

  function createHttpError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const transitions = {
      Pending: ["Confirmed", "Cancelled"],
      Confirmed: ["Preparing", "Cancelled"],
      Preparing: ["Ready"],
      Ready: ["Served"],
      Served: [],
      Cancelled: [],
    };

    if (
      typeof status !== "string" ||
      !Object.hasOwn(transitions, status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const order = await Order.findById(id).session(session);

      if (!order) {
        throw createHttpError(404, "Order not found.");
      }

      if (!transitions[order.status].includes(status)) {
        throw createHttpError(
          409,
          `Order cannot move from ${order.status} to ${status}.`
        );
      }

      // Deduct ingredient stock only when preparation starts.
      if (order.status === "Confirmed" && status === "Preparing") {
        if (order.inventoryDeductedAt) {
          throw createHttpError(
            409,
            "Inventory has already been deducted for this order."
          );
        }

        const menuIds = order.items.map((item) => item.menuItem);

        const recipes = await Recipe.find({
          menuItem: { $in: menuIds },
          isActive: true,
        })
          .session(session)
          .lean();

        const recipeByMenuId = new Map(
          recipes.map((recipe) => [
            recipe.menuItem.toString(),
            recipe,
          ])
        );

        // Combine ingredients shared by multiple ordered dishes.
        const requiredIngredients = new Map();

        for (const orderItem of order.items) {
          const recipe = recipeByMenuId.get(
            orderItem.menuItem.toString()
          );

          if (!recipe || !recipe.ingredients.length) {
            throw createHttpError(
              409,
              `No active recipe is configured for "${orderItem.name}".`
            );
          }

          for (const ingredient of recipe.ingredients) {
            const inventoryId =
              ingredient.inventoryItem.toString();

            const quantity =
              ingredient.quantityPerServing * orderItem.quantity;

            if (!Number.isFinite(quantity) || quantity <= 0) {
              throw createHttpError(
                409,
                `Invalid recipe quantity for "${orderItem.name}".`
              );
            }

            const existing =
              requiredIngredients.get(inventoryId) || 0;

            requiredIngredients.set(
              inventoryId,
              existing + quantity
            );
          }
        }

        const inventoryIds = [
          ...requiredIngredients.keys(),
        ];

        const inventoryRecords = await InventoryItem.find({
          _id: { $in: inventoryIds },
          isActive: true,
        })
          .session(session)
          .lean();

        const inventoryById = new Map(
          inventoryRecords.map((item) => [
            item._id.toString(),
            item,
          ])
        );

        // Validate all ingredients before consuming any stock.
        for (const [inventoryId, quantity] of requiredIngredients) {
          const item = inventoryById.get(inventoryId);

          if (!item) {
            throw createHttpError(
              409,
              "A recipe references an unavailable inventory ingredient."
            );
          }

          if (item.currentStock < quantity) {
            throw createHttpError(
              409,
              `Insufficient stock for "${item.name}". Required: ${quantity} ${item.unit}; available: ${item.currentStock} ${item.unit}.`
            );
          }
        }

        const movements = [];

        // Conditional updates prevent stock becoming negative.
        for (const [inventoryId, quantity] of requiredIngredients) {
          const inventoryItem =
            inventoryById.get(inventoryId);

          const updatedItem =
            await InventoryItem.findOneAndUpdate(
              {
                _id: inventoryId,
                isActive: true,
                currentStock: { $gte: quantity },
              },
              {
                $inc: { currentStock: -quantity },
              },
              {
                new: true,
                session,
                runValidators: true,
              }
            );

          if (!updatedItem) {
            throw createHttpError(
              409,
              `Stock for "${inventoryItem.name}" changed or is insufficient. Please refresh and try again.`
            );
          }

          movements.push({
            inventoryItem: updatedItem._id,
            order: order._id,
            movementType: "OUT",
            reason: "ORDER_CONSUMPTION",
            quantity,
            unit: updatedItem.unit,
            stockBefore: updatedItem.currentStock + quantity,
            stockAfter: updatedItem.currentStock,
            idempotencyKey:
              `${order._id}:${updatedItem._id}:ORDER_CONSUMPTION`,
            notes: `Ingredients consumed for order ${order.orderNumber}.`,
          });
        }

        // Ledger records and stock deductions commit together.
        if (movements.length) {
          await InventoryMovement.create(movements, {
            session,
            ordered: true,
          });
        }

        order.inventoryDeductedAt = new Date();
      }

      order.status = status;
      await order.save({ session });
    });

    const updatedOrder = await Order.findById(id).lean();

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}.`,
      order: updatedOrder,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};
