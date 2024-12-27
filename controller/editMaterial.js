const db = require("../config/config"); // Kết nối MySQL
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');

// Cấu hình multer để lưu trữ tệp
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); // Thư mục lưu tệp
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`); // Tạo tên tệp duy nhất
  }
});

// Khởi tạo multer middleware
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Chỉ chấp nhận các định dạng tệp cụ thể
    const fileTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);


    if (extName && mimeType) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận các định dạng: JPEG, PNG, PDF, DOC, DOCX'));
    }
  }
});

// Middleware xử lý upload tệp
const uploadMiddleware = upload.single('file'); // 'file' là tên trường trong form-data

// API sửa thông tin tài liệu
const editMaterial = async (req, res) => {
  const { id_tailieu } = req.params; // Lấy id_tailieu từ URL
  const { ten_tl, mota, theloai } = req.body; // Lấy thông tin từ body yêu cầu
  const id = req.user.user.id;
  const vaitro = req.user.user.vaitro;
  console.log(id, vaitro)
  const [document] = await db.promise().execute('SELECT * FROM tailieu WHERE id_tailieu = ?', [id_tailieu]);

  const malop = document[0].malop
  const [check] = await db.promise().query(`SELECT id_gv FROM lophoc WHERE malop = ? ;`, [malop]);
  if(!id_tailieu){
    return res.status(400).send({
      success: false,
      message: "Thiếu id_tailieu",
    });
  }
  if (!ten_tl && !mota && !theloai && !req.file) {
    return res.status(400).send({
      success: false,
      message: "Vui lòng nhập thông tin",
    });
  }
  try {
    // Kiểm tra xem tài liệu có tồn tại không
    if (document.length === 0 || !id_tailieu) {
      return res.status(400).send({
        success: false,
        message: "Tài liệu không tồn tại",
      });
    }

    if (id == check[0].id_gv & vaitro == "gv") {
      // Cập nhật thông tin tài liệu
      const updates = [];
      const values = [];
      let fileName = document[0].file; // Giữ nguyên đường dẫn tệp nếu không upload mới

      if (req.file) {
        fileName = req.file.filename; // Lấy đường dẫn tệp mới nếu có upload
        updates.push('file = ?');
        values.push(fileName);
      }
      if (ten_tl) {
        updates.push('ten_tl = ?');
        values.push(ten_tl);
      }
      if (mota) {
        updates.push('mota = ?');
        values.push(mota);
      }
      if (theloai) {
        updates.push('theloai = ?');
        values.push(theloai);
      }
      values.push(id_tailieu);
      const query = `UPDATE tailieu SET ${updates.join(', ')} WHERE id_tailieu = ?`;
      await db.promise().execute(query, values);
      const a = req.file
      const [moi] = await db.promise().query('SELECT * FROM tailieu WHERE id_tailieu = ?', [id_tailieu]);
      res.status(200).json({
        message: 'Cập nhật tài liệu thành công',
        moi,
        cũ: document
      });
    } else {
      return res.status(400).send({
        success: false,
        message: "Không có quyền truy cập",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi khi cập nhật tài liệu' });
  }
};

module.exports = {
  editMaterial,
  uploadMiddleware
};
