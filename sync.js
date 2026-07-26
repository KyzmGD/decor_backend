require('dotenv').config();
const sequelize = require('./src/config/db');
require('./src/models/index');

// Chỉ tạo bảng mới, không alter bảng cũ
sequelize.sync({ force: false })
  .then(() => {
    console.log('✅ Đã tạo bảng Wishlists và CartItems thành công!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  });
