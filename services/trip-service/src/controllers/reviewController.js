const { pool } = require('../config/db');

// 1. [GET] /api/trips/:id/reviews - Lấy danh sách đánh giá của chuyến xe
async function getTripReviews(req, res) {
  try {
    const tripId = parseInt(req.params.id, 10);

    const [reviews] = await pool.query(
      `SELECT id, trip_id, user_id, customer_name, rating, comment, created_at
       FROM reviews
       WHERE trip_id = ?
       ORDER BY created_at DESC`,
      [tripId]
    );

    let avgRating = 5.0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      avgRating = parseFloat((sum / reviews.length).toFixed(1));
    }

    return res.status(200).json({
      success: true,
      data: {
        trip_id: tripId,
        average_rating: avgRating,
        total_reviews: reviews.length,
        reviews: reviews
      }
    });
  } catch (error) {
    console.error('Lỗi getTripReviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách đánh giá.'
    });
  }
}

// 2. [POST] /api/trips/:id/reviews - Viết đánh giá cho chuyến xe
async function createTripReview(req, res) {
  try {
    const tripId = parseInt(req.params.id, 10);
    const { rating, comment, customer_name } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Số sao đánh giá phải từ 1 đến 5 sao!'
      });
    }

    // Nếu người dùng đã đăng nhập (có token) thì lấy từ req.user, ngược lại lấy từ req.body
    const userId = req.user?.id || 4; // Mặc định ID khách mẫu nếu chưa truyền token
    const authorName = req.user?.fullName || customer_name || 'Hành khách EcoBus';

    const [result] = await pool.query(
      `INSERT INTO reviews (trip_id, user_id, customer_name, rating, comment, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [tripId, userId, authorName.trim(), parseInt(rating, 10), comment ? comment.trim() : '']
    );

    return res.status(201).json({
      success: true,
      message: 'Cảm ơn bạn đã gửi đánh giá cho chuyến xe!',
      data: {
        id: result.insertId,
        trip_id: tripId,
        user_id: userId,
        customer_name: authorName,
        rating: parseInt(rating, 10),
        comment: comment ? comment.trim() : '',
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Lỗi createTripReview:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo đánh giá.'
    });
  }
}

module.exports = {
  getTripReviews,
  createTripReview
};
