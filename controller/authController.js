const db = require("../config/config");
require('dotenv').config();
const bcrypt = require("bcrypt"); 
const jwt = require("jsonwebtoken"); 

const SECRET_KEY = "your_secret_key"; 

// Hàm đăng nhập
const login = async (req, res) => {
    try {
        const { email, matkhau, vaitro } = req.body;

        // Kiểm tra đầu vào
        if (!email || !matkhau) {
            return res.status(400).send({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin",
            });
        }
        let query;
        if(vaitro === "sv"){
            query = "SELECT id_sv as id, email, matkhau, ten_sv as ten, vaitro , trangthai FROM sinhvien WHERE email = ?";
        }else if(vaitro === "gv"){
            query = "SELECT id_gv as id, email, matkhau , ten , vaitro, trangthai FROM giangvien WHERE email = ?";
        }
        else{
            return res.status(500).send({
                success: false,
                message: "Nhập vai trò.",
            });
        }
        // Truy vấn user từ database (lọc theo email)
        db.query(query, [email], async (err, results) => {
            if (err) {
                console.error("Database error:", err.message);
                return res.status(500).send({
                    success: false,
                    message: "Lỗi kết nối db.",
                });
            }

            if (results.length === 0) {
                return res.status(404).send({
                    success: false,
                    message: "Không tìm thấy user.",
                });
            }

            const user = results[0];

            // Kiểm tra mật khẩu
            const isPasswordValid = await bcrypt.compare(matkhau, user.matkhau);
            if (!isPasswordValid) {
                return res.status(401).send({
                    success: false,
                    message: "Sai tài khoản hoặc mật khẩu.",
                });
            }
            console.log(user.id_sv)
            // Tạo token JWT
            const token = jwt.sign({ user }, SECRET_KEY, {
                expiresIn: "1d",
            });
            res.setHeader("Authorization", `Bearer ${token}`);

            // Trả về token cho client
            return res.status(200).send({
                success: true,
                message: "Thành công!",
                token,
                
            });
        });
    } catch (error) {
        console.error("Error in login:", error.message);
        res.status(500).send({
            success: false,
            message: "Internal server error.",
            error: error.message,
        });
    }
};

const checkAuth = (req, res, next) => {
    const token = req.header("Authorization");
    // Kiểm tra nếu không có token
    if (!token) {
        return res.status(401).send({
            success: false,
            message: "Không có token, yêu cầu đăng nhập.",
        });
    }

    // Token có dạng: "Bearer <token>", nên tách lấy phần token
    const tokenPart = token.split(" ")[1];

    // Verify token
    jwt.verify(tokenPart, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send({
                success: false,
                message: "Token không hợp lệ hoặc đã hết hạn.",
            });
        }

        // Nếu token hợp lệ, lưu thông tin người dùng (id, email, etc.) vào req.user
        req.user = decoded;
        next();  // Tiếp tục với các middleware hoặc route tiếp theo
    });
};



// Hàm logout
const logout = (req, res) => {
    try {
        // Xóa token khỏi headers của response
        res.setHeader("Authorization", "");

        return res.status(200).send({
            success: true,
            message: "Đăng xuất thành công!",
        });
    } catch (error) {
        console.error("Error in logout:", error.message);
        res.status(500).send({
            success: false,
            message: "Internal server error.",
            error: error.message,
        });
    }
};

module.exports = {
    login,
    checkAuth,
    logout
};
