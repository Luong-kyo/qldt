const db = require("../config/config"); // Kết nối MySQL
const multer = require('multer');
const path = require('path');


const getMaterial = async (req, res) => {
    const { malop } = req.body;
    const user = req.user.user; // Lấy thông tin người dùng từ req.user
    const [lop] = await db.promise().query(`SELECT tenlop FROM lophoc WHERE malop = ?;`, [malop]);
    if (!lop || lop.length === 0) {
        return res.status(400).send({
            success: false,
            message: "Lớp không tồn tại",
        });
    }
    try {
        let query;
        if (!malop) {
            return res.status(400).send({
                success: false,
                message: "Chưa nhập mã lớp",
            });
        }

        if (user.vaitro === "sv") {
            const [check] = await db.promise().query(`SELECT count(*) as count FROM ds_lop WHERE id_sv = ? and malop = ? ;`, [user.id, malop]);
            if (check[0].count = 0) {
                return res.status(400).send({
                    success: false,
                    message: "Không có quyền truy cập",
                });
            }
            query = `SELECT tailieu.id_tailieu,
            tailieu.ten_tl,
            tailieu.malop,
            tailieu.mota,
            tailieu.file,
            tailieu.theloai
            FROM tailieu 
            INNER JOIN lophoc ON tailieu.malop = lophoc.malop
            INNER JOIN ds_lop ON ds_lop.malop = lophoc.malop
            INNER JOIN sinhvien ON ds_lop.id_sv = sinhvien.id_sv
            WHERE sinhvien.id_sv = ? and lophoc.malop = ?`
        } else if (user.vaitro === "gv") {
            const [check] = await db.promise().query(`SELECT id_gv FROM lophoc WHERE malop = ? ;`, [malop]);
            if (user.id != check[0].id_gv) {
                return res.status(400).send({
                    success: false,
                    message: "Không có quyền truy cập",
                });
            }
            query = `SELECT tailieu.id_tailieu,
                    tailieu.ten_tl,
                    tailieu.malop,
                    tailieu.mota,
                    tailieu.file,
                    tailieu.theloai
                    FROM tailieu 
            INNER JOIN lophoc ON tailieu.malop = lophoc.malop
            INNER JOIN giangvien ON lophoc.id_gv = giangvien.id_gv
            WHERE giangvien.id_gv = ? and  lophoc.malop = ?`
        } else {
            return res.status(400).json({ message: 'Vai trò không hợp lệ' });
        }

        const [results] = await db.promise().query(query, [user.id, malop]);
        if (!results || results.length === 0) {
            return res.status(200).send({
                message: "Không có tài liệu nào",
            });
        } else {
            return res.status(200).json(results);
        }

    } catch (err) {
        console.error('Có lỗi xảy ra:', err.message);
        // Trả về lỗi nếu có
        res.status(500).json({ message: 'Đã có lỗi xảy ra', error: err.message });
    }
};

const getMaterialinfo = async (req, res) => {
    const { id_tailieu } = req.body;
    const user = req.user.user; // Lấy thông tin người dùng từ req.user
    if (!id_tailieu) {
        return res.status(400).send({
            success: false,
            message: "Chưa nhập mã tài liệu",
        });
    }
    const [laymalop] = await db.promise().query(`SELECT malop FROM tailieu WHERE id_tailieu = ? ;`, [id_tailieu])
    if (laymalop.length === 0) {
        return res.status(400).send({
            success: false,
            message: "Không tồn tại tài liệu",
        });
    }
    const malop = laymalop[0].malop

    try {
        let query;
        if (user.vaitro === "sv") {

            console.log(malop)
            const [check] = await db.promise().query(`SELECT count(*) as count FROM ds_lop WHERE id_sv = ? and malop = ? ;`, [user.id, malop]);
            if (check[0].count === 0) {
                return res.status(400).send({
                    success: false,
                    message: "Không có quyền truy cập",
                });
            }

        } else if (user.vaitro === "gv") {
            const [check] = await db.promise().query(`SELECT id_gv FROM lophoc WHERE malop = ? ;`, [malop]);
            console.log(malop)
            if (user.id != check[0].id_gv) {
                return res.status(400).send({
                    success: false,
                    message: "Không có quyền truy cập",
                });
            }
        } else {
            return res.status(400).json({ message: 'Vai trò không hợp lệ' });
        }

        const [results] = await db.promise().query(`SELECT * FROM tailieu WHERE id_tailieu = ?`, [id_tailieu]);
        if (!results || results.length === 0) {
            return res.status(200).send({
                message: "Không có tài liệu nào",
            });
        } else {
            return res.status(200).json(results);
        }

    } catch (err) {
        console.error('Có lỗi xảy ra:', err.message);
        // Trả về lỗi nếu có
        res.status(500).json({ message: 'Đã có lỗi xảy ra', error: err.message });
    }
};

const deleteMaterial = async (req, res) => {
    const { id_tailieu } = req.params;
    const user = req.user.user; // Lấy thông tin người dùng từ req.user

    if (!id_tailieu) {
        return res.status(400).send({
            success: false,
            message: "Không tìm thấy tài liệu",
        });
    }
    try {
        const [count] = await db.promise().execute('SELECT count(*) as c FROM tailieu WHERE id_tailieu = ?', [id_tailieu]);
        if (count[0].c === 0) {
            return res.status(400).send({
                success: false,
                message: "Tài liệu không tồn tại",
            });
        }
        const [check] = await db.promise().execute('SELECT lophoc.malop, lophoc.id_gv FROM lophoc INNER JOIN tailieu ON tailieu.malop = lophoc.malop WHERE id_tailieu = ?', [id_tailieu]);
        if (user.vaitro != "gv" || user.id != check[0].id_gv) {
            return res.status(400).send({
                success: false,
                message: "Không có quyền xóa tài liệu",
            });
        }

        await db.promise().execute('DELETE FROM tailieu WHERE id_tailieu = ?', [id_tailieu]);

        res.status(200).json({
            id_tailieu,
            message: 'Xóa lớp học thành công'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi xóa lớp học' });
    }
};


module.exports = {
    getMaterial,
    getMaterialinfo,
    deleteMaterial
};
