const catchAsyncError = require("../middlewares/catchasync");
const User = require("../models/usermodel");
const sendToken = require("../utils/sendToken");
const jwt = require("jsonwebtoken");

exports.registerUser = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;
  const user = await User.create({
    name,
    email,
    password,
  });
  sendToken(user, 201, res);
});

//login user
exports.loginUser = catchAsyncError(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    //checking if user has given password and email both
    if (!email || !password) {
      return next(new ErrorHandler("Please Enter Email and Password", 400));
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(new ErrorHandler("Invalid Email Or Password", 401));
    }
    const isPasswordMatched = user.comparePassword(password);
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Invalid Email Or Password", 401));
    }
    sendToken(user, 200, res);
  } catch (error) {
    return res
      .status(404)
      .json({ success: false, message: "some error occured" });
  }
});

exports.isAuth = catchAsyncError(async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Authorization token missing" });
    }
    token = req.headers.authorization.split(" ")[1];

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    req.user = user;
    res.status(200).json({ success: true, message: "Authorized" });
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
});
