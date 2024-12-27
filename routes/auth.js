const express = require('express')
const auth = require("../controller/authController")
const router = express.Router()

router.post("/login", auth.login )
router.post("/logout", auth.logout )
router.post("/check", auth.checkAuth )


module.exports = router