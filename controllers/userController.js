const User = require("../models/User");

const getAllSRs = async (req, res) => {
  try {
    const srs = await User.find({ role: "sr" }).select("_id username");
    res.status(200).json(srs);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

module.exports = {
  getAllSRs
};
