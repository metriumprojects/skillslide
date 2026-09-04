import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";
import cloudinary from "../config/cloudinary.js";
import fs from "fs"
import { generateToken } from "../utils/utils.js";
import axios from "axios";
import { normalizeCurrency, SUPPORTED_CURRENCIES } from "../services/currencyService.js";


const isSellerProfileComplete = (user) =>
  Boolean(user?.sellerName?.trim() && user?.dateOfBirth && user?.country?.trim());

const resolveDisplayName = (user, role = user?.role) => {
  if (role === "teacher") {
    return user.sellerName || user.name || "";
  }
  return user.buyerName || user.sellerName || user.name || "";
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, dateOfBirth, country } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ status: false, message: "Name, email and password are required" });
    }

    if (role === "teacher") {
      if (!dateOfBirth || !country?.trim()) {
        return res.status(400).json({
          status: false,
          message: "Date of birth and country are required for teachers",
        });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ status: false, message: "User already exists" });

    const trimmedName = name.trim();
    const isTeacher = role === "teacher";

    await User.create({
      name: trimmedName,
      buyerName: isTeacher ? undefined : trimmedName,
      sellerName: isTeacher ? trimmedName : undefined,
      dateOfBirth: isTeacher ? new Date(dateOfBirth) : undefined,
      country: isTeacher ? country.trim() : undefined,
      email,
      role,
      password,
      reverseRole: isTeacher,
      publicType: isTeacher,
      isVerified: true,
    });

    return res.status(201).json({
      status: true,
      message: "Registration successful! You can log in now.",
    });
  } catch (error) {
    console.log("err",error)
    res.status(500).json({ status: false, message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      verifyEmailToken: hashedToken,
      verifyEmailExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ status: false, message: "Invalid or expired token" });
    }

    // Verify user
    user.verifyEmailToken = undefined;
    user.verifyEmailExpires = undefined;
    user.isVerified = true;
    await user.save();

    // Generate token for auto login
    const loginToken = generateToken(user._id);

    // Set cookie (for website)
    res.cookie("token", loginToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      status: true,
      token: loginToken,
      message: "Email verified! You are now logged in.",
      user: { _id: user._id, email: user.email },
    });

  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const {
      email,
      password,
      loginAs = "buyer",
      sellerName,
      dateOfBirth,
      country,
    } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ status: false, message: "Invalid credentials" });
    }

    if (user.role !== "user" && user.role !== "teacher") {
      return res.status(401).json({ status: false, message: "Invalid role" });
    }
    if (!user.isVerified) {
      return res.status(401).json({ status: false, message: "Please verify email" });
    }

    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ status: false, message: "Invalid credentials" });
    }

    if (!user.buyerName && user.name && user.role === "user") {
      user.buyerName = user.name;
    }
    if (!user.sellerName && user.name && user.role === "teacher") {
      user.sellerName = user.name;
    }

    const asSeller = loginAs === "seller";

    if (asSeller) {
      const setupProvided = Boolean(
        sellerName?.trim() && dateOfBirth && country?.trim()
      );

      if (!isSellerProfileComplete(user) && !setupProvided) {
        return res.json({
          status: true,
          needsSellerSetup: true,
          message: "Complete teacher profile to continue",
          buyerName: user.buyerName || user.name || "",
        });
      }

      if (setupProvided) {
        user.sellerName = sellerName.trim();
        user.dateOfBirth = new Date(dateOfBirth);
        user.country = country.trim();
      }

      user.role = "teacher";
      user.reverseRole = true;
      user.publicType = true;
      user.name = resolveDisplayName(user, "teacher");
    } else {
      user.role = "user";
      user.publicType = false;
      if (user.sellerName || user.reverseRole) {
        user.reverseRole = true;
      }
      user.name = resolveDisplayName(user, "user");
    }

    await user.save();

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      status: true,
      token,
      _id: user._id,
      email: user.email,
      role: user.role,
      message: "Login successful",
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};


const buildGoogleProfileImage = async (pictureUrl) => {
  if (!pictureUrl) return null;

  try {
    const result = await cloudinary.uploader.upload(pictureUrl, {
      folder: "user_profiles",
      transformation: [{ width: 300, height: 300, crop: "fill" }],
    });
    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Google profile image upload failed:", error.message);
    return {
      url: pictureUrl,
      public_id: null,
    };
  }
};

