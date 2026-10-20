
require("dotenv").config();

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
      reject(
        new Error("Run this setup script from an interactive CMD or PowerShell terminal.")
      );
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
        reject(new Error("Setup cancelled."));
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

      if (
        character &&
        !key.ctrl &&
        !key.meta &&
        character !== "\u0000"
      ) {
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

async function createFirstAdmin() {
  let prompt;

  try {
    await connectDB();

    const existingAdmin = await User.exists({ role: "admin" });

    if (existingAdmin) {
      throw new Error(
        "An admin account already exists. First-admin setup can only run once."
      );
    }

    prompt = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const name = (
      await prompt.question("Admin full name: ")
    ).trim();

    const email = (
      await prompt.question("Admin email: ")
    ).trim().toLowerCase();

    prompt.close();
    prompt = null;

    if (name.length < 2 || name.length > 100) {
      throw new Error("Name must be between 2 and 100 characters.");
    }

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      throw new Error("Please provide a valid email address.");
    }

    if (await User.exists({ email })) {
      throw new Error(
        "An account with this email already exists. Use a different email."
      );
    }

    const password = await askHidden(
      "Admin password (min 12 characters; input hidden): "
    );

    const confirmPassword = await askHidden(
      "Confirm admin password (input hidden): "
    );

    if (password.length < 12) {
      throw new Error("Admin password must contain at least 12 characters.");
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
      throw new Error(
        "Password must not exceed 72 UTF-8 bytes for this bcrypt setup."
      );
    }

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name,
      email,
      passwordHash,
      role: "admin",
      isActive: true,
    });

    console.log("\n✅ First Admin account created successfully!");
    console.log(`👤 Name: ${admin.name}`);
    console.log(`📧 Email: ${admin.email}`);
    console.log("🔐 Password stored as a bcrypt hash.");
    console.log("⚠️ Save your password securely; it will not be displayed.");
  } catch (error) {
    console.error("\n❌ Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (prompt) prompt.close();

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

createFirstAdmin();
