const jwt = require("jsonwebtoken");
const config = require("../db/config.json"); // Adjust the path to your config file

// const authenticateToken = (req, res, next) => {
//   // Extract token from cookies
//   const token = req.cookies.token;
//   //   console.log("cokies ", req.cookies);

//   if (token == null) return res.status(401).json({ error: "Signin Required" });

//   jwt.verify(token, config.secret, (err, user) => {
//     if (err) return res.status(403).json({ error: "Invalid or expired token" });

//     req.user = user; 
//     next(); 
//   });
// };

const authenticateToken = (req, res, next) => {
  // Extract token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ error: "Signin Required" });

  jwt.verify(token, config.secret, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });

    req.user = user; 
    console.log("user ", req.user);
    next(); 
  });
};



module.exports = authenticateToken;