export const googleLogin = async (req, res) => {
  try {
    const {
      id_token,
      loginAs = "buyer",
      sellerName,
      dateOfBirth,
      country,
    } = req.body;

    if (!id_token) {
      return res.status(400).json({ status: false, message: "Missing Google token" });
    }

    const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`;
    const { data: payload } = await axios.get(googleVerifyUrl);

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    let user = await User.findOne({ email });

    if (!user) {
      const image = await buildGoogleProfileImage(picture);

      user = await User.create({
        googleId,
        email,
        name,
        buyerName: name,
        image: image || undefined,
        role: "user",
        publicType: false,
        isVerified: true,
        verifyEmailToken: null,
        verifyEmailExpires: null,
        password: "",
      });
    } else {
      let shouldSave = false;

      if (!user.googleId && googleId) {
        user.googleId = googleId;
        shouldSave = true;
      }

      if ((!user.image?.url || typeof user.image === "string") && picture) {
        const image = await buildGoogleProfileImage(picture);
        if (image) {
          user.image = image;
          shouldSave = true;
        }
      }

      if (!user.name && name) {
        user.name = name;
        shouldSave = true;
      }

      if (!user.buyerName && (user.name || name)) {
        user.buyerName = user.name || name;
        shouldSave = true;
      }

      if (!user.sellerName && user.name && user.role === "teacher") {
        user.sellerName = user.name;
        shouldSave = true;
      }

      if (shouldSave) {
        await user.save();
      }
    }

    const asSeller = loginAs === "seller";

    if (asSeller) {
      const setupProvided = Boolean(
        sellerName?.trim() && dateOfBirth && country?.trim()
      );

      if (!isSellerProfileComplete(user) && !setupProvided) {
        return res.json({
          status: true,
          needsSellerSetup: true,
          message: "Complete teacher profile to continue",
          buyerName: user.buyerName || user.name || name || "",
        });
      }

      if (setupProvided) {
        user.sellerName = sellerName.trim();
        user.dateOfBirth = new Date(dateOfBirth);
        user.country = country.trim();
      }

      user.role = "teacher";
      user.reverseRole = true;
      user.publicType = true;
      user.name = resolveDisplayName(user, "teacher");
    } else {
      user.role = "user";
      user.publicType = false;
      if (user.sellerName || user.reverseRole) {
        user.reverseRole = true;
      }
      user.name = resolveDisplayName(user, "user");
    }

    await user.save();

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      status: true,
      token,
      message: "Google Login successful",
      role: user.role,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    });

  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ status: false, message: "User not found" });

    const resetToken = user.getResetPasswordToken();
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/new-password/${resetToken}`;
    const message = `<p>You requested a password reset.</p><a href="${resetUrl}">Click here to reset password</a>`;

    const emailResult = await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: message,
    });

    if (!emailResult.status) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(502).json({
        status: false,
        message: "Unable to send password reset email. Please try again later.",
      });
    }

    return res.json({ status: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({ status: false, message: error.message || "Server error" });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ status: false, message: "Invalid or expired token" });

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ status: true, message: "Password reset successful" });
};

export const changePassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    if (newPassword != confirmPassword) {
      return res.status(404).json({ status: false, message: "Please enter confirm password" });
    }
    user.password = newPassword;
    await user.save();

    res.json({ status: true, message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};

//  Get User Profile
export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password -resetPasswordToken -resetPasswordExpire");

  if (user) {
    const normalizedCurrency = normalizeCurrency(user.currency);
    if (user.currency !== normalizedCurrency) {
      user.currency = normalizedCurrency;
      await user.save();
    }
    res.json(user);
  } else {
    res.status(404).json({ status: true, message: "User not found" });
  }
};

export const logoutUser = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ status: true, message: "Logged out successfully" });
};

