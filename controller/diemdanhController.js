const db = require("../config/config"); // Kết nối MySQL

const diemdanh = async (req, res) => {
    const user = req.user.user; // Lấy thông tin người dùng từ req.user
    const { malop, ngay, list } = req.body;
    if(!malop){
        return res.status(400).send({
            success: false,
            message: "Thiếu mã lớp",
        });
    }
    if(!ngay){
        return res.status(400).send({
            success: false,
            message: "Thiếu ngày điểm danh",
        });
    }
    try {
        // Kiểm tra xem lớp học có tồn tại không
        const [lop] = await db.promise().query('SELECT * FROM lophoc WHERE malop = ?', [malop]);
        if (lop.length === 0) {
            return res.status(400).json({
                message: 'Không tìm thấy lớp học' 
            });
        }
        if (user.id != lop.map(item => item.id_gv) || user.vaitro != "gv"){
            return res.status(400).json({
                message: 'Không có quyền chỉnh sửa' 
            });
        }
        const batdau = lop[0].batdau
        const ketthuc = lop[0].ketthuc;
        const date = new Date(ngay);
        if (date >= batdau && date <= ketthuc) {
            if (Array.isArray(list) && list.every(item => item.id)) {
                const [ds_nghi] = await db.promise().query(`SELECT id_sv as id FROM ds_lop WHERE malop = 151779 AND id_sv IN (${list.map(item => item.id).join(', ')});`);
                const vang = list.map(item => `('${item.id}', '${malop}', '${ngay}', '2')`).join(', ');
                const sql_vang = `INSERT INTO diemdanh (id_sv, malop, ngay, trangthai) VALUES ${vang};`;
                // const [ds_dihoc] = await db.promise().query(`SELECT id_sv as id FROM ds_lop WHERE malop = 151779 AND id_sv NOT IN (${list.map(item => item.id).join(', ')});`);
                // const dihoc = ds_dihoc.map(item => `('${item.id}', '${malop}', '${ngay}', '1')`).join(', ');
                // const sql_dihoc = `INSERT INTO diemdanh (id_sv, malop, ngay, trangthai) VALUES ${dihoc};`;

                console.log(list);
                console.log(ds_nghi);
                if (list.length !== ds_nghi.length) {
                    return res.status(400).send({
                        success: false,
                        message: "Sai danh sách sinh viên",
                    });
                }
                for (let i = 0; i < list.length; i++) {
                    if (list[i].id !== ds_nghi[i].id ) {
                        return res.status(400).send({
                            success: false,
                            message: "Sai danh sách sinh viên",
                        });
                    }
                }
  
                db.query(sql_vang, (err, result) => {
                    if (err) {
                        console.error('Lỗi khi thực thi SQL:', err);
                        res.status(500).send('Lỗi server');
                    } else {
                        // db.query(sql_dihoc)
                        res.send('Thêm dữ liệu thành công!');
                    }
                });
            } else {
                res.status(400).send('Dữ liệu không hợp lệ');
            }
        } else {
            return res.status(400).send({
                success: false,
                message: "Ngày không hợp lệ",
            });
        }
    } catch (err) {
        console.error('Lỗi:', err);
        res.status(500).json({ message: 'Lỗi khi điểm danh' });
    }
}

const xemdiemdanh = async (req,res) => {
    const {malop} = req.body;
    const id = req.user.user.id; 
    const vaitro = req.user.user.vaitro;

    if(!malop){
        return res.status(400).send({
            success: false,
            message: "Thiếu mã lớp",
        });
    }

    try {
        const [count] = await db.promise().query('SELECT count(*) as count FROM ds_lop WHERE malop = ? and id_sv = ?', [malop, id]);
        console.log(count[0].count)
        if(count[0].count != "1" || vaitro != "sv"){
            return res.status(400).send({
                success: false,
                message: "Chỉ sinh viên lớp mới được xem",
            });
        }

        const [record] = await db.promise().query('SELECT * FROM diemdanh WHERE malop = ? and id_sv = ?', [malop, id]);
        // console.log(record)
        if(record.length == 0){
            return res.status(200).send({
                message: "Sinh viên không có bản ghi điểm danh trong lớp"
            })
        }
        return res.status(200).send({
            record
        })

    } catch (err) {
        console.error('Lỗi:', err);
        res.status(500).json({ message: 'Lỗi khi kiểm tra điểm danh' });
    }
}

module.exports = {
    diemdanh,
    xemdiemdanh
}