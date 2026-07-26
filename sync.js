require('dotenv').config();
const sequelize = require('./src/config/db');
require('./src/models/index');

sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ Đã tạo/cập nhật bảng Reviews thành công!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  });
