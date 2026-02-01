const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = async (userData) => {
  const { firstName, lastName, email, phone, password } = userData;

  // 1. Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User with this email already exists.");
  }

  // 2. Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. Create a new user
  const user = new User({
    firstName,
    lastName,
    email,
    phone,
    password: hashedPassword,
  });

  // 4. Save the user to the database
  const newUser = await user.save();

  // Remove password from the returned object for security
  newUser.password = undefined;
  return newUser;
};

const login = async (credentials) => {
  const { email, password } = credentials;

  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid email or password.");
  }

  const payload = {
    userId: user._id,
    role: user.role,

    ...(user.branch_id && { branch_id: user.branch_id }),
    ...(user.permissions &&
      user.permissions.length > 0 && { permissions: user.permissions }),
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET);

  user.password = undefined;

  return { user, token };
};

const loginWithGoogle = async (googleProfile) => {
  const { email, name, image, id } = googleProfile;

  // Split full name into first + last
  const [firstName, ...rest] = name.split(" ");
  const lastName = rest.join(" ") || "";

  let user = await User.findOne({ email });

  if (!user) {
    // 2. Create a new user
    user = new User({
      firstName,
      lastName,
      email,
      authProvider: "google",
      // You can store Google ID or image if you want
      googleId: id,
      profileImage: image,
    });
    await user.save();
  }

  // 3. Generate JWT
  const payload = {
    userId: user._id,
    role: user.role,
    ...(user.branch_id && { branch_id: user.branch_id }),
    ...(user.permissions?.length > 0 && { permissions: user.permissions }),
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET);
  return { user, token };
};

module.exports = {
  register,
  login,
  loginWithGoogle,
};
