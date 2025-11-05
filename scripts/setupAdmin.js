import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/auth.model.js";

dotenv.config();

const setupAdmin = async () => {
  try {
    // Connect to MongoDB using the same connection string from db.js
    await mongoose.connect("mongodb+srv://maryamrasheed690_db_user:maryam123@cluster0.yeurfyw.mongodb.net/CVMaker", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Step 1: Update all existing users to have isAdmin: false
    const updateResult = await User.updateMany(
      { isAdmin: { $exists: false } }, // Only update users without isAdmin field
      { $set: { isAdmin: false } }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} existing users with isAdmin: false`);

    // Step 2: Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin786@gmail.com" });
    
    if (existingAdmin) {
      console.log("⚠️ Admin user already exists!");
      
      // Update existing user to be admin
      existingAdmin.isAdmin = true;
      existingAdmin.password = "Admin@123"; // This will trigger the pre-save hash
      await existingAdmin.save();
      console.log("✅ Updated existing user to admin role");
    } else {
      // Step 3: Create new admin user
      const adminUser = new User({
        firstName: "Admin",
        lastName: "User",
        education: "Administration",
        email: "admin786@gmail.com",
        password: "Admin@123",
        isAdmin: true,
      });

      await adminUser.save();
      console.log("✅ Admin user created successfully!");
    }

    // Step 4: Display admin credentials
    console.log("\n🔐 Admin Credentials:");
    console.log("   Email: admin786@gmail.com");
    console.log("   Password: Admin@123");
    console.log("   isAdmin: true");

    // Step 5: Display summary
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ isAdmin: true });
    const regularUsers = await User.countDocuments({ isAdmin: false });

    console.log("\n📊 Summary:");
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Admin Users: ${adminUsers}`);
    console.log(`   Regular Users: ${regularUsers}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting up admin:", error.message);
    process.exit(1);
  }
};

setupAdmin();
