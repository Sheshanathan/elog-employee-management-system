const router = require("express").Router();
const auth = require("../middleware/auth"); const admin = require("../middleware/admin"); const leave = require("../controllers/leaveController");
router.post("/leaves", auth, leave.apply);
router.get("/leaves/my", auth, leave.my);
router.get("/leaves", auth, admin, leave.list);
router.patch("/leaves/:id/review", auth, admin, leave.review);
module.exports = router;