export const updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: false, message: "No image file uploaded" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      // remove uploaded temp file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // ✅ If user already has an image, delete it from Cloudinary
    if (user.image?.public_id) {
      await cloudinary.uploader.destroy(user.image.public_id);
    }

    // ✅ Upload new image
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "user_profiles",
      transformation: [{ width: 300, height: 300, crop: "fill" }],
    });

    // ✅ Update user document
    user.image = {
      url: result.secure_url,
      public_id: result.public_id,
    };
    await user.save();

    // ✅ Delete the local file (temp)
    fs.unlinkSync(req.file.path);

    res.json({
      status: true,
      message: "Profile image updated successfully",
      image: user.image.url,
    });
  } catch (error) {
    console.error("Error updating image:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      buyerName,
      sellerName,
      dateOfBirth,
      country,
      bio,
      currency,
      youtube,
      instagram,
      hideLesson,
      classHosted,
      publicType,
      confirmPassword,
      newPassword,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (buyerName !== undefined) user.buyerName = String(buyerName).trim();
    if (sellerName !== undefined) user.sellerName = String(sellerName).trim();
    if (dateOfBirth !== undefined && dateOfBirth !== "") {
      user.dateOfBirth = new Date(dateOfBirth);
    }
    if (country !== undefined) user.country = String(country).trim();

    if (name) {
      user.name = name;
      if (user.role === "teacher") {
        user.sellerName = name;
      } else {
        user.buyerName = name;
      }
    } else {
      user.name = resolveDisplayName(user);
    }

    if (bio) user.bio = bio;
    if (currency) {
      const normalizedCurrency = normalizeCurrency(currency, null);
      if (!SUPPORTED_CURRENCIES.includes(normalizedCurrency)) {
        return res.status(400).json({ message: "Unsupported currency" });
      }
      user.currency = normalizedCurrency;
    }
    if (youtube) user.youtube = youtube;
    if (instagram) user.instagram = instagram;
    if (typeof hideLesson === "boolean") user.hideLesson = hideLesson;
    if (typeof publicType === "boolean") user.publicType = publicType;
    if (typeof classHosted === "boolean") user.classHosted = classHosted;

    if (confirmPassword && newPassword) {
      if (confirmPassword != newPassword) {
        return res.status(400).json({ message: "Confirm password is incorrect" });
      }
      user.password = newPassword;
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        buyerName: user.buyerName,
        sellerName: user.sellerName,
        dateOfBirth: user.dateOfBirth,
        country: user.country,
        bio: user.bio,
        currency: user.currency,
        youtube: user.youtube,
        instagram: user.instagram,
        hideLesson: user.hideLesson,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const becomeTeacher = async (req, res) => {
  try {
    const { role, sellerName, dateOfBirth, country, resetSellerInfo } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    if (role === "teacher") {
      if (sellerName?.trim()) user.sellerName = sellerName.trim();
      if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
      if (country?.trim()) user.country = country.trim();

      if (!isSellerProfileComplete(user)) {
        return res.status(400).json({
          status: false,
          needsSellerSetup: true,
          message: "Add teacher name, date of birth and country in your profile first",
        });
      }

      user.role = "teacher";
      user.reverseRole = true;
      user.publicType = true;
      user.name = resolveDisplayName(user, "teacher");
      await user.save();
    } else {
      user.role = "user";
      user.publicType = false;

      if (resetSellerInfo) {
        await User.findByIdAndUpdate(req.user.id, {
          $unset: { sellerName: 1, dateOfBirth: 1, country: 1 },
          $set: {
            role: "user",
            reverseRole: false,
            publicType: false,
            name: resolveDisplayName({ buyerName: user.buyerName, name: user.name }, "user"),
          },
        });
        const updated = await User.findById(req.user.id);
        return res.json({
          status: true,
          message: "Switched to student successfully",
          role: updated.role,
        });
      } else {
        if (user.sellerName) user.reverseRole = true;
        else user.reverseRole = false;
        user.name = resolveDisplayName(user, "user");
        await user.save();
      }
    }

    res.json({
      status: true,
      message: role === "teacher" ? "Switched to teacher successfully" : "Switched to student successfully",
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};
export const isOnlineTeacher = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;



    // Validate authenticated user
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ status: false, message: "Unauthorized: user not authenticated" });
    }

    // Validate Date formats
    if (!startDate && !endDate) {
      return res.status(400).json({
        status: false,
        message: "Provide at least startDate or endDate",
      });
    }

    if (startDate && isNaN(Date.parse(startDate))) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid startDate format" });
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid endDate format" });
    }

    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "User not found" });
    }

    // Update dates
    if (startDate) user.onlineStartDate = new Date(startDate);
    if (endDate) user.onlineEndDate = new Date(endDate);

    await user.save();

    return res.json({
      status: true,
      message: "Teacher online time updated successfully",
      data: {
        id: user._id,
        startDate: user.onlineStartDate,
        endDate: user.onlineEndDate,
      },
    });
  } catch (error) {
    console.error("Error in isOnlineTeacher:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {

    const user = await User.findById(req.params.id).select(
      "-password -resetPasswordToken -resetPasswordExpire"
    );
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    res.json({ status: true, message: "get user successfully", data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};
