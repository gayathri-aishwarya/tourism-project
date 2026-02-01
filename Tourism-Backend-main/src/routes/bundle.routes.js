// src/routes/bundle.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/bundle.controller");

const { protect, isMasterAdmin } = require("../middlewares/auth.middleware");

router.post("/", protect, isMasterAdmin, controller.createBundle); // Admin only    //done_bodyneeded
router.get("/", controller.getBundles); // Public        //done
router.get("/:id", controller.getBundleById); // Public        //done
router.put("/:id", protect, isMasterAdmin, controller.updateBundle); // Admin only     //done
router.delete("/:id", protect, isMasterAdmin, controller.deleteBundle); // Admin only //done

module.exports = router;
