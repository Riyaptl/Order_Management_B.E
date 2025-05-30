const Shop = require("../models/Shop");
const Area = require("../models/Area");
const Order = require("../models/Order");
const { Parser } = require("json2csv");
const { ObjectId } = require("mongodb");

// 1. Create Shop
const createShop = async (req, res) => {
  try {
    const { name, address, contactNumber, addressLink, areaId } = req.body;
    const shop = new Shop({ name, address, contactNumber, addressLink, createdBy: req.user.username });
    await shop.save();

    await Area.findByIdAndUpdate(areaId, { $push: { shops: shop._id } });

    res.status(201).json("Shop created successfully");
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 2. Update Shop (only passed fields)
const updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    const allowedFields = ["name", "address", "contactNumber", "addressLink"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    updates["updatedBy"] = req.user.username
    
    const updatedShop = await Shop.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedShop) return res.status(404).json("Shop not found");

    res.status(200).json(updatedShop);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 3. Delete Shop
const deleteShop = async (req, res) => {
  try {
    const { id, areaId } = req.body;
    const deletedShop = await Shop.findByIdAndDelete(id);
    if (!deletedShop) return res.status(404).json("Shop not found");

    await Area.findByIdAndUpdate(areaId, { $pull: { shops: id } });

    res.status(200).json({"message": "Shop deleted and removed from respective route"});
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 4. Get shops under a specific area
const getShopsByArea = async (req, res) => {
  try {
    const { areaId } = req.body;
    const areaShops = await Area.findById(areaId).populate({
      path: "shops",
      select: "name address addressLink contactNumber createdBy updatedBy", 
    });

    if (!areaShops) return res.status(404).json("Area not found");

    res.status(200).json({
      shops: areaShops.shops,
    });

   
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 5. Get shop details
const getShopDetailes = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findById(id);

    if (!shop) return res.status(404).json("Shop not found");

    res.status(200).json(shop);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// 6. Change area 
const shiftArea = async (req, res) => {
  try {
    const { prevAreaId, newAreaId, id } = req.body;
    
    const prevArea = await Area.findByIdAndUpdate(prevAreaId, { $pull: { shops: id } });
    if (!prevArea) return res.status(404).json("Area not found");
    
    const newArea = await Area.findByIdAndUpdate(newAreaId, { $push: { shops: id } });
    if (!newArea) return res.status(404).json("Area not found");
    
    const areaId = new ObjectId(newAreaId);
    await Order.updateMany({shopId: id}, { $set: { areaId } });
    res.status(200).json({"message": "Shop has been moved successfully"});

  } catch (error) {
    res.status(500).json(error.message);
  }
};


// 7. CSV Export
const csvExportShop = async (req, res) => {
  try {
    const { areaId } = req.body;

    if (!areaId) {
      return res.status(400).json({ message: "Area parameter is required" });
    }

    const area = await Area.findById(areaId)
      .populate({
      path: "shops",
      select: "name address addressLink contactNumber createdBy updatedBy", 
    }).sort({ createdAt: -1 })
    const shops = area.shops

    const formattedShops = shops.map(shop => {
    
      const row = {
        Name: shop?.name || "",
        Contact: shop?.contactNumber || "",
        Address: shop?.address || "",
      };
      return row;
    });
  
    const fields = [
      "Name",
      "Contact",
      "Address",
    ];
    
    
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formattedShops);
       
    res.header("Content-Type", "text/csv");
    res.attachment("shops.csv");
    return res.send(csv);

  } catch (error) {
    res.status(500).json(error.message);
  }
};


module.exports = {
  createShop,
  updateShop,
  deleteShop,
  getShopsByArea,
  getShopDetailes,
  csvExportShop,
  shiftArea
};
