
const jwt = require("jsonwebtoken");
const config = require("../../src/config/auth.config.js");

exports.verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];
  console.log(token);
  if (!token) {
    return res.status(403).send({
      success: false,
      message: "No token provided!",
      data: []
    });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized!",
        data: []
      });
    }
    req.logged_in_id = decoded.id;
    req.clientCode = decoded.clientCode;
    req.userName = decoded.userName;
    req.userId= decoded.id;
    // req.logged_in_id = decoded.id;
    // req.logged_in_id = decoded.id;
    console.log(req.logged_in_id, req.clientCode);
    next();
  });
  // next();
};


exports.verifyOTPToken = (req, res, next) => {
  let token = req.headers["otp_token"];
  console.log(token);
  if (!token) {
    return res.status(403).send({
      success: false,
      message: "No OTP token provided!",
      data: []
    });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized OTP token!",
        data: []
      });
    }
    req.otp_token_id = decoded.id;
    console.log(decoded);
    next();
  });
  // next();
};

exports.verifyForgotPassToken = (req, res, next) => {
  let token = req.headers["forgot_pass_token"];
  console.log(token);
  if (!token) {
    return res.status(403).send({
      success: false,
      message: "No OTP token provided!",
      data: []
    });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized OTP token!",
        data: []
      });
    }
    req.forgot_pass_token_id = decoded.id;
    console.log(decoded);
    next();
  });
  // next();
};