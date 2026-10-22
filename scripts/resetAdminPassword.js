require("dotenv").config({
  path: require("node:path").join(__dirname, "..", ".env"),
});

const mongoose = require("mongoose");
const readline = require("node:readline");
const { createInterface } = require("node:readline/promises");
const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");
const User = require("../models/User");

function askHidden(question) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;

    if (!input.isTTY || typeof input.setRawMode !== "function") {
      reject(new Error("Run this script in Windows CMD or PowerShell."));
      return;
    }

    readline.emitKeypressEvents(input);
    let value = "";
    let finished = false;

    function cleanup() {
      if (finished) return;
      finished = true;
      input.removeListener("keypress", onKeypress);
      input.setRawMode(false);
      input.pause();
    }

    function onKeypress(character, key = {}) {
      if (key.ctrl && key.name === "c") {
        cleanup();
        process.stdout.write("\n");
        reject(new Error("Password reset cancelled."));
        return;
      }

      if (key.name === "return" || key.name === "enter") {
        cleanup();
        process.stdout.write("\n");
        resolve(value);
        return;
      }

      if (key.name === "backspace") {
        if (value.length > 0) {
          value = value.slice(0, -1);
          process.stdout.write("\b \b");
        }
        return;
      }

      if (character && !key.ctrl && !key.meta && character !== "\u0000") {
        value += character;
        process.stdout.write("*");
      }
    }

    process.stdout.write(question);
    input.setRawMode(true);
    input.resume();
    input.on("keypress", onKeypress);
  });
}

async function resetAdminPassword() {
  let prompt;

  try {
    await connectDB();

    const admins = await User.find({ role: "admin" })
      .select("name email isActive")
      .lean();

    if (admins.length === 0) {
      throw new Error("No admin account found in this database.");
    }

    console.log("\nExisting admin accounts:");
    admins.forEach((admin) => {
      console.log(
        `- ${admin.name} | ${admin.email} | Active: ${admin.isActive}`
      );
    });

    prompt = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const email = (
      await prompt.question("\nEnter the existing admin email: ")
    ).trim().toLowerCase();

    prompt.close();
    prompt = null;

    const admin = await User.findOne({
      email,
      role: "admin",
    }).select("+passwordHash");

    if (!admin) {
      throw new Error("Admin account not found for that email.");
    }

    if (!admin.isActive) {
      throw new Error("This admin account is inactive. Reset cancelled.");
    }

    const password = await askHidden(
      "Enter new password (minimum 12 characters): "
    );

    const confirmPassword = await askHidden(
      "Confirm new password: "
    );

    if (password.length < 12) {
      throw new Error("Password must contain at least 12 characters.");
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
      throw new Error("Password must not exceed 72 UTF-8 bytes.");
    }

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    admin.passwordHash = await bcrypt.hash(password, 12);
    await admin.save();

    console.log("\n✅ Admin password reset successfully!");
    console.log(`📧 Admin email: ${admin.email}`);
    console.log("🔐 Password saved securely as a bcrypt hash.");
  } catch (error) {
    console.error("\n❌ Password reset failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (prompt) prompt.close();

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

resetAdminPassword();