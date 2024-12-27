const db = require("../config/config"); 
const jwt = require("jsonwebtoken");

// const SECRET_KEY = "your_secret_key"; 

const getClasses = async (req, res) => {
    const { id, vaitro } = req.body; 
    const user = req.user.user; 
    try {
        let query;
        if (!user.id || !user.vaitro) {
            return res.status(400).send({
                success: false,
                message: "Người dùng chưa đăng nhập",
            });
        }
        if (user.vaitro === 'gv') {
            query = `
                SELECT lophoc.malop, lophoc.tenlop, giangvien.ten AS ten_gv, 
                (SELECT COUNT(*) FROM ds_lop WHERE ds_lop.malop = lophoc.malop) AS student_count,
                lophoc.trangthai, lophoc.batdau, lophoc.ketthuc
                FROM lophoc
                INNER JOIN giangvien ON lophoc.id_gv = giangvien.id_gv
                WHERE lophoc.id_gv = ?`;
        } else if (user.vaitro === 'sv') {
            query = `
                SELECT lophoc.malop, lophoc.tenlop, giangvien.ten AS ten_gv, 
                (SELECT COUNT(*) FROM ds_lop WHERE ds_lop.malop = lophoc.malop) AS student_count,
                lophoc.trangthai, lophoc.batdau, lophoc.ketthuc
                FROM lophoc
                INNER JOIN giangvien ON lophoc.id_gv = giangvien.id_gv
                INNER JOIN ds_lop ON lophoc.malop = ds_lop.malop
                WHERE ds_lop.id_sv = ?`;
        } else {
            return res.status(400).json({ message: 'Vai trò không hợp lệ' });
        }
    
        const [results] = await db.promise().query(query, [user.id]);
    
        if (!results || results.length === 0) {
            return res.status(200).send({
                message: "Không có lớp học nào",
            });
        } else {
            return res.status(200).json(results);
        }
    } catch (err) {
        console.error('Có lỗi xảy ra:', err.message);
        res.status(500).json({ message: 'Đã có lỗi xảy ra', error: err.message });
    }
};


const editClass = async (req, res) => {
    const malop = req.params.id; // Lấy malop từ URL
    const user = req.user.user; // Lấy thông tin người dùng từ req.user
    const { tenlop, mota, tkb, trangthai } = req.body; // Lấy thông tin từ request body
    try {
        if (!malop) {
            return res.status(400).json({
                message: 'Mã lớp không hợp lệ' 
            });
        }
        const [results] = await db.promise().query('SELECT * FROM lophoc WHERE malop = ?', [malop]);
        console.log(user)
        if (results.length === 0) {
            return res.status(400).json({
                message: 'Không tìm thấy lớp học' 
            });
        }
        if (user.id != results.map(item => item.id_gv) || user.vaitro != "gv"){
            return res.status(400).json({
                message: 'Không có quyền chỉnh sửa' 
            });
        }
        const updates = [];
        const values = [];

        if (tenlop) {
            updates.push('tenlop = ?');
            values.push(tenlop);
        }
        if (mota) {
            updates.push('mota = ?');
            values.push(mota);
        }
        if (tkb) {
            updates.push('tkb = ?');
            values.push(tkb);
        }
        if (trangthai) {
            updates.push('trangthai = ?');
            values.push(trangthai);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                message: 'Không có thông tin để cập nhật' 
            });
        }

        values.push(malop);
        const query = `UPDATE lophoc SET ${updates.join(', ')} WHERE malop = ?`;
        await db.promise().execute(query, values);

        const [moi] = await db.promise().query('SELECT * FROM lophoc WHERE malop = ?', [malop]);
        res.status(200).json({
            message: 'Cập nhật lớp học thành công',
            moi,
            cũ: results
        });
    } catch (err) {
        console.error('Lỗi:', err);
        res.status(500).json({ message: 'Lỗi khi cập nhật lớp học' });
    }
};

module.exports = {
    getClasses,
    editClass
};
