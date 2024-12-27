const express = require('express')
const classes = require("../controller/classController")
const material = require("../controller/materialController")
const auth = require("../controller/authController")
const diemdanh = require("../controller/diemdanhController")
const { editMaterial, uploadMiddleware } = require('../controller/editMaterial')

const router = express.Router()


router.get("/get_class_list", auth.checkAuth, classes.getClasses )
router.put("/edit_class/:id", auth.checkAuth, classes.editClass )

router.get("/get_material_list", auth.checkAuth, material.getMaterial )
router.get("/get_material_info", auth.checkAuth, material.getMaterialinfo )
router.delete("/delete_material/:id_tailieu", auth.checkAuth, material.deleteMaterial )

// router.post("/edit_material", auth.checkAuth, material.editMaterial )
router.put('/edit_material/:id_tailieu', auth.checkAuth, uploadMiddleware, editMaterial);

router.post("/take_attendance", auth.checkAuth, diemdanh.diemdanh )
router.post("/get_attendance_record", auth.checkAuth, diemdanh.xemdiemdanh )



module.exports = router