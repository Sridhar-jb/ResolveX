const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const registerUser = async (req, res) => {
  try {
    const body = req.body || {};
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const { password } = body;
    if (!name || !email || !password) return res.status(400).json({ success:false, message:"Name, email and password are required" });
    if (password.length < 6) return res.status(400).json({ success:false, message:"Password must be at least 6 characters" });
    if (await User.findOne({ email })) return res.status(400).json({ success:false, message:"User already exists. Please login." });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ success:true, message:"User Registered Successfully", user:{ id:user._id, name:user.name, email:user.email, role:user.role } });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success:false, message:"Registration failed", error: process.env.NODE_ENV === "production" ? undefined : error.message });
  }
};
const loginUser = async (req,res)=>{ try {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success:false, message:"Server authentication is not configured" });
  }
  const body = req.body || {};
  const email=body.email?.trim().toLowerCase(); const {password}=body;
  const user=await User.findOne({email}); if(!user) return res.status(404).json({success:false,message:"User not found"});
  if(!(await bcrypt.compare(password,user.password))) return res.status(401).json({success:false,message:"Invalid password"});
  const token=jwt.sign({id:user._id,role:user.role},process.env.JWT_SECRET,{expiresIn:"7d"});
  res.json({success:true,message:"Login Successful",token,user:{id:user._id,name:user.name,email:user.email,role:user.role}});
} catch(error){res.status(500).json({success:false,message:error.message});}};
module.exports={registerUser,loginUser};
